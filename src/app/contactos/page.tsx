"use client";
import ContactList from "@/components/ContactList";

export default function ContactosPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Contactos</h1>
      <ContactList />
    </div>
  );
}