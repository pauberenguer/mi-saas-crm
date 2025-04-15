"use client";
import ContactList from "@/components/ContactList";

export default function ChatIndex() {
  return (
    <div className="flex h-full">
      {/* Columna izquierda: lista de contactos */}
      <div className="w-1/3 border-r p-4">
        <ContactList />
      </div>
      {/* Columna derecha: área de bienvenida */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold">Bienvenido al Chat</h1>
        <p>Selecciona un contacto del panel izquierdo para ver su conversación.</p>
      </div>
    </div>
  );
}