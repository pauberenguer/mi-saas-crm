"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../utils/supabaseClient";

export interface Contact {
  session_id: string;
  name: string;
  created_at: string;
}

interface ContactListProps {
  onSelect: (contact: Contact) => void;
}

export default function ContactList({ onSelect }: ContactListProps) {
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
    <div className="overflow-x-auto bg-white p-4 rounded shadow">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">Avatar</th>
            <th className="px-4 py-2 text-left">Nombre</th>
            <th className="px-4 py-2 text-left">Teléfono</th>
            <th className="px-4 py-2 text-left">Suscrito</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr
              key={contact.session_id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(contact)}
            >
              <td className="px-4 py-2">
                <Image
                  src="/avatar-placeholder.png"
                  alt={contact.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </td>
              <td className="px-4 py-2">{contact.name}</td>
              <td className="px-4 py-2">{contact.session_id}</td>
              <td className="px-4 py-2">
                {new Date(contact.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}