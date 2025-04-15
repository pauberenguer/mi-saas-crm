"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

const Chat = ({ contactId }: { contactId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

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
    // Reiniciamos los mensajes cada vez que cambia el contactId
    setMessages([]);
    fetchMessages();

    // Configuramos una suscripción a cambios en la tabla "conversaciones"
    // que filtre por el nuevo contactId.
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${contactId}`,
        },
        (payload) => {
          // Cada vez que se inserte un mensaje nuevo, lo agregamos al estado.
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    // Limpieza: removemos la suscripción cuando contactId cambie o el componente se desmonte.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;

    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: contactId,
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
    } else {
      setNewMessage("");
      // Opcional: Agregar el mensaje enviado al estado para actualizar la vista de inmediato
      // setMessages((prev) => [...prev, { message: { type: "member", content: newMessage } }]);
      // O simplemente volver a consultar los mensajes:
      fetchMessages();
    }
  };

  return (
    <div>
      <h2 className="text-lg mb-4">Conversación con: {contactId}</h2>
      <div className="flex-1 overflow-y-auto p-4 border rounded mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 border-b">
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
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Escribe un mensaje..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat;