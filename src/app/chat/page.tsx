// src/app/chat/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import ContactListMini, { Contact, FilterType } from "../../components/ContactListMini";
import Conversation from "../../components/Conversation";
import { supabase } from "../../utils/supabaseClient";

interface Note {
  id: number;
  message: { content: string; additional_kwargs: { origin?: string } };
  created_at?: string;
}
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

const filterOptions: { label: FilterType; Icon: typeof XCircle }[] = [
  { label: "No Asignado", Icon: XCircle },
  { label: "Tú",        Icon: User    },
  { label: "Equipo",    Icon: Users   },
  { label: "Todos",     Icon: List    },
];

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEtiquetas, setContactEtiquetas] = useState<Record<string, string> | null>(null);
  const [messageMode, setMessageMode] = useState<"Responder" | "Nota">("Responder");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // For closed-state check
  const [selectedContactStates, setSelectedContactStates] = useState<
    { session_id: string; estado: string }[]
  >([]);

  // Toasts
  const [showDeletedToast, setShowDeletedToast]   = useState(false);
  const [showAssignedToast, setShowAssignedToast] = useState(false);
  const [showReopenedToast, setShowReopenedToast] = useState(false);

  // Confirm close
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Refs for outside clicks
  const assignButtonRef = useRef<HTMLButtonElement>(null);
  const assignMenuRef   = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Load current user
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    }
    fetchUser();
  }, []);

  // Load profiles
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .then(res => {
        if (res.error) {
          console.error(res.error);
        } else {
          setProfiles(res.data as Profile[]);
        }
      });
  }, []);

  // Close assign menu on outside click
  useEffect(() => {
    if (!showAssignMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        assignMenuRef.current &&
        !assignMenuRef.current.contains(e.target as Node) &&
        assignButtonRef.current &&
        !assignButtonRef.current.contains(e.target as Node)
      ) {
        setShowAssignMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAssignMenu]);

  // Fetch etiquetas & paused once on select
  useEffect(() => {
    if (!selectedContact) return;
    supabase
      .from("contactos")
      .select("etiquetas, is_paused")
      .eq("session_id", selectedContact.session_id)
      .single()
      .then(res => {
        if (res.error) {
          console.error(res.error);
          setContactEtiquetas({});
          setIsPaused(false);
        } else {
          const data = res.data as { etiquetas: Record<string, string>; is_paused: boolean };
          setContactEtiquetas(data.etiquetas || {});
          setIsPaused(data.is_paused || false);
        }
      });
  }, [selectedContact]);

  // Real-time subscription for etiquetas & is_paused
  useEffect(() => {
    if (!selectedContact) return;
    const channel = supabase
      .channel(`contactos-realtime-${selectedContact.session_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contactos",
          filter: `session_id=eq.${selectedContact.session_id}`,
        },
        ({ new: updated }) => {
          // @ts-ignore
          setIsPaused(updated.is_paused);
          // @ts-ignore
          setContactEtiquetas(updated.etiquetas || {});
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact]);

  // Play sound on new human message
  useEffect(() => {
    const channel = supabase
      .channel("global-new-human-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        payload => {
          const mRaw = (payload.new as any).message;
          const m = typeof mRaw === "string" ? JSON.parse(mRaw) : mRaw;
          const origin = m.additional_kwargs?.origin;
          if (m.type === "human" && origin !== "crm" && origin !== "note") {
            audioRef.current?.play().catch(console.error);
          }
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, []);

  // Real-time notes subscription
  useEffect(() => {
    if (!selectedContact) return;
    const channel = supabase
      .channel("new-note-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT", schema: "public", table: "conversaciones",
          filter: `session_id=eq.${selectedContact.session_id}`,
        },
        payload => {
          const row = payload.new as any;
          if (row.message?.additional_kwargs?.origin === "note") {
            setNotes(prev => [...prev, row as Note]);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedContact]);

  // Fetch notes
  useEffect(() => {
    if (!selectedContact) return;
    supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", selectedContact.session_id)
      .eq("message->additional_kwargs->>origin", "note")
      .order("id", { ascending: true })
      .then(res => {
        if (res.error) console.error(res.error);
        else setNotes(res.data as Note[]);
      });
  }, [selectedContact]);

  // Fetch states of selected for closed-check
  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectedContactStates([]);
      return;
    }
    supabase
      .from("contactos")
      .select("session_id, estado")
      .in("session_id", selectedIds)
      .then(res => {
        if (res.error) console.error(res.error);
        else setSelectedContactStates(res.data as { session_id: string; estado: string }[]);
      });
  }, [selectedIds]);

  // Helpers
  const handleNoteClick = (note: Note) => {
    const el = document.getElementById(`note-${note.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const deleteNote = (id: number) => {
    supabase
      .from("conversaciones")
      .delete()
      .eq("id", id)
      .then(() => {
        if (!selectedContact) return;
        return supabase
          .from("conversaciones")
          .select("*")
          .eq("session_id", selectedContact.session_id)
          .eq("message->additional_kwargs->>origin", "note")
          .order("id", { ascending: true });
      })
      .then(res => {
        if (res?.data) setNotes(res.data as Note[]);
      });
  };
  const deleteTag = async (key: string) => {
    if (!selectedContact || !contactEtiquetas) return;
    const updated = { ...contactEtiquetas };
    delete updated[key];
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

  // Assign / Unassign
  const assignConversationsTo = async (userId: string) => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("contactos")
      .update({ assigned_to: userId })
      .in("session_id", selectedIds);
    if (error) console.error(error);
    else {
      setSelectedIds([]);
      setActiveFilter("Tú");
      setShowAssignMenu(false);
      setShowAssignedToast(true);
      setTimeout(() => setShowAssignedToast(false), 5000);
    }
  };
  const unassignConversations = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("contactos")
      .update({ assigned_to: null })
      .in("session_id", selectedIds);
    if (error) console.error(error);
    else {
      setSelectedIds([]);
      setActiveFilter("No Asignado");
      setShowAssignMenu(false);
    }
  };

  // Close conversations
  const reOpenConversations = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase
      .from("contactos")
      .update({ estado: "Abierto", assigned_to: null })
      .in("session_id", selectedIds);
    if (error) console.error(error);
    else {
      setSelectedIds([]);
      setActiveFilter("No Asignado");
      setShowAssignMenu(false);
      setShowReopenedToast(true);
      setTimeout(() => setShowReopenedToast(false), 5000);
    }
  };

  // Marcamos como vista la conversación anterior antes de cambiar
  const handleSelectContact = async (c: Contact) => {
    if (selectedContact) {
      const nowIso = new Date().toISOString();
      await supabase
        .from("contactos")
        .update({ last_viewed_at: nowIso })
        .eq("session_id", selectedContact.session_id);
    }
    setSelectedContact(c);
    setShowAssignMenu(false);
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in-out forwards; }
      `}</style>

      <div className="relative flex flex-col h-full bg-gray-50 p-8 animate-fadeIn">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        <div className="animate-fadeIn mb-2 grid grid-cols-3 items-center">
          <div className="justify-self-start">
            <h1 className="text-3xl font-bold" style={{ color: "#1d1d1d" }}>
              Chat
            </h1>
          </div>
          <div className="justify-self-center flex items-center border border-gray-300 rounded px-3 py-1">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              placeholder="Buscar…"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className="ml-2 w-48 placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div />
        </div>

        <hr className="border-t mb-8 animate-fadeIn" style={{ borderColor: "#4d4d4d" }} />

        <div className="flex flex-1">
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

          <div className="flex flex-1">
            <div className="w-1/4 h-full shadow-md">
              <ContactListMini
                searchTerm={headerSearch}
                onSelect={handleSelectContact}
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

            <div className="w-px bg-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />

            {selectedIds.length > 0 ? (
              selectedContactStates.every((s) => s.estado === "Cerrado") ? (
                <div className="flex-1">
                  <div className="bg-white shadow rounded p-4 h-full flex flex-col items-center justify-center">
                    <img
                      src="/asignar.svg"
                      alt="Closed Placeholder"
                      className="w-48 h-auto mb-4"
                    />
                    <p className="text-[#4d4d4d] font-medium mb-4">
                      {selectedIds.length} Conversaciones Cerradas Seleccionadas
                    </p>
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={reOpenConversations}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Reabrir Conversaciones
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Quitar Selección
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="bg-white shadow rounded p-4 h-full flex items-center justify-center">
                    <div className="relative flex flex-col items-center space-y-2">
                      <img
                        src="/asignar.svg"
                        alt="Bulk Placeholder"
                        className="w-48 h-auto mb-4"
                      />
                      <p className="text-[#4d4d4d] font-medium mb-4">
                        {selectedIds.length} Conversaciones Seleccionadas
                      </p>
                      <button
                        ref={assignButtonRef}
                        onClick={() => setShowAssignMenu(v => !v)}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Asignar Conversaciones
                      </button>
                      {activeFilter !== "No Asignado" && (
                        <button
                          onClick={unassignConversations}
                          className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          No Asignar Conversaciones
                        </button>
                      )}
                      <button
                        onClick={() => setShowConfirmClose(true)}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Cerrar Conversaciones
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" />
                        Quitar Selección
                      </button>

                      {showAssignMenu && (
                        <div
                          ref={assignMenuRef}
                          className="absolute top-full mt-2 bg-white border border-gray-200 rounded shadow-lg w-64 max-h-60 overflow-y-auto z-20"
                        >
                          {profiles.map(p => (
                            <button
                              key={p.id}
                              onClick={() => assignConversationsTo(p.id)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                            >
                              <img
                                src={p.avatar_url || "/avatar-placeholder.png"}
                                alt={p.name}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : selectedContact ? (
              <>
                <div className="flex-1">
                  <div className="bg-white shadow rounded p-4 h-full flex flex-col">
                    <div className="text-sm text-gray-500 mb-2 text-center">
                      {activeFilter}
                    </div>
                    <hr className="border-t border-gray-200 mb-4" />
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
                      filter={activeFilter}
                      selectedCount={selectedIds.length}
                    />
                  </div>
                </div>
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
                    <div className="flex items-center mb-4 space-x-1">
                      <Phone size={16} color="#818b9c" />
                      <span className="text-sm text-gray-700">
                        {selectedContact.session_id}
                      </span>
                    </div>
                    <hr className="border-t border-gray-300 shadow-sm mb-4" />

                    <div className="mb-4">
                      <p className="font-semibold mb-2">Automatización</p>
                      {isPaused ? (
                        <button
                          onClick={resumeAutomation}
                          className="w-full py-2 rounded bg-red-500 text-white"
                        >
                          Pausado
                        </button>
                      ) : (
                        <button
                          onClick={pauseAutomation}
                          className="w-full py-2 rounded bg-blue-500 text-white"
                        >
                          Pausar
                        </button>
                      )}
                    </div>
                    <hr className="border-t border-gray-300 shadow-sm mb-4" />

                    <div className="mb-4">
                      <p className="font-semibold mb-2">Notas</p>
                      {notes.length > 0 ? (
                        notes.map(note => (
                          <div
                            key={note.id}
                            id={`note-${note.id}`}
                            onClick={() => handleNoteClick(note)}
                            className="relative p-2 mb-2 bg-[#fdf0d0] rounded cursor-pointer hover:opacity-80"
                          >
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteNote(note.id);
                              }}
                              className="absolute top-0 right-0 text-xs text-gray-600 hover:text-gray-700"
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
                    <hr className="border-t border-gray-300 shadow-sm mb-4" />

                    <p className="font-semibold mb-2">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                      {contactEtiquetas &&
                        Object.entries(contactEtiquetas).map(([key, value]) =>
                          value.trim() ? (
                            <div key={key} className="relative inline-block">
                              <span className="px-2 py-1 text-sm font-medium bg-[#eff7ff] text-gray-800 border border-[#80c2ff] rounded-full">
                                {value}
                              </span>
                              <button
                                onClick={() => deleteTag(key)}
                                className="absolute -top-1 -right-1 text-xs text-black hover:text-gray-700"
                              >
                                X
                              </button>
                            </div>
                          ) : null
                        )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <div className="h-full flex flex-col items-center justify-center bg-white shadow rounded p-4">
                  <img
                    src="/no_conversacion.svg"
                    alt="Sin Conversación"
                    className="w-48 mb-4"
                  />
                  <p className="text-gray-500 text-center">
                    Selecciona una conversación para empezar a enviar mensajes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showConfirmClose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white p-6 rounded shadow-lg text-center">
              <p className="mb-4 font-semibold text-lg">¿Estás Seguro/a?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    await supabase
                      .from("contactos")
                      .update({ estado: "Cerrado" })
                      .in("session_id", selectedIds);
                    setShowConfirmClose(false);
                    setShowDeletedToast(true);
                    setSelectedIds([]);
                    setShowAssignMenu(false);
                    setTimeout(() => setShowDeletedToast(false), 5000);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeletedToast && (
          <div className="fixed bottom-4 left-4 bg-white border border-gray-300 p-4 rounded shadow-lg animate-fadeIn">
            Contacto Cerrado
          </div>
        )}
        {showAssignedToast && (
          <div className="fixed bottom-4 left-4 bg-white border border-gray-300 p-4 rounded shadow-lg animate-fadeIn">
            Contacto Asignado
          </div>
        )}
        {showReopenedToast && (
          <div className="fixed bottom-4 left-4 bg-white border border-gray-300 p-4 rounded shadow-lg animate-fadeIn">
            Conversación Reabierta
          </div>
        )}
      </div>
    </>
  );
}
