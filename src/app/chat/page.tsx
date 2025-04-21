// src/app/chat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { XCircle, User, Users, List, Phone, Search } from "lucide-react";
import ContactListMini, { Contact } from "@/components/ContactListMini";
import Conversation from "@/components/Conversation";
import { supabase } from "@/utils/supabaseClient";

/* ---------- Tipado añadido para evitar any ---------- */
interface Note {
  id: number;
  message: { content: string };
  created_at?: string;
}
/* ---------------------------------------------------- */

const filterOptions = [
  { label: "No Asignado", Icon: XCircle },
  { label: "Tú", Icon: User },
  { label: "Equipo", Icon: Users },
  { label: "Todos", Icon: List },
];

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEtiquetas, setContactEtiquetas] =
    useState<{ [key: string]: string } | null>(null);
  const [messageMode, setMessageMode] = useState<"Responder" | "Nota">(
    "Responder"
  );
  const [notes, setNotes] = useState<Note[]>([]); // ← antes any[]
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Nuevo estado para el input de búsqueda (solo visual por ahora)
  const [headerSearch, setHeaderSearch] = useState("");

  /* ---------- Obtener etiquetas e is_paused ---------- */
  useEffect(() => {
    const fetchEtiquetas = async () => {
      if (selectedContact) {
        const { data, error } = await supabase
          .from("contactos")
          .select("etiquetas, is_paused")
          .eq("session_id", selectedContact.session_id)
          .single();
        if (error) {
          console.error("Error fetching etiquetas:", error);
          setContactEtiquetas({});
        } else {
          setContactEtiquetas(data?.etiquetas || {});
          setIsPaused(data?.is_paused || false);
          setConfirmPause(false);
          setConfirmResume(false);
        }
      } else {
        setContactEtiquetas(null);
      }
    };
    fetchEtiquetas();
  }, [selectedContact]);

  /* ---------- Obtener notas ---------- */
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
          setNotes((data || []) as Note[]); // ← casteo seguro
        }
      } else {
        setNotes([]);
      }
    };
    fetchNotes();
  }, [selectedContact]);

  /* ---------- Handlers ---------- */
  function handleNoteClick(note: Note) {
    const element = document.getElementById(`note-${note.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function deleteNote(noteId: number) {
    const { error } = await supabase
      .from("conversaciones")
      .delete()
      .eq("id", noteId);
    if (!error) {
      const { data } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("session_id", selectedContact?.session_id)
        .eq("message->>type", "nota")
        .order("id", { ascending: true });
      setNotes((data || []) as Note[]);
    }
  }

  async function deleteTag(tagKey: string) {
    if (!selectedContact || !contactEtiquetas) return;
    const updated = { ...contactEtiquetas };
    delete updated[tagKey];
    const { error } = await supabase
      .from("contactos")
      .update({ etiquetas: updated })
      .eq("session_id", selectedContact.session_id);
    if (!error) setContactEtiquetas(updated);
  }

  async function pauseAutomation() {
    if (!selectedContact) return;
    const { error } = await supabase
      .from("contactos")
      .update({ is_paused: true })
      .eq("session_id", selectedContact.session_id);
    if (!error) {
      setIsPaused(true);
      setConfirmPause(false);
      setConfirmResume(false);
    }
  }

  async function resumeAutomation() {
    if (!selectedContact) return;
    const { error } = await supabase
      .from("contactos")
      .update({ is_paused: false })
      .eq("session_id", selectedContact.session_id);
    if (!error) {
      setIsPaused(false);
      setConfirmPause(false);
      setConfirmResume(false);
    }
  }

  /* ---------- JSX ---------- */
  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {/* Encabezado de la Página con búsqueda */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Chat</h1>
        <div className="flex items-center border border-gray-300 rounded px-3 py-1">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Buscar…"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="ml-2 w-48 placeholder-gray-500 focus:outline-none"
          />
        </div>
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
                  activeFilter === label ? "text-blue-500" : "text-gray-700"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenedor Bloque 2 y contenido */}
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

          {/* Divisor */}
          <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

          {selectedContact ? (
            <>
              {/* Bloque 3: Área de Conversación */}
              <div className="flex-1">
                <div className="bg-white shadow rounded p-4 h-full">
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
                  <Conversation
                    contactId={selectedContact.session_id}
                    messageMode={messageMode}
                    setMessageMode={setMessageMode}
                  />
                </div>
              </div>

              {/* Divisor */}
              <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

              {/* Bloque 4: Perfil */}
              <div className="w-1/4">
                <div className="bg-white shadow rounded p-4 h-full flex flex-col">
                  <h2 className="text-xl font-bold mb-2">
                    {selectedContact.name}
                  </h2>
                  <img
                    src="/avatar-placeholder.png"
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  <div className="flex items-center mb-4 space-x-1">
                    <Phone size={16} color="#818b9c" />
                    <span className="text-sm text-gray-700">
                      {selectedContact.session_id}
                    </span>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm mb-4" />

                  {/* Automatizaciones */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">
                      Automatizaciones
                    </p>
                    {isPaused ? (
                      !confirmResume ? (
                        <button
                          onClick={() => setConfirmResume(true)}
                          className="w-full text-sm font-medium py-2 px-4 rounded bg-red-500 text-white"
                        >
                          Pausado
                        </button>
                      ) : (
                        <button
                          onClick={resumeAutomation}
                          className="w-full text-sm font-medium py-2 px-4 rounded bg-black text-white hover:bg-gray-800"
                        >
                          Activar Automatización
                        </button>
                      )
                    ) : !confirmPause ? (
                      <button
                        onClick={() => setConfirmPause(true)}
                        className="w-full text-sm font-medium py-2 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={pauseAutomation}
                        className="w-full text-sm font-medium py-2 px-4 rounded bg-black text-white hover:bg-gray-800"
                      >
                        Pausar
                      </button>
                    )}
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />

                  {/* Notas */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">
                      Notes
                    </p>
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          id={`note-${note.id}`}
                          onClick={() => handleNoteClick(note)}
                          className="relative mb-2 p-2 bg-[#fdf0d0] rounded cursor-pointer hover:opacity-80"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            className="absolute top-0 right-0 text-gray-600 text-xs hover:text-gray-700"
                          >
                            X
                          </button>
                          <p className="text-sm text-gray-800">
                            {note.message.content}
                          </p>
                          <small className="text-xs text-gray-600">
                            {note.created_at
                              ? new Date(note.created_at).toLocaleString()
                              : ""}
                          </small>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No hay notas.</span>
                    )}
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />

                  {/* Etiquetas */}
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-gray-800">
                      Etiquetas
                    </span>
                    <span
                      className="text-base font-semibold"
                      style={{ color: "#4585fb" }}
                    >
                      + Añadir Etiqueta
                    </span>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm mt-4" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contactEtiquetas &&
                      Object.entries(contactEtiquetas).map(
                        ([key, value]) =>
                          value.toString().trim() !== "" && (
                            <div key={key} className="relative inline-block">
                              <span className="px-2 py-1 rounded-full text-sm font-medium bg-[#eff7ff] text-gray-800 border border-[#80c2ff]">
                                {value}
                              </span>
                              <button
                                onClick={() => deleteTag(key)}
                                className="absolute -top-1 -right-1 text-black text-xs hover:text-gray-700"
                              >
                                X
                              </button>
                            </div>
                          )
                      )}
                  </div>
                </div>
              </div>
            </>
          ) : (
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