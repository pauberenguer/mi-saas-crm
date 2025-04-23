// File: src/components/Conversation.tsx
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
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
} from "lucide-react";

interface ConversationProps {
  contactId: string;
  messageMode: "Responder" | "Nota";
  setMessageMode: (mode: "Responder" | "Nota") => void;
  filter: "No Asignado" | "Tú" | "Equipo" | "Todos";
  selectedCount: number;
}

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

  // Scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Traer mensajes
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

  // Envío de texto o audio pendiente
  const sendMessage = async () => {
    if (pendingAudioUrl) {
      // enviar audio como human + etiqueta crm
      await supabase.from("conversaciones").insert([{
        session_id: contactId,
        message: {
          type: "human",
          content: pendingAudioUrl,
          additional_kwargs: { origin: "crm" },
          response_metadata: {}
        }
      }]);
      // disparar webhook
      fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: contactId,
          message: pendingAudioUrl,
          timestamp: new Date(),
        }),
      }).catch(console.error);
      setPendingAudioUrl(null);
      setElapsed(0);
      fetchMessages();
      return;
    }
    if (!newMessage.trim()) return;
    const originTag = messageMode === "Nota" ? "note" : "crm";
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: newMessage.trim(),
        additional_kwargs: { origin: originTag },
        response_metadata: {}
      }
    }]);
    if (originTag === "crm") {
      fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: contactId,
          message: newMessage.trim(),
          timestamp: new Date(),
        }),
      }).catch(console.error);
    }
    setNewMessage("");
    fetchMessages();
  };

  // Subida de imagen + webhook
  const handleImageClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${contactId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("conversaciones")
      .upload(path, file);
    if (upErr) return console.error("Error subiendo imagen:", upErr);
    const { data: urlData } = supabase.storage
      .from("conversaciones")
      .getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    // insertar como human+crm
    await supabase.from("conversaciones").insert([{
      session_id: contactId,
      message: {
        type: "human",
        content: publicUrl,
        additional_kwargs: { origin: "crm" },
        response_metadata: {}
      }
    }]);
    // disparar webhook
    fetch("https://n8n.asisttente.com/webhook/elglobobot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: contactId,
        message: publicUrl,
        timestamp: new Date(),
      }),
    }).catch(console.error);
    fetchMessages();
  };

  // Grabación de audio
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    recordedChunksRef.current = [];
    mr.ondataavailable = e => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/ogg; codecs=opus" });
      const file = new File([blob], `audio_${Date.now()}.ogg`, { type: "audio/ogg" });
      const path = `${contactId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("conversaciones")
        .upload(path, file);
      if (upErr) return console.error("Error subiendo audio:", upErr);
      const { data: urlData } = supabase.storage
        .from("conversaciones")
        .getPublicUrl(path);
      setPendingAudioUrl(urlData.publicUrl);
      setRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setElapsed(0);
    intervalRef.current = window.setInterval(() => setElapsed(x => x + 1), 1000);
  };
  const stopRecording   = () => mediaRecorderRef.current?.stop();
  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setPendingAudioUrl(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
  };
  const handleMicClick = () => {
    if (!recording && pendingAudioUrl === null) startRecording();
  };

  // — Solo OMITIR la siguiente transcripción si es MEDIA y LO ENVÍA EL CLIENTE
  const visibleMessages: { msg: any; m: any }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const raw = msg.message;
    const m = typeof raw === "string" ? JSON.parse(raw.trim()) : raw;
    visibleMessages.push({ msg, m });

    const content = (m.content || "").trim();
    const isMedia = /\.(ogg|mp3|wav|jpe?g|png|gif)$/i.test(content);
    const origin = m.additional_kwargs?.origin;   // "crm", "note" o undefined
    // si lo envía cliente (human sin origin) y es media, saltamos la siguiente
    if (isMedia && m.type === "human" && !origin) {
      i++;
    }
  }

  // Formato mm:ss
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-col h-full">
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
          const ts = msg.created_at
            ? new Date(msg.created_at).toLocaleString()
            : "";
          const origin = m.additional_kwargs?.origin;
          const isCustomer = m.type === "human" && !origin;
          const content    = (m.content || "").trim();
          const isImg      = /\.(jpe?g|png|gif)$/i.test(content);
          const isAudio    = /\.(ogg|mp3|wav)$/i.test(content);
          const displayType = origin === "crm"
                            ? "member"
                            : origin === "note"
                            ? "nota"
                            : m.type;

          return (
            <div
              key={msg.id}
              className={`mb-2 flex items-center gap-2 ${
                isCustomer ? "justify-start" : "justify-end"
              }`}
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
                style={getMessageStyle(displayType)}
              >
                {isImg && (
                  <img src={content} alt="Imagen" className="max-w-full rounded-lg" />
                )}
                {isAudio && (
                  <audio controls src={content} className="w-full mt-1" />
                )}
                {!isImg && !isAudio && <p>{m.content}</p>}
                <div className="mt-1 text-xs text-gray-500 text-right">{ts}</div>
              </div>
              {!isCustomer && (
                <img
                  src={
                    displayType === "ai"     ? "/flowy.png"
                    : displayType === "nota"   ? "/nota.png"
                    :                            "/yo.png"
                  }
                  alt={displayType}
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

      {/* Input + timer + controls */}
      <div className="flex items-center gap-2 mt-2">
        {(recording || pendingAudioUrl) && (
          <button onClick={cancelRecording} className="p-1">
            <Trash2 size={20} color="#818b9c" />
          </button>
        )}
        <div className="relative flex-1">
          <input
            type="text"
            disabled={recording || pendingAudioUrl !== null}
            className={`w-full p-3 rounded focus:outline-none ${
              messageMode === "Nota" ? "bg-[#fdf0d0]" : "bg-white"
            } ${(recording || pendingAudioUrl !== null) ? "opacity-50" : ""}`}
            placeholder={
              (recording || pendingAudioUrl)
                ? `${mins}:${secs}`
                : messageMode === "Nota"
                ? "Deja una nota..."
                : "Responde aquí"
            }
            value={pendingAudioUrl ? "" : newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          {(recording || pendingAudioUrl) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-mono">
              {`${mins}:${secs}`}
            </div>
          )}
          {(recording || pendingAudioUrl) && (
            <button
              onClick={stopRecording}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <Square size={20} color="#818b9c" />
            </button>
          )}
        </div>
      </div>

      {/* Iconos + Enviar */}
      <div className="mt-2 flex items-center space-x-4">
        <button className="p-1">
          <Paperclip size={20} color="#818b9c" />
        </button>
        <button onClick={handleImageClick} className="p-1">
          <ImageIcon size={20} color="#818b9c" />
        </button>
        <button onClick={handleMicClick} className="p-1">
          <Mic size={20} color="#818b9c" />
        </button>
        <button
          className="px-4 py-2 rounded text-white ml-auto"
          style={{
            backgroundColor:
              recording || pendingAudioUrl || newMessage.trim()
                ? "#0084ff"
                : "#80c2ff",
          }}
          onClick={sendMessage}
        >
          {messageMode === "Nota" && !recording && !pendingAudioUrl
            ? "Añadir Nota"
            : "Enviar Whatsapp"}
        </button>
      </div>
    </div>
  );
}
