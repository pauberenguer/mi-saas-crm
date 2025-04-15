"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

interface Contact {
  session_id: string;
  name: string;
  // Puedes agregar avatar_url si tienes la imagen del contacto
}

const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

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

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Contactos</h2>
      <ul>
        {contacts.map((contact) => (
          <li key={contact.session_id} className="mb-2">
            <Link
              href={`/chat/${contact.session_id}`}
              className="text-blue-600 hover:underline"
            >
              {contact.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactList;