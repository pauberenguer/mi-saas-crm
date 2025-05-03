"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import {
  Image as ImageIcon,
  Paperclip,
  Mic,
  FileText,
  Trash2,
  Pause,
  Play,
} from "lucide-react";

interface ConversationProps {
  contactId: string;
  messageMode: "Responder" | "Nota";
  setMessageMode: (mode: "Responder" | "Nota") => void;
  filter: "No Asignado" | "Tú" | "Equipo" | "Todos";
  selectedCount: number;
}

type TemplateItem = {
  name: string;
  category: string;
  language: string;
};

type TemplateFull = TemplateItem & { body_text: string };

const getMessageStyle = (type: string) => {
  if (type === "human")    return { backgroundColor: "#f1f3f5", color: "black" };
  if (type === "ai")       return { backgroundColor: "#eff7ff", color: "black" };
  if (type === "member")   return { backgroundColor: "#0084ff", color: "white" };
  if (type === "nota")     return { backgroundColor: "#fdf0d0", color: "black" };
  return {};
};

export default function Conversation({
  contactId,
  messageMode,
  setMessageMode,
  filter,
  selectedCount,
}: ConversationProps) {
  const router = useRouter();

  // — Estados principales —
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Avatar propio
  const [ownAvatarUrl, setOwnAvatarUrl] = useState<string | null>(null);

  // Plantillas
  const [tplMenuOpen, setTplMenuOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<TemplateFull | null>(null);

  // Imágenes
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Bloqueo 24h
  const [isLocked, setIsLocked] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canceledRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Temporizador formateado
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  // Validación de envío
  const responderLocked = messageMode === "Responder" && isLocked;
  const canSend = messageMode === "Nota"
    ? (newMessage.trim().length > 0 || selectedImages.length > 0)
    : isLocked
      ? selectedTpl !== null
      : !responderLocked && (
          paused ||
          selectedTpl !== null ||
          newMessage.trim().length > 0 ||
          selectedImages.length > 0
        );

  // Origen del mensaje para additional_kwargs
  const messageOrigin = messageMode === "Nota" ? "note" : "crm";

  // 1) Obtener avatar y plantillas
  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data?.avatar_url) setOwnAvatarUrl(data.avatar_url);
            });
        }
      });
    supabase
      .from("plantillas")
      .select("name, category, language")
      .then(({ data, error }) => {
        if (!error && data) setTemplatesList(data as TemplateItem[]);
      });
  }, []);

  // 2) Fetch inicial de mensajes
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", contactId)
      .order("id", { ascending: true });
    if (!error) setMessages(data || []);
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
    setElapsed(0);
    fetchMessages();
  }, [contactId]);

  // 3) Suscripción realtime
  useEffect(() => {
    if (!contactId) return;
    const chan = supabase
      .channel(`convo-${contactId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones", filter: `session_id=eq.${contactId}` },
        ({ new: row }) => setMessages(prev => [...prev, row])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chan);
    };
  }, [contactId]);

  // 4) Verificar bloqueo 24h
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
        setIsLocked(Date.now() - last.getTime() >= 24 * 60 * 60 * 1000);
      } else {
        setIsLocked(false);
      }
    };
    if (contactId) {
      checkLock();
      timer = setInterval(checkLock, 60 * 1000);
    }
    return () => clearInterval(timer);
  }, [contactId]);

  // 5) Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6) Seleccionar plantilla
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

  // Cerrar menú plantilla al click fuera
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTplMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // 7) Imágenes + previsualización
  const handleImageClick = () => imageInputRef.current?.click();
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.name.toLowerCase().endsWith(".jpeg")) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              const newFile = new File([blob], file.name, { type: file.type });
              setSelectedImages(prev => [...prev, newFile]);
              setImagePreviews(prev => [...prev, URL.createObjectURL(blob)]);
            }
          }, file.type);
        };
        img.src = ev.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };
  const removeImageAt = (i: number) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setSelectedImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // 8) PDF
  const handlePdfClick = () => pdfInputRef.current?.click();
  const handlePdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;
    const path = `${contactId}/${Date.now()}_${file.name}`;
    await supabase.storage.from("conversaciones").upload(path, file);
    const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: publicUrl,
        additional_kwargs: { origin: "crm" },
        response_metadata: {},
      },
    }]);
    if (messageMode === "Responder" && !selectedTpl && !isLocked) {
      await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: contactId, message: publicUrl, timestamp: new Date() }),
      }).catch(console.error);
      // Pausar el contacto
      await supabase
        .from("contactos")
        .update({ is_paused: true })
        .eq("session_id", contactId);
    }
  };

  // 9) Grabación de audio
  const startRecording = async () => {
    canceledRef.current = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const options = { mimeType: "audio/webm" };
    const mr = new MediaRecorder(stream, options);
    recordedChunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size) recordedChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      if (canceledRef.current) { canceledRef.current = false; return; }
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
      const path = `${contactId}/${Date.now()}_${file.name}`;
      await supabase.storage.from("conversaciones").upload(path, file);
      const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
      const audioUrl = urlData.publicUrl;
      await supabase.from("conversaciones").insert([{
        session_id: contactId,
        message: {
          type: "human",
          content: audioUrl,
          additional_kwargs: { origin: "crm" },
          response_metadata: {},
        },
      }]);
      if (messageMode === "Responder" && !selectedTpl && !isLocked) {
        await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: contactId, message: audioUrl, timestamp: new Date() }),
        }).catch(console.error);
        // Pausar el contacto
        await supabase
          .from("contactos")
          .update({ is_paused: true })
          .eq("session_id", contactId);
      }
      setRecording(false);
      setPaused(false);
      intervalRef.current && clearInterval(intervalRef.current);
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setPaused(false);
    setElapsed(0);
    intervalRef.current = window.setInterval(() => setElapsed(x => x + 1), 1000);
  };
  const stopRecording = () => mediaRecorderRef.current?.stop();
  const cancelRecording = () => {
    canceledRef.current = true;
    stopRecording();
    setRecording(false);
    setPaused(false);
    intervalRef.current && clearInterval(intervalRef.current);
    setElapsed(0);
  };
  const handleMicClick = () => { if (!recording) startRecording(); };
  const handlePauseClick = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume(); setPaused(false);
      intervalRef.current = window.setInterval(() => setElapsed(x => x + 1), 1000);
    } else {
      mediaRecorderRef.current.pause(); setPaused(true);
      intervalRef.current && clearInterval(intervalRef.current);
    }
  };

  // 10) Enviar mensaje
  const sendMessage = async () => {
    if (recording) { stopRecording(); return; }

    // Modo bloqueado >24h → plantilla
    if (responderLocked) {
      if (selectedTpl) {
        await supabase.from("conversaciones").insert([{
          session_id: contactId,
          message: {
            type: "human",
            content: selectedTpl.body_text,
            additional_kwargs: { origin: messageOrigin },
            response_metadata: {},
          },
        }]);
        await fetch("https://n8n.asisttente.com/webhook/elgloboenviarplantilla", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plantilla: selectedTpl.name, session_id: contactId }),
        }).catch(console.error);
        // Pausar el contacto
        await supabase
          .from("contactos")
          .update({ is_paused: true })
          .eq("session_id", contactId);
        setSelectedTpl(null);
        setNewMessage("");
      }
      return;
    }

    // Imágenes
    if (selectedImages.length > 0) {
      for (const file of selectedImages) {
        const path = `${contactId}/${Date.now()}_${file.name}`;
        await supabase.storage.from("conversaciones").upload(path, file);
        const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        await supabase.from("conversaciones").insert([{
          session_id: contactId,
          message: {
            type: "human",
            content: publicUrl,
            additional_kwargs: { origin: messageOrigin },
            response_metadata: {},
          },
        }]);
        if (messageMode === "Responder" && !isLocked) {
          await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: contactId, message: publicUrl, timestamp: new Date() }),
          }).catch(console.error);
          // Pausar el contacto
          await supabase
            .from("contactos")
            .update({ is_paused: true })
            .eq("session_id", contactId);
        }
      }
      setSelectedImages([]);         setImagePreviews([]);         setNewMessage("");
      return;
    }

    // Texto / plantilla normal
    if (!newMessage.trim() && !selectedTpl) return;
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: newMessage.trim(),
        additional_kwargs: { origin: messageOrigin },
        response_metadata: {},
      },
    }]);
    if (messageMode === "Responder" && !isLocked) {
      await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: contactId, message: newMessage.trim(), timestamp: new Date() }),
      }).catch(console.error);
      // Pausar el contacto
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

  return (
    <div className="flex flex-col h-full" ref={menuRef}>
      {/* Inputs ocultos */}
      <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfChange} />
      <input
        ref={imageInputRef}
        type="file"
        accept=".jpeg"
        multiple
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Conversación */}
      <div className="h-[568px] overflow-y-auto p-4 mb-2">
        {messages.map(msg => {
          const m = typeof msg.message === "string" ? JSON.parse(msg.message) : msg.message;
          const ts = msg.created_at ? new Date(msg.created_at).toLocaleString() : "";
          const origin = m.additional_kwargs?.origin;
          const isCust = m.type === "human" && !origin;
          const content = (m.content || "").trim();
          const isImg = /\.(jpe?g)$/i.test(content);
          const isPdf = /\.pdf$/i.test(content);
          const isAud = /\.(ogg|mp3|wav|webm)$/i.test(content);
          const disp = origin === "crm" ? "member" : origin === "note" ? "nota" : m.type;
          const style = (isImg || isPdf || isAud) ? getMessageStyle("human") : getMessageStyle(disp);

          return (
            <div
              key={msg.id}
              className={`mb-2 flex items-center gap-2 ${isCust ? "justify-start" : "justify-end"} group relative`}
            >
              {isCust && (
                <img src="/avatar-placeholder.png" alt="Cliente" className="w-8 h-8 rounded-full object-cover" />
              )}
              <div className="inline-block rounded-3xl px-3 py-2 max-w-[80%] break-words" style={style}>
                {isImg && <img src={content} alt="Imagen" className="w-60 h-80 object-cover rounded-lg" />}
                {isPdf && <span className="text-black">PDF</span>}
                {isAud && (
                  <audio controls className="w-full mt-1">
                    <source
                      src={content}
                      type={
                        content.endsWith(".mp3") ? "audio/mpeg" :
                        content.endsWith(".wav") ? "audio/wav" :
                        content.endsWith(".ogg") ? "audio/ogg" :
                        content.endsWith(".webm") ? "audio/webm" :
                        "audio/*"
                      }
                    />
                    Tu navegador no soporta reproducción de audio.
                  </audio>
                )}
                {!isImg && !isPdf && !isAud && <p>{m.content}</p>}
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

      {/* Selector de modo */}
      <div className="mt-auto mb-2 flex gap-2">
        <button
          onClick={() => setMessageMode("Responder")}
          className={`flex-1 text-sm ${
            messageMode === "Responder" ? "border-b-2 border-[#0084ff] font-bold" : "font-medium text-gray-600"
          }`}
        >
          Responder
        </button>
        <button
          onClick={() => setMessageMode("Nota")}
          className={`flex-1 text-sm ${
            messageMode === "Nota" ? "border-b-2 border-[#0084ff] font-bold" : "font-medium text-gray-600"
          }`}
        >
          Nota
        </button>
      </div>

      {/* Controles + input */}
      <div className="mt-2 flex items-center space-x-4 relative">
        {/* Plantillas */}
        {messageMode !== "Nota" && (
          <button className="p-1" onClick={() => setTplMenuOpen(o => !o)}>
            <FileText size={20} color="#818b9c" />
          </button>
        )}
        {messageMode !== "Nota" && tplMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto bg-white divide-y divide-gray-100 rounded-lg shadow-lg z-10">
            {templatesList.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No hay plantillas.</div>
            ) : (
              templatesList.map(tpl => (
                <button
                  key={tpl.name}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className="text-sm font-medium truncate">{tpl.name}</div>
                  <div className="text-xs text-gray-500">{tpl.category} • {tpl.language}</div>
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

        {/* Campo texto */}
        <div className="relative flex-1">
          <input
            type="text"
            disabled={responderLocked || recording}
            className={`w-full p-3 rounded focus:outline-none ${
              messageMode === "Nota" ? "bg-[#fdf0d0]" : "bg-white"
            } ${(recording || (responderLocked && !selectedTpl)) ? "opacity-50" : ""}`}
            placeholder={
              messageMode === "Responder" && imagePreviews.length > 0
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
            onChange={e => {
              setNewMessage(e.target.value);
              if (selectedTpl) setSelectedTpl(null);
            }}
            onKeyDown={e => e.key === "Enter" && canSend && sendMessage()}
          />
          {messageMode === "Responder" && imagePreviews.length > 0 && (
            <div className="absolute top-0 left-0 h-full flex items-center space-x-2 pl-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-10 h-10">
                  <img src={src} alt={`preview-${idx}`} className="w-10 h-10 object-cover rounded" />
                  <button
                    onClick={() => removeImageAt(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clip, imagen y micro */}
        {messageMode !== "Nota" && !responderLocked && !recording && (
          <>
            <button onClick={handlePdfClick} className="p-1"><Paperclip size={20} color="#818b9c" /></button>
            <button onClick={handleImageClick} className="p-1"><ImageIcon size={20} color="#818b9c" /></button>
            <button onClick={handleMicClick} className="p-1"><Mic size={20} color="#818b9c" /></button>
          </>
        )}

        {/* Durante grabación */}
        {!responderLocked && recording && (
          <>
            <button onClick={cancelRecording} className="p-1"><Trash2 size={20} color="#818b9c" /></button>
            <button onClick={handlePauseClick} className="p-1">
              {paused ? <Play size={20} color="#818b9c" /> : <Pause size={20} color="#818b9c" />}
            </button>
          </>
        )}

        {/* Botón enviar / añadir nota */}
        <button
          onClick={sendMessage}
          disabled={!canSend}
          className={`w-40 px-4 py-2 rounded text-white ml-auto ${
            canSend ? "bg-[#0084ff] hover:bg-[#006fdd]" : "bg-[#80c2ff] cursor-not-allowed"
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
    </div>
  );
}
