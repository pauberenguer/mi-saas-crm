"use client";

import { useState, useEffect } from "react";
import { XCircle, User, Users, List, Phone } from "lucide-react";
import ContactListMini, { Contact } from "@/components/ContactListMini";
import Conversation from "@/components/Conversation";
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
  // Estado para el modo de mensaje (Responder o Nota)
  const [messageMode, setMessageMode] = useState<"Responder" | "Nota">("Responder");
  // Estado para almacenar las notas (mensajes con type "nota")
  const [notes, setNotes] = useState<any[]>([]);

  // Al seleccionar un contacto se consulta la columna "etiquetas" en Supabase
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

  // Obtener notas (mensajes de tipo "nota") para el contacto seleccionado
  useEffect(() => {
    const fetchNotes = async () => {
      if (selectedContact) {
        const { data, error } = await supabase
          .from("conversaciones")
          .select("*")
          .eq("session_id", selectedContact.session_id)
          .eq("message->>type", "nota")
          .order("id", { ascending: true });
        if (error) {
          console.error("Error fetching notes:", error);
          setNotes([]);
        } else {
          setNotes(data || []);
        }
      } else {
        setNotes([]);
      }
    };
    fetchNotes();
  }, [selectedContact]);

  // Función para hacer scroll hasta la nota clicada
  const handleNoteClick = (note: any) => {
    const element = document.getElementById(`note-${note.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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

        {/* Contenedor para Bloque 2 (Mini Tabla de Contactos) y bloques combinados de Conversación y Perfil */}
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

          {/* Divisor con sombra sin espacio extra */}
          <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

          {selectedContact ? (
            <>
              {/* Bloque 3: Área de Conversación */}
              <div className="flex-1">
                <div className="bg-white shadow rounded p-4 h-full">
                  {/* Encabezado: Avatar y nombre */}
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
                  {/* Componente Conversation: se encarga de mostrar el chat, el selector Responder/Nota y el input */}
                  <Conversation
                    contactId={selectedContact.session_id}
                    messageMode={messageMode}
                    setMessageMode={setMessageMode}
                  />
                </div>
              </div>

              {/* Divisor con sombra sin espacio extra */}
              <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

              {/* Bloque 4: Perfil */}
              <div className="w-1/4">
                <div className="bg-white shadow rounded p-4 h-full flex flex-col">
                  {/* Nombre y Avatar */}
                  <h2 className="text-xl font-bold mb-2">{selectedContact.name}</h2>
                  <img
                    src="/avatar-placeholder.png"
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  {/* Teléfono */}
                  <div className="flex items-center mb-4 space-x-1">
                    <Phone size={16} color="#818b9c" />
                    <span className="text-sm text-gray-700">{selectedContact.session_id}</span>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm mb-4" />
                  {/* Sección Automatizaciones */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">Automatizaciones</p>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded">
                      Pausar
                    </button>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />
                  {/* Sección Notas */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">Notas</p>
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => handleNoteClick(note)}
                          className="mb-2 p-2 bg-[#fdf0d0] rounded cursor-pointer hover:opacity-90"
                        >
                          <p className="text-sm text-gray-800">{note.message.content}</p>
                          <small className="text-xs text-gray-600">
                            {new Date(note.created_at).toLocaleString()}
                          </small>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No hay notas.</span>
                    )}
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />
                  {/* Sección Etiquetas */}
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-gray-800">Etiquetas</span>
                    <span className="text-base font-semibold" style={{ color: "#4585fb" }}>
                      + Añadir Etiqueta
                    </span>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm mt-4" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contactEtiquetas && Object.keys(contactEtiquetas).length > 0 ? (
                      Object.entries(contactEtiquetas).map(([key, value]) =>
                        value.toString().trim() !== "" ? (
                          <span
                            key={key}
                            className="px-2 py-1 rounded-full text-sm font-medium bg-[#eff7ff] text-gray-800 border border-[#80c2ff]"
                          >
                            {value}
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
            // Bloque combinado (Conversación + Perfil) para cuando no hay contacto seleccionado
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