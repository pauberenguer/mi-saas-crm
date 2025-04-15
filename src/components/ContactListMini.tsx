"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export interface Contact {
  session_id: string;
  name: string;
  created_at: string;
}

interface ContactListMiniProps {
  onSelect: (contact: Contact) => void;
  selectedContactId?: string;
}

export default function ContactListMini({ onSelect, selectedContactId }: ContactListMiniProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from("contactos")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching contacts:", error);
      } else {
        setContacts(data || []);

        // Por cada contacto, traer el último mensaje del Cliente (tipo "human")
        data?.forEach(async (contact) => {
          const { data: msgData, error: msgError } = await supabase
            .from("conversaciones")
            .select("message")
            .eq("session_id", contact.session_id)
            .eq("message->>type", "human")
            .order("id", { ascending: false })
            .limit(1);
          if (msgError && Object.keys(msgError).length > 0) {
            console.error("Error fetching last message:", msgError);
          } else if (msgData && msgData.length > 0) {
            setLastMessages((prev) => ({
              ...prev,
              [contact.session_id]: msgData[0].message.content,
            }));
          }
        });
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
      <table className="min-w-full">
        <tbody className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr
              key={contact.session_id}
              className={`cursor-pointer hover:bg-gray-50 ${
                selectedContactId === contact.session_id ? "bg-gray-300" : ""
              }`}
              onClick={() => onSelect(contact)}
            >
              <td className="px-4 py-2">
                <div className="flex items-center">
                  {/* Avatar a la izquierda */}
                  <img
                    src="/avatar-placeholder.png"
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {/* Bloque de texto: nombre y último mensaje */}
                  <div className="ml-4">
                    <div className="font-semibold text-gray-600">{contact.name}</div>
                    <div className="text-xs text-gray-500">
                      {lastMessages[contact.session_id] || ""}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}