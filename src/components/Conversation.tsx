// File: src/components/Conversation.tsx
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import {
  Image as ImageIcon,
  Paperclip,
  Mic,
  Square,
  Trash2,
  CheckCircle,
  UserPlus,
  XCircle,
  FileText,
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

type TemplateFull = TemplateItem & {
  body_text: string;
};

const getMessageStyle = (type: string) => {
  if (type === "human")   return { backgroundColor: "#f1f3f5", color: "black" };
  if (type === "ai")      return { backgroundColor: "#eff7ff", color: "black" };
  if (type === "member")  return { backgroundColor: "#0084ff", color: "white" };
  if (type === "nota")    return { backgroundColor: "#fdf0d0", color: "black" };
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

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // plantillas
  const [tplMenuOpen, setTplMenuOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<TemplateFull | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // fetch mensajes
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", contactId)
      .order("id", { ascending: true });
    if (!error) setMessages(data || []);
  };
  useEffect(() => {
    if (contactId) fetchMessages();
  }, [contactId]);

  // fetch plantillas
  useEffect(() => {
    supabase
      .from("plantillas")
      .select("name, category, language")
      .then(({ data, error }) => {
        if (!error && data) setTemplatesList(data as TemplateItem[]);
      });
  }, []);

  // cerrar menú clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTplMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // send mensaje: audio, texto o plantilla
  const sendMessage = async () => {
    // Audio pendiente
    if (pendingAudioUrl) {
      await supabase.from("conversaciones").insert([{
        session_id: contactId,
        message: {
          type: "human",
          content: pendingAudioUrl,
          additional_kwargs: { origin: "crm" },
          response_metadata: {}
        }
      }]);
      fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: contactId, message: pendingAudioUrl, timestamp: new Date() }),
      }).catch(console.error);
      setPendingAudioUrl(null);
      setElapsed(0);
      fetchMessages();
      return;
    }

    // Texto o plantilla
    if (!newMessage.trim()) return;
    const originTag = messageMode === "Nota" ? "note" : "crm";

    // Insert en Supabase
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: newMessage.trim(),
        additional_kwargs: { origin: originTag },
        response_metadata: {}
      }
    }]);

    if (selectedTpl) {
      // Si es plantilla, llamar webhook específico con plantilla y session_id
      await fetch("https://n8n.asisttente.com/webhook-test/elgloboenviarplantilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantilla: selectedTpl.name,
          session_id: contactId
        }),
      }).catch(console.error);
    } else if (originTag === "crm") {
      // Webhook normal
      fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: contactId, message: newMessage.trim(), timestamp: new Date() }),
      }).catch(console.error);
    }

    setNewMessage("");
    setSelectedTpl(null);
    fetchMessages();
  };

  // imagen
  const handleImageClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${contactId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("conversaciones").upload(path, file);
    if (upErr) return console.error(upErr);
    const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: publicUrl,
        additional_kwargs: { origin: "crm" },
        response_metadata: {}
      }
    }]);
    fetch("https://n8n.asisttente.com/webhook/elglobobot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: contactId, message: publicUrl, timestamp: new Date() }),
    }).catch(console.error);
    fetchMessages();
  };

  // audio
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    recordedChunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size) recordedChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/ogg; codecs=opus" });
      const file = new File([blob], `audio_${Date.now()}.ogg`, { type: "audio/ogg" });
      const path = `${contactId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("conversaciones").upload(path, file);
      if (upErr) return console.error(upErr);
      const { data: urlData } = supabase.storage.from("conversaciones").getPublicUrl(path);
      setPendingAudioUrl(urlData.publicUrl);
      setRecording(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setElapsed(0);
    intervalRef.current = window.setInterval(() => setElapsed(x => x + 1), 1000);
  };
  const stopRecording = () => mediaRecorderRef.current?.stop();
  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPendingAudioUrl(null);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setElapsed(0);
  };
  const handleMicClick = () => { if (!recording && !pendingAudioUrl) startRecording(); };

  // Filtrar multimedia
  const visibleMessages: { msg: any; m: any }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const raw = msg.message;
    const m = typeof raw === "string" ? JSON.parse(raw.trim()) : raw;
    visibleMessages.push({ msg, m });
    const content = (m.content || "").trim();
    const isMedia = /\.(ogg|mp3|wav|jpe?g|png|gif)$/i.test(content);
    const origin = m.additional_kwargs?.origin;
    if (isMedia && m.type === "human" && !origin) i++;
  }

  // Temporizador mm:ss
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  // Seleccionar plantilla completa
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

  // Etiqueta del botón enviar
  const sendLabel = selectedTpl
    ? "Enviar Plantilla"
    : messageMode === "Nota"
      ? "Añadir Nota"
      : "Enviar Whatsapp";

  return (
    <div className="flex flex-col h-full" ref={menuRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mensajes */}
      <div className="h-[680px] overflow-y-auto p-4 mb-4">
        {visibleMessages.map(({ msg, m }) => {
          const ts = msg.created_at ? new Date(msg.created_at).toLocaleString() : "";
          const origin = m.additional_kwargs?.origin;
          const isCustomer = m.type === "human" && !origin;
          const content = (m.content || "").trim();
          const isImg = /\.(jpe?g|png|gif)$/i.test(content);
          const isAud = /\.(ogg|mp3|wav)$/i.test(content);
          const disp = origin === "crm" ? "member" : origin === "note" ? "nota" : m.type;
          return (
            <div
              key={msg.id}
              className={`mb-2 flex items-center gap-2 ${isCustomer ? "justify-start" : "justify-end"}`}
              title={ts}
            >
              {isCustomer && (
                <img
                  src="/avatar-placeholder.png"
                  alt="Cliente"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className="inline-block rounded-3xl px-3 py-2 max-w-[80%] break-words"
                style={getMessageStyle(disp)}
              >
                {isImg && <img src={content} alt="Imagen" className="max-w-full rounded-lg" />}
                {isAud && <audio controls src={content} className="w-full mt-1" />}
                {!isImg && !isAud && <p>{m.content}</p>}
                <div className="mt-1 text-xs text-gray-500 text-right">{ts}</div>
              </div>
              {!isCustomer && (
                <img
                  src={
                    disp === "ai"
                      ? "/flowy.png"
                      : disp === "nota"
                        ? "/nota.png"
                        : "/yo.png"
                  }
                  alt={disp}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Selector de modo */}
      <div className="mb-2 flex gap-2">
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

      {/* Input + controles */}
      <div className="mt-2 flex items-center space-x-4 relative">
        <button className="p-1" onClick={() => setTplMenuOpen(o => !o)}>
          <FileText size={20} color="#818b9c" />
        </button>
        {tplMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg z-10">
            {templatesList.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No hay plantillas.</div>
            ) : (
              templatesList.map(tpl => (
                <button
                  key={tpl.name}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {tpl.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tpl.category} • {tpl.language}
                  </div>
                </button>
              ))
            )}
            <button
              className="w-full px-4 py-2 text-center text-sm text-blue-600 hover:bg-gray-50"
              onClick={() => { setTplMenuOpen(false); router.push("/configuracion/whatsapp"); }}
            >
              Ver Plantillas
            </button>
          </div>
        )}

        <input
          type="text"
          disabled={recording || pendingAudioUrl !== null}
          className={`flex-1 p-3 rounded focus:outline-none ${
            messageMode === "Nota" ? "bg-[#fdf0d0]" : "bg-white"
          } ${recording || pendingAudioUrl !== null ? "opacity-50" : ""}`}
          placeholder={
            recording || pendingAudioUrl
              ? `${mins}:${secs}`
              : messageMode === "Nota"
                ? "Deja una nota..."
                : "Responde aquí"
          }
          value={pendingAudioUrl ? "" : newMessage}
          onChange={e => { setNewMessage(e.target.value); if (selectedTpl) setSelectedTpl(null); }}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />

        <button className="p-1"><Paperclip size={20} color="#818b9c" /></button>
        <button onClick={handleImageClick} className="p-1"><ImageIcon size={20} color="#818b9c" /></button>
        <button onClick={handleMicClick} className="p-1"><Mic size={20} color="#818b9c" /></button>

        <button
          className={`px-4 py-2 rounded text-white ml-auto ${
            recording || pendingAudioUrl || newMessage.trim()
              ? "bg-[#0084ff] hover:bg-[#006fdd]"
              : "bg-[#80c2ff] cursor-not-allowed"
          }`}
          onClick={sendMessage}
          disabled={!(recording || pendingAudioUrl || newMessage.trim())}
        >
          {sendLabel}
        </button>
      </div>
    </div>
  );
}
