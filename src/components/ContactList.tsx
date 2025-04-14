"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

const ContactList = () => {
  const [contacts, setContacts] = useState<any[]>([]);

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
    <div className="p-4 border-r">
      <h2 className="text-xl mb-4">Contactos</h2>
      <ul>
        {contacts.map((contact) => (
          <li key={contact.session_id} className="mb-2">
            <Link href={`/chat/${contact.session_id}`}>
              {contact.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactList;