"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

interface ChatProps {
  contactId: string;
}

const getMessageStyle = (type: string) => {
  if (type === "human") return { backgroundColor: "#f1f3f5", color: "black" };
  if (type === "ai") return { backgroundColor: "#eff7ff", color: "black" };
  if (type === "member") return { backgroundColor: "#0084ff", color: "white" };
  return {};
};

export default function Chat({ contactId }: ChatProps) {
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
    if (contactId) {
      fetchMessages();
    }
  }, [contactId]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;
    
    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: contactId,
        message: {
          type: "member", // Cambia este valor según corresponda: "member", "ai" o "human"
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
      fetchMessages();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 mb-4">
        {messages.map((msg) => {
          // Determinar la alineación: Cliente a la izquierda, Member y AI a la derecha
          const alignment =
            msg.message.type === "human" ? "justify-start" : "justify-end";

          return (
            <div key={msg.id} className={`mb-2 flex ${alignment}`}>
              <div
                className="inline-block rounded-3xl px-3 py-2 max-w-[80%]"
                style={getMessageStyle(msg.message.type)}
              >
                <small className="block text-xs mb-1">
                  {msg.message.type === "member"
                    ? "Yo"
                    : msg.message.type === "ai"
                    ? "Flowy"
                    : "Cliente"}
                </small>
                <p>{msg.message.content}</p>
              </div>
            </div>
          );
        })}
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
}