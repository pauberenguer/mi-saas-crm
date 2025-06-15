// ─────────────────────────────────────────────────────────────────────────────
//  src/components/Conversation.tsx
// ─────────────────────────────────────────────────────────────────────────────
//
//  CAMBIOS PRINCIPALES (★):
//  1. buildSnippet()      → Detecta m.etiquetas?.video === true  ➜  "🎞️ Vídeo"
//  2. isVid               → Ahora true si m.etiquetas?.video === true ᴏ  URL .mp4
//  3. Comentarios actualizados allí donde aplica                   (★)
//
//  Todo lo demás se conserva tal cual pediste.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import imageCompression from "browser-image-compression";
import {
  Image as ImageIcon,
  Paperclip,
  Mic,
  FileText,
  Trash2,
  Pause,
  Play,
  Video,
} from "lucide-react";
import { MessageContent, MessageType, MessageOrigin } from "../types/database";

/* ----------------------------------------------------------------------- */
/*  Tipos y helpers básicos                                                */
/* ----------------------------------------------------------------------- */
interface ConversationProps {
  contactId: string;
  messageMode: "Responder" | "Nota";
  setMessageMode: (m: "Responder" | "Nota") => void;
}

type TemplateItem = { name: string; category: string; language: string };
type TemplateFull = TemplateItem & { body_text: string };

const getMessageStyle = (t: string) => {
  if (t === "human") return { backgroundColor: "#f1f3f5", color: "black" };
  if (t === "ai") return { backgroundColor: "#eff7ff", color: "black" };
  if (t === "member") return { backgroundColor: "#0084ff", color: "white" };
  if (t === "nota") return { backgroundColor: "#fdf0d0", color: "black" };
  return {};
};

/* ----------------------------------------------------------------------- */
/*  buildSnippet — máximo 40 caracteres                                    */
/*  Sólo muestra 📸 si el content ES URL de imagen (.jpg/.jpeg/.png)        */
/*  ★ Añadido soporte a etiqueta video ★                                    */
/* ----------------------------------------------------------------------- */
const IMG_RE = /\.(jpe?g|png)$/i;
interface MessageRow {
  id: number;
  session_id: string;
  created_at: string;
  message: string | Record<string, unknown>;
  [key: string]: unknown;
}



const buildSnippet = (row: MessageRow) => {
  if (!row) return "";
  const m =
    typeof row.message === "string" ? JSON.parse(row.message) : row.message;
  const c = (m.content || "").trim();

  if (m.etiquetas?.audio) return "🎤 Audio";
  if (m.etiquetas?.fotos && IMG_RE.test(c)) return "📸 Fotos";
  if (m.etiquetas?.video) return "🎞️ Vídeo";            // ★
  if (/\.mp4/i.test(c)) return "🎞️ Vídeo";
  if (/\.pdf/i.test(c)) return "📄 PDF";
  if (/\.docx?/i.test(c)) return "📄 Documento";

  return c.length > 40 ? `${c.slice(0, 40)}...` : c || "(vacío)";
};

/* ----------------------------------------------------------------------- */
/*  Conversión WebM → OGG/Opus con ffmpeg.wasm                             */
/* ----------------------------------------------------------------------- */
async function convertWebmToOgg(webm: Blob): Promise<Blob> {
  // Simplificamos: devolvemos el webm original
  return webm;
}

/* ----------------------------------------------------------------------- */
/*  Helper para insertar mensajes con manejo de errores                    */
/* ----------------------------------------------------------------------- */
async function insertMessage(
  contactId: string, 
  messageData: MessageContent, 
  errorPrefix: string
): Promise<boolean> {
  // Crear el objeto para insertar sin incluir el campo 'id' 
  // ya que debería ser autogenerado por PostgreSQL
  const insertData = {
    session_id: contactId,
    message: messageData,
    // Omitimos 'id' para que PostgreSQL lo genere automáticamente
    // Omitimos 'created_at' para usar el default de la tabla
  };

  const { error } = await supabase.from("conversaciones").insert([insertData]);

  if (error) {
    console.error(`${errorPrefix}:`, error);
    console.error("Datos del mensaje que causó el error:", JSON.stringify(messageData, null, 2));
    console.error("Contact ID:", contactId);
    console.error("Detalles del error de Supabase:", error);
    return false;
  }
  return true;
}

/* ----------------------------------------------------------------------- */
/*  Componente principal                                                   */
/* ----------------------------------------------------------------------- */
export default function Conversation({
  contactId,
  messageMode,
  setMessageMode,
}: ConversationProps) {
  const router = useRouter();

  /* ---------------- ESTADOS PRINCIPALES ---------------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  /* ---------------- OTROS ESTADOS ---------------------- */
  const [ownAvatarUrl, setOwnAvatarUrl] = useState<string | null>(null);

  const [tplMenuOpen, setTplMenuOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<TemplateFull | null>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);
  const [docPreviews, setDocPreviews] = useState<string[]>([]);

  const [isLocked, setIsLocked] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  
  // Estado para modal de imagen ampliada
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  /* ---------------- REFERENCIAS ------------------------ */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canceledRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  /* ---------------- HELPERS ---------------------------- */
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  const responderLocked = messageMode === "Responder" && isLocked;
  const canSend =
    messageMode === "Nota"
      ? newMessage.trim().length > 0 ||
        selectedImages.length > 0 ||
        selectedVideos.length > 0 ||
        selectedDocs.length > 0
      : isLocked
      ? selectedTpl !== null
      : !responderLocked &&
        (paused ||
          selectedTpl !== null ||
          newMessage.trim().length > 0 ||
          selectedImages.length > 0 ||
          selectedVideos.length > 0 ||
          selectedDocs.length > 0);

  const messageOrigin = messageMode === "Nota" ? "note" : "crm";

  /* ------------------------------------------------------------------- */
  /* 1) Avatar y plantillas                                              */
  /* ------------------------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single()
          .then(
            ({ data, error }) =>
              !error && setOwnAvatarUrl(data?.avatar_url ?? null)
          );
      }
    });
    supabase
      .from("plantillas")
      .select("name, category, language")
      .then(
        ({ data, error }) => !error && setTemplatesList(data as TemplateItem[])
      );
  }, []);

  /* ------------------------------------------------------------------- */
  /* 2) Carga inicial de mensajes                                         */
  /* ------------------------------------------------------------------- */
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", contactId)
      .order("id", { ascending: true });
    if (error || !data) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: any[] = [];
    let skipNext = false;
    for (const row of data) {
      try {
        const m =
          typeof row.message === "string" ? JSON.parse(row.message) : row.message;
        if (
          skipNext &&
          m.type === "human" &&
          !m.etiquetas?.imagen &&
          !m.etiquetas?.audio &&
          !m.etiquetas?.fotos
        ) {
          skipNext = false;
          continue;
        }
        out.push(row);
        if (m.etiquetas?.imagen || m.etiquetas?.audio || m.etiquetas?.fotos)
          skipNext = true;
      } catch {
        out.push(row);
      }
    }
    setMessages(out);
  };

  useEffect(() => {
    if (!contactId) return;
    setMessages([]);
    setNewMessage("");
    setSelectedTpl(null);
    setRecording(false);
    setPaused(false);
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedVideos([]);
    setVideoPreviews([]);
    setSelectedDocs([]);
    setDocPreviews([]);
    setElapsed(0);
    fetchMessages();
  }, [contactId]);

  /* ------------------------------------------------------------------- */
  /* 3) Realtime                                                          */
  /* ------------------------------------------------------------------- */
  useEffect(() => {
    if (!contactId) return;
    const chan = supabase
      .channel(`convo-${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${contactId}`,
        },
        ({ new: row }) => {
          try {
            const m =
              typeof row.message === "string"
                ? JSON.parse(row.message)
                : row.message;
            if (m.etiquetas?.imagen || m.etiquetas?.audio || m.etiquetas?.fotos) {
              setMessages((p) => [...p, row]);
              return;
            }
            const ant = messages[messages.length - 1];
            const mAnt =
              ant && typeof ant.message === "string"
                ? JSON.parse(ant.message)
                : ant?.message;
            if (
              mAnt &&
              (mAnt.etiquetas?.imagen ||
                mAnt.etiquetas?.audio ||
                mAnt.etiquetas?.fotos) &&
              m.type === "human" &&
              !m.etiquetas?.imagen &&
              !m.etiquetas?.audio &&
              !m.etiquetas?.fotos
            )
              return;
            setMessages((p) => [...p, row]);
          } catch {
            setMessages((p) => [...p, row]);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(chan);
    };
  }, [contactId, messages]);

  /* ------------------------------------------------------------------- */
  /* 4) Bloqueo 24 h                                                     */
  /* ------------------------------------------------------------------- */
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const checkLock = async () => {
      const { data, error } = await supabase
        .from("contactos")
        .select("last_customer_message_at")
        .eq("session_id", contactId)
        .single();
      if (!error && data?.last_customer_message_at) {
        const last = new Date(data.last_customer_message_at);
        last.setHours(last.getHours() - 2);
        setIsLocked(Date.now() - last.getTime() >= 86400000);
      } else setIsLocked(false);
    };
    if (contactId) {
      checkLock();
      timer = setInterval(checkLock, 60000);
    }
    return () => clearInterval(timer);
  }, [contactId]);

  /* ------------------------------------------------------------------- */
  /* 5) Scroll automático                                                */
  /* ------------------------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToMsg = (id: number) => {
    const el = msgRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 1200);
    }
  };

  // Funciones para modal de imagen ampliada
  const openImageModal = (imageSrc: string) => {
    setEnlargedImage(imageSrc);
  };

  const closeImageModal = () => {
    setEnlargedImage(null);
  };

  // Efecto para cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && enlargedImage) {
        closeImageModal();
      }
    };

    if (enlargedImage) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enlargedImage]);

  // Función para agrupar imágenes consecutivas de la IA
  const groupConsecutiveAIImages = (messages: MessageRow[]) => {
    const grouped: (MessageRow | (MessageRow & { isImageGroup: true; images: MessageRow[] }))[] = [];
    let currentGroup: MessageRow[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const m = typeof msg.message === "string" ? JSON.parse(msg.message) : msg.message;
      const content = (m.content || "").trim();
      const isAIImage = m.type === "ai" && IMG_RE.test(content) && m.etiquetas?.fotos === true;

      if (isAIImage) {
        currentGroup.push(msg);
      } else {
        // Si hay un grupo acumulado, lo agregamos
        if (currentGroup.length > 0) {
          if (currentGroup.length === 1) {
            // Si solo hay una imagen, la agregamos como mensaje individual
            grouped.push(currentGroup[0]);
          } else {
            // Si hay múltiples imágenes, las agrupamos
            grouped.push({
              ...currentGroup[0],
              isImageGroup: true,
              images: currentGroup
            });
          }
          currentGroup = [];
        }
        // Agregamos el mensaje actual
        grouped.push(msg);
      }
    }

    // Procesar el último grupo si existe
    if (currentGroup.length > 0) {
      if (currentGroup.length === 1) {
        grouped.push(currentGroup[0]);
      } else {
        grouped.push({
          ...currentGroup[0],
          isImageGroup: true,
          images: currentGroup
        });
      }
    }

    return grouped;
  };

  /* ------------------------------------------------------------------- */
  /* 6) Selección de plantilla                                           */
  /* ------------------------------------------------------------------- */
  const handleSelectTemplate = async (tpl: TemplateItem) => {
    const { data, error } = await supabase
      .from("plantillas")
      .select("name, category, language, body_text")
      .eq("name", tpl.name)
      .single();
    if (!error && data) {
      setSelectedTpl(data as TemplateFull);
      setNewMessage(data.body_text);
      setTplMenuOpen(false);
    }
  };
  useEffect(() => {
    const close = (e: MouseEvent) =>
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      setTplMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ------------------------------------------------------------------- */
  /* 7) IMÁGENES                                                         */
  /* ------------------------------------------------------------------- */
  const handleImageClick = () => imageInputRef.current?.click();
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!IMG_RE.test(file.name) || file.size > 26214400) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d")!.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) return;
              const nFile = new File([blob], file.name, { type: file.type });
              setSelectedImages((p) => [...p, nFile]);
              setImagePreviews((p) => [...p, URL.createObjectURL(blob)]);
            },
            file.type,
            0.92
          );
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };
  const removeImageAt = (i: number) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setSelectedImages((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
  };

  /* ------------------------------------------------------------------- */
  /* 8) VÍDEOS                                                           */
  /* ------------------------------------------------------------------- */
  const handleVideoClick = () => videoInputRef.current?.click();
  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.name.toLowerCase().endsWith(".mp4")) return;
      setSelectedVideos((p) => [...p, file]);
      setVideoPreviews((p) => [...p, URL.createObjectURL(file)]);
    });
    if (videoInputRef.current) videoInputRef.current.value = "";
  };
  const removeVideoAt = (i: number) => {
    URL.revokeObjectURL(videoPreviews[i]);
    setSelectedVideos((p) => p.filter((_, idx) => idx !== i));
    setVideoPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  /* ------------------------------------------------------------------- */
  /* 9) DOCUMENTOS                                                       */
  /* ------------------------------------------------------------------- */
  const handleFileClick = () => docInputRef.current?.click();
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!/\.(pdf|docx?)$/i.test(file.name)) return;
      setSelectedDocs((p) => [...p, file]);
      setDocPreviews((p) => [...p, URL.createObjectURL(file)]);
    });
    if (docInputRef.current) docInputRef.current.value = "";
  };
  const removeDocAt = (i: number) => {
    URL.revokeObjectURL(docPreviews[i]);
    setSelectedDocs((p) => p.filter((_, idx) => idx !== i));
    setDocPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  /* ------------------------------------------------------------------- */
  /* 10) AUDIO                                                           */
  /* ------------------------------------------------------------------- */
  const startRecording = async () => {
    canceledRef.current = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const supports = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus");
    const mr = new MediaRecorder(stream, {
      mimeType: supports ? "audio/ogg; codecs=opus" : "audio/webm",
    });
    recordedChunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size && recordedChunksRef.current.push(e.data);
    mr.onstop = async () => {
      if (canceledRef.current) {
        canceledRef.current = false;
        return;
      }
      let blob: Blob;
      if (supports)
        blob = new Blob(recordedChunksRef.current, { type: "audio/ogg; codecs=opus" });
      else {
        const webm = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        try {
          blob = await convertWebmToOgg(webm);
        } catch {
          blob = webm;
        }
      }
      const file = new File([blob], `audio_${Date.now()}.ogg`, { type: blob.type });
      const path = `${contactId}/${Date.now()}_${file.name}`;
      await supabase.storage.from("conversaciones").upload(path, file, {
        contentType: file.type,
      });
      const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
      const audioUrl = urlData.publicUrl;

      const audioMessage: MessageContent = {
        type: "human" as MessageType,
        content: audioUrl,
        etiquetas: { audio: true },  // audio mantiene etiqueta
        additional_kwargs: { origin: "crm" as MessageOrigin },
        response_metadata: {},
      };

      await insertMessage(contactId, audioMessage, "Error al insertar audio");

      setRecording(false);
      setPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setPaused(false);
    setElapsed(0);
    intervalRef.current = window.setInterval(() => setElapsed((x) => x + 1), 1000);
  };
  const stopRecording = () => mediaRecorderRef.current?.stop();
  const cancelRecording = () => {
    canceledRef.current = true;
    stopRecording();
    setRecording(false);
    setPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setElapsed(0);
  };
  const handleMicClick = () => !recording && startRecording();
  const handlePauseClick = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume();
      setPaused(false);
      intervalRef.current = window.setInterval(() => setElapsed((x) => x + 1), 1000);
    } else {
      mediaRecorderRef.current.pause();
      setPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  /* ------------------------------------------------------------------- */
  /* 11) ENVIAR mensaje / media / plantilla                               */
  /* ------------------------------------------------------------------- */
  const sendMessage = async () => {
    if (recording) {
      stopRecording();
      return;
    }

    /* bloqueo + plantilla (>24 h) */
    if (responderLocked) {
      if (!selectedTpl) return;
      const templateMessage: MessageContent = {
        type: "human" as MessageType,
        content: selectedTpl.body_text,
        additional_kwargs: { origin: messageOrigin as MessageOrigin },
        response_metadata: {},
      };

      const success = await insertMessage(contactId, templateMessage, "Error al insertar plantilla");
      if (!success) {
        return;
      }
      await fetch("https://n8n.asisttente.com/webhook/elgloboenviarplantilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantilla: selectedTpl.name, session_id: contactId }),
      }).catch(console.error);
      await supabase
        .from("contactos")
        .update({ is_paused: true })
        .eq("session_id", contactId);

      setSelectedTpl(null);
      setNewMessage("");
      return;
    }

    /* VÍDEOS */
    if (selectedVideos.length > 0) {
      for (const file of selectedVideos) {
        const path = `${contactId}/${Date.now()}_${file.name}`;
        await supabase.storage.from("conversaciones").upload(path, file);
        const { data: urlData } = supabase.storage
          .from("conversaciones")
          .getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        const videoMessage: MessageContent = {
          type: "human" as MessageType,
          content: publicUrl,
          etiquetas: { video: true },               // ★ etiqueta video
          additional_kwargs: { origin: messageOrigin as MessageOrigin },
          response_metadata: {},
        };

        const success = await insertMessage(contactId, videoMessage, "Error al insertar vídeo");
        if (!success) {
          continue;
        }

        if (messageMode === "Responder" && !isLocked) {
          await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: contactId,
              message: publicUrl,
              timestamp: new Date(),
            }),
          }).catch(console.error);
          await supabase
            .from("contactos")
            .update({ is_paused: true })
            .eq("session_id", contactId);
        }
      }
      setSelectedVideos([]);
      setVideoPreviews([]);
      setNewMessage("");
      return;
    }

    /* IMÁGENES */
    if (selectedImages.length > 0) {
      for (let file of selectedImages) {
        if (file.size > 5242880) {
          const opt = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          };
          try {
            const comp = await imageCompression(file, opt);
            file = new File([comp], file.name, { type: comp.type });
          } catch {}
        }
        const path = `${contactId}/${Date.now()}_${file.name}`;
        await supabase.storage.from("conversaciones").upload(path, file);
        const { data: urlData } = supabase.storage
          .from("conversaciones")
          .getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        await supabase.from("conversaciones").insert([
          {
            session_id: contactId,
            message: {
              type: "human",
              content: publicUrl,
              additional_kwargs: { origin: messageOrigin },
              response_metadata: {},
            },
          },
        ]);

        if (messageMode === "Responder" && !isLocked) {
          await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: contactId,
              message: publicUrl,
              timestamp: new Date(),
            }),
          }).catch(console.error);
          await supabase
            .from("contactos")
            .update({ is_paused: true })
            .eq("session_id", contactId);
        }
      }
      setSelectedImages([]);
      setImagePreviews([]);
      setNewMessage("");
      return;
    }

    /* DOCUMENTOS */
    if (selectedDocs.length > 0) {
      for (const file of selectedDocs) {
        const path = `${contactId}/${Date.now()}_${file.name}`;
        await supabase.storage.from("conversaciones").upload(path, file);
        const { data: urlData } = supabase.storage
          .from("conversaciones")
          .getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        await supabase.from("conversaciones").insert([
          {
            session_id: contactId,
            message: {
              type: "human",
              content: publicUrl,
              additional_kwargs: { origin: messageOrigin },
              response_metadata: {},
            },
          },
        ]);

        if (messageMode === "Responder" && !isLocked) {
          await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: contactId,
              message: publicUrl,
              timestamp: new Date(),
            }),
          }).catch(console.error);
          await supabase
            .from("contactos")
            .update({ is_paused: true })
            .eq("session_id", contactId);
        }
      }
      setSelectedDocs([]);
      setDocPreviews([]);
      setNewMessage("");
      return;
    }

    /* TEXTO / PLANTILLA */
    if (!newMessage.trim() && !selectedTpl) return;
    const finalText = selectedTpl ? selectedTpl.body_text : newMessage.trim();

    const textMessage: MessageContent = {
      type: "human" as MessageType,
      content: finalText,
      additional_kwargs: { origin: messageOrigin as MessageOrigin },
      response_metadata: {},
    };

    const success = await insertMessage(contactId, textMessage, "Error al insertar mensaje de texto");
    if (!success) {
      return;
    }

    if (messageMode === "Responder" && !isLocked && !selectedTpl) {
      await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: contactId,
          message: finalText,
          timestamp: new Date(),
        }),
      }).catch(console.error);
      await supabase
        .from("contactos")
        .update({ is_paused: true })
        .eq("session_id", contactId);
    }

    if (selectedTpl) {
      await fetch("https://n8n.asisttente.com/webhook/elgloboenviarplantilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantilla: selectedTpl.name, session_id: contactId }),
      }).catch(console.error);
    }

    setNewMessage("");
    setSelectedTpl(null);
  };

  /* ------------------------------------------------------------------- */
  /* 12) Mensajes sin filtros problemáticos                              */
  /* ------------------------------------------------------------------- */
  const filteredMessages = useMemo(() => {
    // Devolver todos los mensajes sin filtrar para evitar omisiones
    return messages;
  }, [messages]);

  /* ------------------------------------------------------------------- */
  /* 13) RENDER                                                           */
  /* ------------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full" ref={menuRef}>
      {/* inputs ocultos */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        hidden
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        multiple
        hidden
        onChange={handleImageChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept=".mp4"
        multiple
        hidden
        onChange={handleVideoChange}
      />

      {/* conversación */}
      <div className="h-[568px] overflow-y-auto p-4 mb-2">
        {groupConsecutiveAIImages(filteredMessages).map((row) => {
          // Si es un grupo de imágenes, renderizar de manera especial
          if ('isImageGroup' in row && row.isImageGroup) {
            const imageGroup = row as MessageRow & { isImageGroup: true; images: MessageRow[] };
            return (
              <div
                key={`group-${imageGroup.id}`}
                className="mb-2 flex items-center gap-2 justify-end group relative"
                ref={(el) => {
                  if (el) msgRefs.current.set(imageGroup.id, el);
                }}
              >
                {/* Grid de imágenes agrupadas estilo WhatsApp */}
                <div className="inline-block max-w-[280px]">
                  <div className={`grid gap-1 ${
                    imageGroup.images.length === 2 ? 'grid-cols-2' :
                    imageGroup.images.length === 3 ? 'grid-cols-2' :
                    imageGroup.images.length >= 4 ? 'grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {imageGroup.images.map((imgMsg: MessageRow, index: number) => {
                      const imgData = typeof imgMsg.message === "string" ? JSON.parse(imgMsg.message) : imgMsg.message;
                      const imgContent = (imgData.content || "").trim();
                      
                      // Determinar el estilo de borde según la posición
                      let borderRadius = '';
                      if (imageGroup.images.length === 2) {
                        borderRadius = index === 0 ? 'rounded-tl-2xl rounded-bl-2xl rounded-tr-md rounded-br-md' : 'rounded-tr-2xl rounded-br-2xl rounded-tl-md rounded-bl-md';
                      } else if (imageGroup.images.length === 3) {
                        if (index === 0) borderRadius = 'rounded-tl-2xl rounded-bl-md rounded-tr-md rounded-br-md';
                        else if (index === 1) borderRadius = 'rounded-tr-2xl rounded-br-md rounded-tl-md rounded-bl-md';
                        else borderRadius = 'rounded-bl-2xl rounded-br-2xl rounded-tl-md rounded-tr-md';
                      } else if (imageGroup.images.length >= 4) {
                        if (index === 0) borderRadius = 'rounded-tl-2xl rounded-tr-md rounded-bl-md rounded-br-md';
                        else if (index === 1) borderRadius = 'rounded-tr-2xl rounded-tl-md rounded-br-md rounded-bl-md';
                        else if (index === imageGroup.images.length - 2) borderRadius = 'rounded-bl-2xl rounded-br-md rounded-tl-md rounded-tr-md';
                        else if (index === imageGroup.images.length - 1) borderRadius = 'rounded-br-2xl rounded-bl-md rounded-tr-md rounded-tl-md';
                        else borderRadius = 'rounded-md';
                      } else {
                        borderRadius = 'rounded-2xl';
                      }
                      
                      return (
                        <div
                          key={imgMsg.id}
                          className={`${
                            imageGroup.images.length === 3 && index === 2 ? 'col-span-2' : ''
                          } overflow-hidden`}
                        >
                          <img
                            src={imgContent}
                            alt={`img-${index}`}
                            className={`w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity ${borderRadius}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(imgContent);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Avatar de la IA */}
                <img
                  src="/marta.png"
                  alt="ai"
                  className="w-8 h-8 rounded-full object-cover"
                />

                {/* Timestamp */}
                <span className="absolute -top-6 whitespace-nowrap text-xs bg-black text-white px-1 rounded shadow opacity-0 group-hover:opacity-100 right-0">
                  {imageGroup.created_at ? new Date(imageGroup.created_at).toLocaleString() : ""}
                </span>
              </div>
            );
          }

          // Renderizado normal para mensajes individuales
          const m =
            typeof row.message === "string"
              ? JSON.parse(row.message)
              : row.message;
          const ts = row.created_at
            ? new Date(row.created_at).toLocaleString()
            : "";
          const origin = m.additional_kwargs?.origin;
          const isCust = m.type === "human" && !origin;
          const content = (m.content || "").trim();

          const isImg = IMG_RE.test(content);
          const isPdf = /\.pdf(\?.*)?$/i.test(content);
          const isDoc = /\.(docx?)(\?.*)?$/i.test(content);
          const isAud =
            m.etiquetas?.audio === true ||
            /\.(ogg|mp3|wav|webm)(\?.*)?$/i.test(content);
          /* -------------------------------------------------------------
             ★ Nuevo criterio isVid: respeta etiqueta video true
          ------------------------------------------------------------- */
          const isVid =
            m.etiquetas?.video === true || /\.mp4(\?.*)?$/i.test(content);

          const disp =
            origin === "crm"
              ? "member"
              : origin === "note"
              ? "nota"
              : m.type;
          const style = {
            ...getMessageStyle(
              isImg || isPdf || isDoc || isAud || isVid ? "human" : disp
            ),
            ...(highlightId === row.id
              ? { boxShadow: "0 0 0 2px #34b7f1 inset" }
              : {}),
          };

          const refRaw = m.etiquetas?.response as string | undefined;
          const refId = refRaw ? parseInt(refRaw.replace(/\D/g, ""), 10) : null;
          const referenced = refId ? messages.find((r) => r.id === refId) : null;
          const refContent =
            referenced &&
            (typeof referenced.message === "string"
              ? JSON.parse(referenced.message)
              : referenced.message
            ).content;

          const refIsImg = referenced ? IMG_RE.test(refContent) : false;

          return (
            <div
              key={row.id}
              className={`mb-2 flex items-center gap-2 ${
                isCust ? "justify-start" : "justify-end"
              } group relative`}
              ref={(el) => {
                if (el) msgRefs.current.set(row.id, el);
              }}
            >
              {isCust && (
                <img
                  src="/avatar-placeholder.png"
                  alt="Cliente"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}

              {/* burbuja */}
              <div
                className="inline-block rounded-3xl px-3 py-2 max-w-[80%] break-words cursor-pointer"
                style={style}
                onClick={() => referenced && scrollToMsg(referenced.id)}
              >
                {referenced && (
                  <div
                    className="flex items-center gap-2 text-xs text-gray-600 mb-1 pl-2 border-l-2 border-gray-400 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToMsg(referenced.id);
                    }}
                  >
                    {refIsImg ? (
                      <img
                        src={refContent}
                        alt="ref"
                        className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(refContent);
                        }}
                      />
                    ) : (
                      <span>{buildSnippet(referenced)}</span>
                    )}
                  </div>
                )}

                {isImg && (
                  <img
                    src={content}
                    alt="img"
                    className="max-w-xs max-h-80 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageModal(content);
                    }}
                  />
                )}
                {isPdf && (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-sm underline text-blue-600"
                  >
                    {content.split("/").pop()}
                  </a>
                )}
                {isDoc && (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-sm underline text-blue-600"
                  >
                    {content.split("/").pop()}
                  </a>
                )}
                {isAud && (
                  <>
                    <audio
                      controls
                      preload="metadata"
                      src={content}
                      className="w-full"
                    />
                    <a
                      href={content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-sm underline text-blue-600"
                    >
                      Descargar audio
                    </a>
                  </>
                )}
                {isVid && (
                  <video controls className="max-w-xs max-h-80 object-contain rounded-lg">
                    <source src={content} type="video/mp4" />
                    Tu navegador no soporta vídeo.
                  </video>
                )}
                {/* NUEVA LÍNEA: interpretamos \n como salto de línea */}
                {!isImg && !isPdf && !isDoc && !isAud && !isVid && (
                  <p className="whitespace-pre-line">{m.content}</p>
                )}
              </div>

              {!isCust && (
                <img
                  src={disp === "ai" ? "/marta.png" : ownAvatarUrl ?? "/casachata.png"}
                  alt={disp}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}

              <span
                className={`absolute -top-6 whitespace-nowrap text-xs bg-black text-white px-1 rounded shadow opacity-0 group-hover:opacity-100 ${
                  isCust ? "left-0" : "right-0"
                }`}
              >
                {ts}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* selector Responder/Nota */}
      <div className="mt-auto mb-2 flex gap-2">
        <button
          onClick={() => setMessageMode("Responder")}
          className={`flex-1 text-sm ${
            messageMode === "Responder"
              ? "border-b-2 border-[#0084ff] font-bold"
              : "font-medium text-gray-600"
          }`}
        >
          Responder
        </button>
        <button
          onClick={() => setMessageMode("Nota")}
          className={`flex-1 text-sm ${
            messageMode === "Nota"
              ? "border-b-2 border-[#0084ff] font-bold"
              : "font-medium text-gray-600"
          }`}
        >
          Nota
        </button>
      </div>

      {/* input y controles */}
      <div className="mt-2 flex items-center space-x-4 relative">
        {messageMode !== "Nota" && (
          <button className="p-1" onClick={() => setTplMenuOpen((o) => !o)}>
            <FileText size={20} color="#818b9c" />
          </button>
        )}

        {messageMode !== "Nota" && tplMenuOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto bg-white divide-y divide-gray-100 rounded-lg shadow-lg z-10"
            ref={menuRef}
          >
            {templatesList.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No hay plantillas.</div>
            ) : (
              templatesList.map((tpl) => (
                <button
                  key={tpl.name}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className="text-sm font-medium truncate">{tpl.name}</div>
                  <div className="text-xs text-gray-500">
                    {tpl.category} • {tpl.language}
                  </div>
                </button>
              ))
            )}
            <button
              className="w-full px-4 py-2 text-center text-sm text-blue-600 hover:bg-gray-50"
              onClick={() => {
                setTplMenuOpen(false);
                router.push("/configuracion/whatsapp");
              }}
            >
              Ver Plantillas
            </button>
          </div>
        )}

        {/* input */}
        <div className="relative flex-1">
          <textarea
            disabled={responderLocked || recording}
            className={`w-full p-3 rounded focus:outline-none resize-none min-h-[48px] max-h-[120px] ${
              messageMode === "Nota" ? "bg-[#fdf0d0]" : "bg-white"
            } ${
              recording || (responderLocked && !selectedTpl) ? "opacity-50" : ""
            }`}
            placeholder={
              messageMode === "Responder" &&
              (imagePreviews.length +
                videoPreviews.length +
                docPreviews.length >
                0)
                ? ""
                : messageMode === "Nota"
                ? "Deja una nota..."
                : responderLocked
                ? "Han pasado más de 24h, selecciona plantilla..."
                : recording
                ? `${mins}:${secs}`
                : "Responde aquí"
            }
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (selectedTpl) setSelectedTpl(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  // Shift + Enter: agregar salto de línea (comportamiento por defecto)
                  return;
                } else {
                  // Solo Enter: enviar mensaje
                  e.preventDefault();
                  if (canSend) {
                    sendMessage();
                  }
                }
              }
            }}
            rows={1}
            style={{
              lineHeight: '1.5',
              overflow: 'hidden',
            }}
            onInput={(e) => {
              // Auto-resize del textarea
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />

          {/* previews */}
          {messageMode === "Responder" &&
            (imagePreviews.length +
              videoPreviews.length +
              docPreviews.length >
              0) && (
              <div className="absolute top-0 left-0 h-full flex items-center space-x-2 pl-2">
                {imagePreviews.map((src, i) => (
                  <div key={`img-${i}`} className="relative w-10 h-10">
                    <img
                      src={src}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                    <button
                      onClick={() => removeImageAt(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {videoPreviews.map((src, i) => (
                  <div key={`vid-${i}`} className="relative w-10 h-10">
                    <video
                      src={src}
                      muted
                      loop
                      className="w-10 h-10 object-cover rounded"
                    />
                    <button
                      onClick={() => removeVideoAt(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {docPreviews.map((src, i) => (
                  <div
                    key={`doc-${i}`}
                    className="relative flex items-center space-x-1"
                  >
                    <FileText size={18} color="#818b9c" />
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs truncate max-w-[4rem]"
                    >
                      {selectedDocs[i].name}
                    </a>
                    <button
                      onClick={() => removeDocAt(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* adjuntos */}
        {messageMode !== "Nota" && !responderLocked && !recording && (
          <>
            <button onClick={handleFileClick} className="p-1">
              <Paperclip size={20} color="#818b9c" />
            </button>
            <button onClick={handleImageClick} className="p-1">
              <ImageIcon size={20} color="#818b9c" />
            </button>
            <button onClick={handleVideoClick} className="p-1">
              <Video size={20} color="#818b9c" />
            </button>
            <button onClick={handleMicClick} className="p-1">
              <Mic size={20} color="#818b9c" />
            </button>
          </>
        )}

        {/* grabación */}
        {!responderLocked && recording && (
          <>
            <button onClick={cancelRecording} className="p-1">
              <Trash2 size={20} color="#818b9c" />
            </button>
            <button onClick={handlePauseClick} className="p-1">
              {paused ? (
                <Play size={20} color="#818b9c" />
              ) : (
                <Pause size={20} color="#818b9c" />
              )}
            </button>
          </>
        )}

        {/* enviar */}
        <button
          onClick={sendMessage}
          disabled={!canSend}
          className={`w-40 px-4 py-2 rounded text-white ml-auto ${
            canSend
              ? "bg-[#0084ff] hover:bg-[#006fdd]"
              : "bg-[#80c2ff] cursor-not-allowed"
          }`}
        >
          {messageMode === "Nota"
            ? "Añadir Nota"
            : isLocked
            ? "Enviar Plantilla"
            : selectedTpl
            ? "Enviar Plantilla"
            : "Enviar Whatsapp"}
                 </button>
       </div>

       {/* Modal de imagen ampliada */}
       {enlargedImage && (
         <div
           className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
           onClick={closeImageModal}
         >
           <div className="relative max-w-[90vw] max-h-[90vh]">
             <img
               src={enlargedImage}
               alt="Imagen ampliada"
               className="max-w-full max-h-full object-contain"
               onClick={(e) => e.stopPropagation()}
             />
             <button
               onClick={closeImageModal}
               className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
             >
               ×
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }
