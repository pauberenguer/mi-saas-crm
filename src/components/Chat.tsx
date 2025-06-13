"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

interface ChatProps {
  contactId: string;
}

interface MessageContent {
  type: string;
  content: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

interface MessageData {
  id: number;
  session_id: string;
  message: MessageContent;
  created_at: string;
}

const getMessageStyle = (type: string) => {
  if (type === "human") return { backgroundColor: "#f1f3f5", color: "black" };
  if (type === "ai") return { backgroundColor: "#eff7ff", color: "black" };
  if (type === "member") return { backgroundColor: "#0084ff", color: "white" };
  return {};
};

export default function Chat({ contactId }: ChatProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
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
  }, [contactId, fetchMessages]);

  const sendMessage = async () => {
    if (newMessage.trim().length === 0) return;
    
    const { error } = await supabase.from("conversaciones").insert([
      {
        session_id: contactId,
        message: {
          type: "member", // Ajusta este valor según corresponda: "member", "ai" o "human"
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
          // Determinamos la alineación según el tipo
          const isCliente = msg.message.type === "human";
          const isDerecha = !isCliente; // Si es ai o member

          return (
            <div
              key={msg.id}
              className={`mb-2 flex items-center ${isCliente ? "justify-start" : "justify-end"} gap-2`}
            >
              {isCliente && (
                <img
                  src="/avatar-placeholder.png"
                  alt="Cliente"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className="inline-block rounded-3xl px-3 py-2 max-w-[80%] break-words"
                style={getMessageStyle(msg.message.type)}
              >
                <p>{msg.message.content}</p>
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