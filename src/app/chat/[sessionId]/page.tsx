"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

// Función para generar un ID similar al de WhatsApp (opcional)
const generateMessageId = () => {
  return "wamid." + Math.random().toString(36).substring(2, 15);
};

const ChatDetail = () => {
  const { sessionId } = useParams(); // Se obtiene el sessionId de la URL
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Función para obtener los mensajes de la conversación
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", sessionId)
      .order("id", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Suscribirse a cambios en la tabla "conversaciones"
    const channel = supabase
      .channel("conversaciones-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Payload recibido desde canal:", payload);
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Función para enviar un mensaje, insertar en Supabase y llamar al webhook de n8n
  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;
    console.log("sendMessage iniciado, newMessage:", newMessage);

    // Inserción en Supabase para registrar el mensaje
    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: sessionId,
        message: {
          type: "member", // Mensaje enviado desde el CRM (se muestra como "Yo")
          content: newMessage,
          additional_kwargs: {},
          response_metadata: {},
        },
      },
    ]);
    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    // Construir el payload para el webhook, ahora incluyendo el contenido del mensaje
    const payload = {
      messaging_product: "whatsapp",
      contacts: [
        {
          input: sessionId,
          wa_id: sessionId,
        },
      ],
      messages: [
        {
          id: generateMessageId(),
          content: newMessage,  // Se añade el contenido del mensaje aquí
        },
      ],
    };

    console.log("Payload enviado:", JSON.stringify(payload));

    try {
      const response = await fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        mode: "cors", // Forzamos CORS
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("Webhook response:", response.status, response.statusText);
    } catch (err) {
      console.error("Error calling n8n webhook:", err);
    }
    setNewMessage("");
  };

  return (
    <div>
      <h2 className="text-lg mb-4">Conversación con: {sessionId}</h2>
      <div className="flex-1 overflow-y-auto p-4 border rounded mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 border-b">
            <small className="block text-xs text-gray-600 mb-1">
              {msg.message.type === "member"
                ? "Yo"
                : msg.message.type === "ai"
                ? "Flowy"
                : "Cliente"}
            </small>
            {msg.message.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;