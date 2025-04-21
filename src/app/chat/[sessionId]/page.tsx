// src/app/chat/[sessionId]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import Chat from "@/components/Chat";
import ContactList, { Contact } from "@/components/ContactList";

export default function ChatDetailPage() {
  // tipamos useParams para evitar any
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  // callback requerido por ContactList
  const handleSelect = (contact: Contact) => {
    router.push(`/chat/${contact.session_id}`);
  };

  return (
    <div className="flex h-full">
      {/* Columna izquierda: lista de contactos */}
      <div className="w-1/3 border-r p-4">
        <ContactList onSelect={handleSelect} />
      </div>

      {/* Columna derecha: área de conversación */}
      <div className="flex-1 p-4">
        <Chat contactId={sessionId} />
      </div>
    </div>
  );
}