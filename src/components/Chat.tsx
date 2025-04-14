"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

const Chat = ({ contactId }: { contactId: string }) => {
  // Usaremos contactId como session_id
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Función para obtener las conversaciones iniciales
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", contactId) // ahora filtramos por session_id
      .order("id", { ascending: true }); // usamos id para ordenar

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Suscribirse a cambios en la tabla "conversaciones" usando la API de canales de Supabase v2
    const channel = supabase
      .channel("conversaciones-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${contactId}`, // filtramos por session_id
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Limpieza: remover el canal cuando se desmonte el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  // Función para enviar un mensaje y disparar el webhook de n8n
  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    // Inserción en la tabla "conversaciones" adaptada a la nueva estructura
    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: contactId, // usamos session_id para identificar al cliente
        message: {
          type: "member", // Marcamos este mensaje como enviado por un miembro
          content: newMessage,
          additional_kwargs: {},
          response_metadata: {},
        },
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Llamada al webhook de n8n (mantiene el mismo esquema, pero ahora se envía session_id)
      fetch("https://n8n.asisttente.com/webhook/elglobobot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: contactId,
          message: newMessage,
          timestamp: new Date(),
        }),
      }).catch((err) =>
        console.error("Error calling n8n webhook:", err)
      );

      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel de Conversaciones */}
      <div className="flex-1 overflow-y-auto p-4 border rounded mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 border-b ${
              msg.message.type === "human" ? "bg-gray-200" : "bg-white"
            }`}
          >
            <small className="block text-xs text-gray-600 mb-1">
              {msg.message.type === "human" ? "Cliente" : "Miembro"}
            </small>
            {msg.message.content}
          </div>
        ))}
      </div>
      {/* Entrada de Mensaje */}
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

export default Chat;