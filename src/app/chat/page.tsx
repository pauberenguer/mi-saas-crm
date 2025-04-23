// File: src/app/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  XCircle,
  User,
  Users,
  List,
  Phone,
  Search,
  CheckCircle,
  UserPlus,
  XCircle as XIcon,
} from "lucide-react";
import ContactListMini, { Contact } from "@/components/ContactListMini";
import Conversation from "@/components/Conversation";
import { supabase } from "@/utils/supabaseClient";

/* ---------- Tipado añadido para evitar any ---------- */
interface Note {
  id: number;
  message: { content: string; additional_kwargs: { origin?: string } };
  created_at?: string;
}
interface Profile {
  id: string;
  name: string;
}
/* ---------------------------------------------------- */

const filterOptions = [
  { label: "No Asignado", Icon: XCircle },
  { label: "Tú", Icon: User },
  { label: "Equipo", Icon: Users },
  { label: "Todos", Icon: List },
];

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState<
    "No Asignado" | "Tú" | "Equipo" | "Todos"
  >("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEtiquetas, setContactEtiquetas] = useState<
    Record<string, string> | null
  >(null);
  const [messageMode, setMessageMode] = useState<"Responder" | "Nota">(
    "Responder"
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // IDs de contactos seleccionados (bulk)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Lista de perfiles para asignar
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // Mostrar menú de asignación
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // Referencia al audio de notificación
  const audioRef = useRef<HTMLAudioElement>(null);

  // Obtener usuario actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  // Cargar perfiles registrados
  useEffect(() => {
    supabase
      .from<Profile>("profiles")
      .select("id, name")
      .then(({ data, error }) => {
        if (error) console.error("Error fetching profiles:", error);
        else setProfiles(data || []);
      });
  }, []);

  /* Obtener etiquetas e is_paused */
  useEffect(() => {
    if (!selectedContact) return;
    supabase
      .from("contactos")
      .select("etiquetas, is_paused")
      .eq("session_id", selectedContact.session_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching etiquetas:", error);
          setContactEtiquetas({});
        } else {
          setContactEtiquetas(data?.etiquetas || {});
          setIsPaused(data?.is_paused || false);
        }
      });
  }, [selectedContact]);

  /* Obtener notas (ahora filtrando por additional_kwargs.origin === "note") */
  useEffect(() => {
    if (!selectedContact) return;
    supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", selectedContact.session_id)
      .eq("message->additional_kwargs->>origin", "note")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching notes:", error);
          setNotes([]);
        } else {
          setNotes(data as Note[]);
        }
      });
  }, [selectedContact]);

  // 1) Suscripción real-time: nuevo mensaje HUMAN dispara el sonido
  useEffect(() => {
    if (!selectedContact) return;
    const channel = supabase
      .channel("new-human-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${selectedContact.session_id}`,
        },
        (payload) => {
          // Solo si es mensaje humano
          if ((payload.new as any).message?.type === "human") {
            audioRef.current?.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact]);

  const handleNoteClick = (note: Note) => {
    const el = document.getElementById(`note-${note.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const deleteNote = (noteId: number) => {
    supabase
      .from("conversaciones")
      .delete()
      .eq("id", noteId)
      .then(() => {
        if (!selectedContact) return;
        return supabase
          .from("conversaciones")
          .select("*")
          .eq("session_id", selectedContact.session_id)
          .eq("message->additional_kwargs->>origin", "note")
          .order("id", { ascending: true });
      })
      .then(({ data }) => setNotes(data as Note[]));
  };

  const deleteTag = async (tagKey: string) => {
    if (!selectedContact || !contactEtiquetas) return;
    const updated = { ...contactEtiquetas };
    delete updated[tagKey];
    await supabase
      .from("contactos")
      .update({ etiquetas: updated })
      .eq("session_id", selectedContact.session_id);
    setContactEtiquetas(updated);
  };

  const pauseAutomation = async () => {
    if (!selectedContact) return;
    await supabase
      .from("contactos")
      .update({ is_paused: true })
      .eq("session_id", selectedContact.session_id);
    setIsPaused(true);
  };
  const resumeAutomation = async () => {
    if (!selectedContact) return;
    await supabase
      .from("contactos")
      .update({ is_paused: false })
      .eq("session_id", selectedContact.session_id);
    setIsPaused(false);
  };

  // Asignar las conversaciones seleccionadas al userId elegido
  const assignConversationsTo = async (userId: string) => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("contactos")
      .update({ assigned_to: userId })
      .in("session_id", selectedIds);
    if (error) {
      console.error("Error asignando conversaciones:", error);
    } else {
      setSelectedIds([]);
      setActiveFilter("Tú");
      setShowAssignMenu(false);
    }
  };

  // Desasignar las conversaciones (volver a "No Asignado")
  const unassignConversations = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("contactos")
      .update({ assigned_to: null })
      .in("session_id", selectedIds);
    if (error) {
      console.error("Error desasignando conversaciones:", error);
    } else {
      setSelectedIds([]);
      setActiveFilter("No Asignado");
      setShowAssignMenu(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      {/* Audio de notificación */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
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
        {/* Filtros */}
        <div className="w-48 p-4">
          <h2 className="text-xl font-bold mb-4">Conversaciones</h2>
          <div className="flex flex-col space-y-2">
            {filterOptions.map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActiveFilter(label);
                  setSelectedContact(null);
                  setSelectedIds([]);
                  setShowAssignMenu(false);
                }}
                className={`flex items-center space-x-2 px-2 py-1 rounded ${
                  activeFilter === label
                    ? "bg-gray-200 text-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ContactListMini + Central + Perfil */}
        <div className="flex flex-1">
          {/* Mini contact list */}
          <div className="w-1/4">
            <div className="h-full shadow-md">
              <ContactListMini
                onSelect={(c) => {
                  setSelectedContact(c);
                  setSelectedIds([]);
                  setShowAssignMenu(false);
                }}
                selectedContactId={selectedContact?.session_id}
                filter={activeFilter}
                currentUser={currentUser}
                selectedIds={selectedIds}
                onSelectionChange={(ids) => {
                  setSelectedIds(ids);
                  setShowAssignMenu(false);
                }}
              />
            </div>
          </div>

          {/* Divisor */}
          <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

          {selectedIds.length > 0 ? (
            // Bulk placeholder + menú
            <div className="flex-1">
              <div className="bg-white shadow rounded p-4 h-full flex flex-col items-center justify-center">
                <img
                  src="/no_conversacion.svg"
                  alt="Bulk Placeholder"
                  className="w-48 h-auto mb-4"
                />
                <p className="text-[#4d4d4d] font-medium mb-4">
                  {selectedIds.length} Conversaciones Seleccionadas
                </p>
                {/* Botones */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => setShowAssignMenu((v) => !v)}
                    className="border border-gray-300 px-4 py-2 rounded text-blue-500 flex items-center justify-center"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Asignar Conversaciones
                  </button>
                  {activeFilter === "Tú" && (
                    <button
                      onClick={unassignConversations}
                      className="border border-gray-300 px-4 py-2 rounded text-blue-500 flex	items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      No Asignar Conversaciones
                    </button>
                  )}
                  <button className="border border-gray-300 px-4 py-2 rounded text-blue-500 flex	items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Marcar Como Cerrado
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-blue-500 flex	items-center justify-center"
                  >
                    Quitar Selección
                  </button>
                </div>
                {/* Menú de perfiles */}
                {showAssignMenu && (
                  <div className="mt-4 bg-white border border-gray-200 rounded shadow-lg w-64 max-h-60 overflow-y-auto">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => assignConversationsTo(p.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedContact ? (
            <>
              {/* Conversación */}
              <div className="flex-1">
                <div className="bg-white shadow rounded p-4 h-full">
                  <div className="text-sm text-gray-500 mb-2 text-center">
                    {activeFilter}
                  </div>
                  <hr className="border-t border-gray-200 mb-4" />

                  <div className="flex	items-center mb-4">
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
                    filter={activeFilter}
                    selectedCount={selectedIds.length}
                  />
                </div>
              </div>

              {/* Perfil / Notas / Etiquetas (scrollable) */}
              <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
              <div className="w-1/4">
                <div className="bg-white shadow rounded p-4 h-full flex flex-col overflow-y-auto">
                  <h2 className="text-xl font-bold mb-2">
                    {selectedContact.name}
                  </h2>
                  <img
                    src="/avatar-placeholder.png"
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  <div className="flex	items-center mb-4 space-x-1">
                    <Phone size={16} color="#818b9c" />
                    <span className="text-sm text-gray-700">
                      {selectedContact.session_id}
                    </span>
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm mb-4" />

                  {/* Automatización */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">
                      Automatización
                    </p>
                    {isPaused ? (
                      <button
                        onClick={resumeAutomation}
                        className="w-full text-sm font-medium py-2 px-4 rounded bg-red-500 text-white"
                      >
                        Pausado
                      </button>
                    ) : (
                      <button
                        onClick={pauseAutomation}
                        className="w-full text-sm font-medium py-2 px-4 rounded bg-blue-500 text-white"
                      >
                        Pausar
                      </button>
                    )}
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />

                  {/* Notas */}
                  <div className="w-full mb-4">
                    <p className="text-base font-semibold text-gray-800 mb-2">
                      Notas
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
                      <span className="text-sm text-gray-500">
                        No hay notas.
                      </span>
                    )}
                  </div>
                  <hr className="w-full border-t border-gray-300 shadow-sm my-4" />

                  {/* Etiquetas */}
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-base font-semibold text-gray-800">
                      Etiquetas
                    </span>
                    <span
                      className="text-base font-semibold cursor-pointer"
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
                          value.toString().trim() && (
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
            // Placeholder inicial
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
