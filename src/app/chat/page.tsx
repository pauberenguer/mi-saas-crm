"use client";

import { useState } from "react";
import { XCircle, User, Users, List } from "lucide-react";
import ContactListMini, { Contact } from "@/components/ContactListMini";
import Chat from "@/components/Chat";

const filterOptions = [
  { label: "No Asignado", Icon: XCircle },
  { label: "Tú", Icon: User },
  { label: "Equipo", Icon: Users },
  { label: "Todos", Icon: List },
];

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  return (
    <div className="flex h-full bg-gray-50 p-4">
      {/* Bloque 1: Filtros - interfaz de Conversaciones */}
      <div className="w-48 p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Conversaciones</h2>
        <div className="flex flex-col space-y-4">
          {filterOptions.map(({ label, Icon }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className={`text-sm font-medium flex items-center space-x-2 ${
                activeFilter === label ? "text-green-500" : "text-gray-700"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bloque 2: Mini Tabla de Contactos */}
      <div className="w-1/4 p-4">
        <ContactListMini onSelect={setSelectedContact} />
      </div>

      {/* Bloque 3: Área de Chat */}
      <div className="flex-1 p-4">
        {selectedContact ? (
          <div className="bg-white shadow rounded p-4 h-full">
            <h2 className="text-xl font-bold mb-4">
              Conversación con {selectedContact.name}
            </h2>
            <Chat contactId={selectedContact.session_id} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white shadow rounded p-4">
            <img src="/no_conversacion.svg" alt="Sin Conversación" className="w-48 h-auto" />
          </div>
        )}
      </div>
    </div>
  );
}