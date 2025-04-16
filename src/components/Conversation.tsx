"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Image as ImageIcon, Paperclip, Mic } from "lucide-react";

interface ConversationProps {
  contactId: string;
  messageMode: "Responder" | "Nota";
  setMessageMode: (mode: "Responder" | "Nota") => void;
}

const getMessageStyle = (type: string) => {
  if (type === "human") return { backgroundColor: "#f1f3f5", color: "black" };
  if (type === "ai") return { backgroundColor: "#eff7ff", color: "black" };
  if (type === "member") return { backgroundColor: "#0084ff", color: "white" };
  if (type === "nota") return { backgroundColor: "#fdf0d0", color: "black" };
  return {};
};

export default function Conversation({ contactId, messageMode, setMessageMode }: ConversationProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Función para desplazar el scroll hasta el final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", contactId)
      .order("id", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    if (contactId) {
      fetchMessages();
    }
  }, [contactId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;
    const msgType = messageMode === "Nota" ? "nota" : "member";
    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: contactId,
        message: {
          type: msgType,
          content: newMessage,
          additional_kwargs: {},
          response_metadata: {},
        },
      },
    ]);
    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Solo se dispara el webhook si el mensaje es de tipo "member" (Responder)
      if (msgType === "member") {
        fetch("https://n8n.asisttente.com/webhook/elglobobot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: contactId,
            message: newMessage,
            timestamp: new Date(),
          }),
        }).catch((err) => console.error("Error calling n8n webhook:", err));
      }
      setNewMessage("");
      fetchMessages();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Contenedor de mensajes con altura fija y scroll interno */}
      <div className="h-[680px] overflow-y-auto p-4 mb-4">
        {messages.map((msg) => {
          // Determinamos la alineación según el tipo
          const isCliente = msg.message.type === "human";
          const isDerecha = !isCliente;
          return (
            <div
              key={msg.id}
              id={msg.message.type === "nota" ? `note-${msg.id}` : undefined}
              className={`mb-2 flex items-center gap-2 ${isCliente ? "justify-start" : "justify-end"}`}
            >
              {isCliente && (
                <img
                  src="/avatar-placeholder.png"
                  alt="Cliente"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className={`inline-block rounded-3xl px-3 py-2 max-w-[80%] break-words ${
                  msg.message.type === "nota" ? "hover:brightness-75" : ""
                }`}
                style={getMessageStyle(msg.message.type)}
              >
                <p>{msg.message.content}</p>
                {msg.message.type === "nota" && (
                  <small className="text-xs text-gray-600">
                    {msg.created_at ? new Date(msg.created_at).toLocaleString() : ""}
                  </small>
                )}
              </div>
              {isDerecha && msg.message.type === "ai" && (
                <img
                  src="/flowy.png"
                  alt="Flowy"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              {isDerecha && msg.message.type === "member" && (
                <img
                  src="/yo.png"
                  alt="Yo"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              {isDerecha && msg.message.type === "nota" && (
                <img
                  src="/nota.png"
                  alt="Nota"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
            </div>
          );
        })}
        {/* Elemento invisible para desplazar hasta el final */}
        <div ref={messagesEndRef} />
      </div>

      {/* Selector de modo (Responder/Nota) y caja de entrada se muestran juntos, justo arriba del input */}
      <div className="mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMessageMode("Responder")}
            className={`flex-1 text-sm ${messageMode === "Responder" ? "border-b-2 border-[#0084ff] font-bold" : "font-medium text-gray-600"}`}
          >
            Responder
          </button>
          <button
            onClick={() => setMessageMode("Nota")}
            className={`flex-1 text-sm ${messageMode === "Nota" ? "border-b-2 border-[#0084ff] font-bold" : "font-medium text-gray-600"}`}
          >
            Nota
          </button>
        </div>
      </div>

      {/* Caja de entrada para enviar mensajes (sin borde extra, con la altura aumentada 1.4x) */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className={`flex-1 p-3 rounded focus:outline-none ${messageMode === "Nota" ? "bg-[#fdf0d0]" : "bg-white"}`}
          placeholder={messageMode === "Nota" ? "Deja una nota para tus compañeros o un recordatorio para ti" : "Responde aquí"}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          style={{
            backgroundColor: newMessage.trim().length === 0 ? "#80c2ff" : "#0084ff",
          }}
          onClick={sendMessage}
        >
          Enviar Whatsapp
        </button>
      </div>

      {/* Fila de íconos para adjuntos */}
      <div className="mt-2 flex items-center space-x-4">
        <button className="p-1">
          <ImageIcon size={20} color="#818b9c" />
        </button>
        <button className="p-1">
          <Paperclip size={20} color="#818b9c" />
        </button>
        <button className="p-1">
          <Mic size={20} color="#818b9c" />
        </button>
      </div>
    </div>
  );
}