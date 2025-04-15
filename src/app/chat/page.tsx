"use client";

import { useState, useEffect } from "react";
import { XCircle, User, Users, List, Phone } from "lucide-react";
import ContactListMini, { Contact } from "@/components/ContactListMini";
import Chat from "@/components/Chat";
import { supabase } from "@/utils/supabaseClient";

const filterOptions = [
  { label: "No Asignado", Icon: XCircle },
  { label: "Tú", Icon: User },
  { label: "Equipo", Icon: Users },
  { label: "Todos", Icon: List },
];

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEtiquetas, setContactEtiquetas] = useState<{ [key: string]: string } | null>(null);

  // Cuando se seleccione un contacto, se consulta la columna "etiquetas" de Supabase
  useEffect(() => {
    const fetchEtiquetas = async () => {
      if (selectedContact) {
        const { data, error } = await supabase
          .from("contactos")
          .select("etiquetas")
          .eq("session_id", selectedContact.session_id)
          .single();
        if (error) {
          console.error("Error fetching etiquetas:", error);
          setContactEtiquetas({});
        } else {
          setContactEtiquetas(data?.etiquetas || {});
        }
      } else {
        setContactEtiquetas(null);
      }
    };
    fetchEtiquetas();
  }, [selectedContact]);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {/* Encabezado de la Página */}
      <header className="mb-4 text-left">
        <h1 className="text-3xl font-bold text-gray-800">Chat</h1>
      </header>

      <div className="flex flex-1">
        {/* Bloque 1: Filtros de Conversaciones */}
        <div className="w-48 p-4">
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

        {/* Contenedor para Bloque 2 (MiniTabla) y el bloque combinado de Bloque 3 (Chat) y Bloque 4 (Perfil) */}
        <div className="flex flex-1">
          {/* Bloque 2: Mini Tabla de Contactos */}
          <div className="w-1/4">
            <div className="h-full shadow-md">
              <ContactListMini
                onSelect={setSelectedContact}
                selectedContactId={selectedContact?.session_id}
              />
            </div>
          </div>

          {/* Divisor con sombra */}
          <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

          {selectedContact ? (
            // Si hay contacto seleccionado se muestran 2 bloques: Chat y Perfil
            <>
              {/* Bloque 3: Área de Chat */}
              <div className="flex-1">
                <div className="bg-white shadow rounded p-4 h-full">
                  {/* Encabezado: avatar y nombre (sin "Conversación con") */}
                  <div className="flex items-center mb-4">
                    <img
                      src="/avatar-placeholder.png"
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-full object-cover mr-2 shadow-md"
                    />
                    <span className="text-xl font-bold text-gray-800">
                      {selectedContact.name}
                    </span>
                  </div>
                  <Chat contactId={selectedContact.session_id} />
                </div>
              </div>

              {/* Divisor con sombra */}
              <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

              {/* Bloque 4: Perfil */}
              <div className="w-1/4">
                <div className="bg-white shadow rounded p-4 h-full flex flex-col">
                  {/* Nombre */}
                  <h2 className="text-xl font-bold mb-2">{selectedContact.name}</h2>
                  {/* Avatar */}
                  <img
                    src="/avatar-placeholder.png"
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  {/* Fila con el icono del teléfono y el número pegados */}
                  <div className="w-full flex items-center mb-4">
                    <Phone size={16} color="#818b9c" />
                    <span className="ml-1 text-sm text-gray-700">
                      {selectedContact.session_id}
                    </span>
                  </div>
                  <hr className="w-full border-gray-300 mb-4" />
                  {/* Automatizaciones y botón Pausar */}
                  <div className="w-full mb-4">
                    <p className="text-sm text-gray-700 mb-2">Automatizaciones</p>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded">
                      Pausar
                    </button>
                  </div>
                  <hr className="w-full border-gray-300 my-4" />
                  {/* Encabezado de Etiquetas de Contacto */}
                  <div className="w-full flex justify-between items-center">
                    <span className="text-sm text-gray-700">Etiquetas de Contacto</span>
                    <span className="text-sm" style={{ color: "#4585fb" }}>
                      + Añadir Etiqueta
                    </span>
                  </div>
                  <hr className="w-full border-gray-300 mt-4" />
                  {/* Renderizado de las etiquetas */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contactEtiquetas && Object.keys(contactEtiquetas).length > 0 ? (
                      Object.entries(contactEtiquetas).map(([key, value]) =>
                        value.trim() !== "" ? (
                          <span
                            key={key}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {key}: {value}
                          </span>
                        ) : null
                      )
                    ) : (
                      <span className="text-sm text-gray-500">
                        No hay etiquetas configuradas.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Si NO hay contacto seleccionado, se muestra un único bloque combinado (Chat + Perfil)
            <div className="flex-1">
              <div className="bg-white shadow rounded p-4 h-full flex flex-col items-center justify-center">
                <img
                  src="/no_conversacion.svg"
                  alt="Sin Conversación"
                  className="w-48 h-auto mb-4"
                />
                <p className="text-gray-500 text-center">
                  Selecciona una conversación para empezar a enviar mensajes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}