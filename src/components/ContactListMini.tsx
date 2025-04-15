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
}

export default function ContactListMini({ onSelect }: ContactListMiniProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);

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
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(contact)}
            >
              <td className="px-4 py-2">
                <img
                  src="/avatar-placeholder.png"
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </td>
              <td className="px-4 py-2">{contact.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}