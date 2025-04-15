"use client";
import { useParams } from "next/navigation";
import Chat from "@/components/Chat";
import ContactList from "@/components/ContactList";

export default function ChatDetailPage() {
  const { sessionId } = useParams();

  return (
    <div className="flex h-full">
      {/* Columna izquierda: lista de contactos */}
      <div className="w-1/3 border-r p-4">
        <ContactList />
      </div>
      {/* Columna derecha: área de conversación */}
      <div className="flex-1 p-4">
        <Chat contactId={sessionId} />
      </div>
    </div>
  );
}