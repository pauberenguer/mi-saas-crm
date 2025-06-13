// File: app/chat/page.tsx
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
  Play,
  Pause,
  ChevronDown,
} from "lucide-react";
import ContactListMini, { Contact as BaseContact, FilterType } from "../../components/ContactListMini";
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

interface SupabaseMessage {
  session_id: string;
  content: string;
  created_at: string;
  message: Record<string, unknown>;
}

// Extend BaseContact to include assigned_to and estado
type Contact = BaseContact & { assigned_to: string | null; estado: string };

export default function ChatPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("No Asignado");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEtiquetas, setContactEtiquetas] = useState<Record<string, string> | null>(null);
  const [messageMode, setMessageMode] = useState<"Responder" | "Nota">("Responder");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [contactPauseUntil, setContactPauseUntil] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [headerSearch, setHeaderSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedContactStates, setSelectedContactStates] = useState<
    { session_id: string; estado: string }[]
  >([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // Pause menu
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  const pauseMenuRef = useRef<HTMLDivElement>(null);

  // Confirm close
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Toasts
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [showAssignedToast, setShowAssignedToast] = useState(false);
  const [showReopenedToast, setShowReopenedToast] = useState(false);
  const [assignedToName, setAssignedToName] = useState<string>("");

  // Assign menu refs
  const assignButtonRef = useRef<HTMLButtonElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Conteos de contactos por filtro
  const [counts, setCounts] = useState<Record<FilterType, number>>({
    "No Asignado": 0,
    Tú: 0,
    Equipo: 0,
    Todos: 0,
  });

  // Función para obtener los conteos
  const fetchCounts = async () => {
    if (!currentUser) return;
    const labels: FilterType[] = ["No Asignado", "Tú", "Equipo", "Todos"];
    const newCounts: Record<FilterType, number> = {
      "No Asignado": 0,
      Tú: 0,
      Equipo: 0,
      Todos: 0,
    };

    for (const label of labels) {
      let query = supabase
        .from("contactos")
        .select("session_id", { count: "exact", head: true });

      if (label === "No Asignado") {
        query = query
          .is("assigned_to", null)
          .eq("estado", "Abierto"); // solo abiertos y sin asignar
      } else if (label === "Tú") {
        query = query.eq("assigned_to", currentUser.id).eq("estado", "Abierto");
      } else if (label === "Equipo") {
        query = query
          .not("assigned_to", "is", null)
          .eq("estado", "Abierto");
      }
      // "Todos" no modifica la query

      const { count, error } = await query;
      if (!error) newCounts[label] = count ?? 0;
    }

    setCounts(newCounts);
  };

  // Load current user
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    }
    fetchUser();
  }, []);

  // Una vez que sabemos quién es el usuario, traemos los conteos
  useEffect(() => {
    fetchCounts();
  }, [currentUser]);

  // Load profiles
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .then((res) => {
        if (!res.error) setProfiles(res.data as Profile[]);
      });
  }, []);

  // Fetch estado of selected for bulk
  useEffect(() => {
    if (!selectedIds.length) {
      setSelectedContactStates([]);
      return;
    }
    supabase
      .from("contactos")
      .select("session_id, estado")
      .in("session_id", selectedIds)
      .then((res) => {
        if (!res.error)
          setSelectedContactStates(res.data as { session_id: string; estado: string }[]);
      });
  }, [selectedIds]);

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

  // Close pause menu on outside click
  useEffect(() => {
    if (!showPauseMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        pauseMenuRef.current &&
        !pauseMenuRef.current.contains(e.target as Node) &&
        pauseButtonRef.current &&
        !pauseButtonRef.current.contains(e.target as Node)
      ) {
        setShowPauseMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPauseMenu]);

  // Fetch contact details on select
  useEffect(() => {
    if (!selectedContact) return;
    supabase
      .from("contactos")
      .select("assigned_to, etiquetas, estado, is_paused, pause_until")
      .eq("session_id", selectedContact.session_id)
      .single()
      .then((res) => {
        if (!res.error) {
          setSelectedContact((prev) =>
            prev ? { ...prev, assigned_to: res.data.assigned_to, estado: res.data.estado } : prev
          );
          setContactEtiquetas(res.data.etiquetas || {});
          setIsPaused(res.data.is_paused);
          setContactPauseUntil(res.data.pause_until);
        }
      });
  }, [selectedContact?.session_id]);

  // Real-time updates for contact
  useEffect(() => {
    if (!selectedContact) return;
    const chan = supabase
      .channel(`contactos-realtime-${selectedContact.session_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contactos",
          filter: `session_id=eq.${selectedContact.session_id}`,
        },
        ({ new: u }) => {
          setIsPaused((u as any).is_paused);
          setContactPauseUntil((u as any).pause_until);
          setContactEtiquetas((u as any).etiquetas || {});
        }
      )
      .subscribe();
    return () => supabase.removeChannel(chan);
  }, [selectedContact?.session_id]);

  // Real-time updates for notes
  useEffect(() => {
    if (!selectedContact) return;
    const channel = supabase
      .channel(`notes-realtime-${selectedContact.session_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversaciones",
          filter: `session_id=eq.${selectedContact.session_id}`,
        },
        ({ new: row }) => {
          try {
            const m = typeof row.message === "string" ? JSON.parse(row.message) : row.message;
            if (m.additional_kwargs?.origin === "note") {
              setNotes((prev) => [
                ...prev,
                { id: row.id, message: m, created_at: row.created_at },
              ]);
            }
          } catch {}
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedContact?.session_id]);

  // Countdown timer
  useEffect(() => {
    if (!contactPauseUntil) {
      setTimeLeft(0);
      return;
    }
    const update = () => {
      const ms = Date.parse(contactPauseUntil) - Date.now();
      if (ms <= 0) resumeAutomation();
      else setTimeLeft(ms);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [contactPauseUntil]);

  const formatTime = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(
      s
    ).padStart(2, "0")}`;
  };

  // Pause / resume
  const pauseAutomation = async (duration: number | null) => {
    if (!selectedContact) return;
    const payload: any = { is_paused: true, pause_until: null };
    if (duration) payload.pause_until = new Date(Date.now() + duration).toISOString();
    await supabase.from("contactos").update(payload).eq("session_id", selectedContact.session_id);
    setIsPaused(true);
    setContactPauseUntil(payload.pause_until);
  };
  const resumeAutomation = async () => {
    if (!selectedContact) return;
    await supabase
      .from("contactos")
      .update({ is_paused: false, pause_until: null })
      .eq("session_id", selectedContact.session_id);
    setIsPaused(false);
    setContactPauseUntil(null);
    setShowPauseMenu(false);
  };

  // Bulk actions
  const assignConversationsTo = async (userId: string) => {
    if (!selectedIds.length) return;
    const profile = profiles.find((p) => p.id === userId);
    setAssignedToName(profile?.name || "");
    await supabase.from("contactos").update({ assigned_to: userId }).in("session_id", selectedIds);
    setSelectedIds([]);
    setShowAssignMenu(false);
    await fetchCounts();
    setShowAssignedToast(true);
    setTimeout(() => setShowAssignedToast(false), 5000);
  };
  const unassignConversations = async () => {
    if (!selectedIds.length) return;
    await supabase.from("contactos").update({ assigned_to: null }).in("session_id", selectedIds);
    setSelectedIds([]);
    setActiveFilter("No Asignado");
    setShowAssignMenu(false);
    await fetchCounts();
  };
  const markAsClosed = async () => {
    if (!selectedIds.length) return;
    await supabase
      .from("contactos")
      .update({ estado: "Cerrado", assigned_to: null })
      .in("session_id", selectedIds);
    setSelectedIds([]);
    setShowDeletedToast(true);
    await fetchCounts();
    setTimeout(() => setShowDeletedToast(false), 5000);
  };
  const reOpenConversations = async () => {
    if (!selectedIds.length) return;
    await supabase
      .from("contactos")
      .update({ estado: "Abierto", assigned_to: null })
      .in("session_id", selectedIds);
    setSelectedIds([]);
    setActiveFilter("No Asignado");
    setShowAssignMenu(false);
    await fetchCounts();
    setShowReopenedToast(true);
    setTimeout(() => setShowReopenedToast(false), 5000);
  };

  // Assign current contact
  const assignCurrentContactTo = async (userId: string) => {
    if (!selectedContact) return;
    const profile = profiles.find((p) => p.id === userId);
    setAssignedToName(profile?.name || "");
    await supabase
      .from("contactos")
      .update({ assigned_to: userId })
      .eq("session_id", selectedContact.session_id);
    setShowAssignMenu(false);
    await fetchCounts();
    setShowAssignedToast(true);
    setTimeout(() => setShowAssignedToast(false), 5000);
  };
  const unassignCurrentContact = async () => {
    if (!selectedContact) return;
    await supabase
      .from("contactos")
      .update({ assigned_to: null })
      .eq("session_id", selectedContact.session_id);
    setShowAssignMenu(false);
    await fetchCounts();
    setShowAssignedToast(true);
    setTimeout(() => setShowAssignedToast(false), 5000);
  };

  // Notes & tags
  const handleNoteClick = (note: Note) => {
    document.getElementById(`note-${note.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const deleteNote = (id: number) => {
    supabase
      .from("conversaciones")
      .delete()
      .eq("id", id)
      .then(() =>
        selectedContact &&
        supabase
          .from("conversaciones")
          .select("*")
          .eq("session_id", selectedContact.session_id)
          .eq("message->additional_kwargs->>origin", "note")
          .order("id", { ascending: true })
      )
      .then((res) => res?.data && setNotes(res.data as Note[]));
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

  // Select contact
  const handleSelectContact = async (c: BaseContact) => {
    if (selectedContact) {
      await supabase
        .from("contactos")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("session_id", selectedContact.session_id);
    }
    setSelectedContact({ ...c, assigned_to: null, estado: "Abierto" });
    const { data } = await supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", c.session_id)
      .eq("message->additional_kwargs->>origin", "note")
      .order("id", { ascending: true });
    if (data) setNotes(data as Note[]);
  };

  const allClosed =
    selectedContactStates.length > 0 &&
    selectedContactStates.every((s) => s.estado === "Cerrado");
  const allOpen =
    selectedContactStates.length > 0 &&
    selectedContactStates.every((s) => s.estado === "Abierto");

  const assignedProfile = profiles.find(
    (p) => p.id === selectedContact?.assigned_to
  );

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>

      <div className="relative flex flex-col h-full bg-gray-50 p-8 animate-fadeIn">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        {/* Header */}
        <div className="animate-fadeIn mb-2 grid grid-cols-3 items-center">
          <h1 className="text-3xl font-bold" style={{ color: "#1d1d1d" }}>
            Chat
          </h1>
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
        <hr
          className="border-t mb-8 animate-fadeIn"
          style={{ borderColor: "#4d4d4d" }}
        />

        <div className="flex flex-1">
          {/* Sidebar Filters */}
          <aside className="w-48 p-4">
            <h2 className="text-xl font-bold mb-4">Conversaciones</h2>
            <div className="flex flex-col space-y-2">
              {["No Asignado", "Tú", "Equipo", "Todos"].map((label) => {
                const Icon = {
                  "No Asignado": XCircle,
                  Tú: User,
                  Equipo: Users,
                  Todos: List,
                }[label];
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setActiveFilter(label as FilterType);
                      setSelectedContact(null);
                      setSelectedIds([]);
                      setShowAssignMenu(false);
                    }}
                    className={`flex items-center px-2 py-1 rounded ${
                      activeFilter === label
                        ? "bg-gray-200 text-gray-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="ml-2">{label}</span>
                    <span className="ml-auto text-sm text-gray-500">
                      {counts[label as FilterType]}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex flex-1">
            {/* Contact List */}
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

            {/* Bulk Actions or Chat View */}
            {selectedIds.length > 0 ? (
              <div className="flex-1">
                <div className="h-full flex flex-col items-center justify-center bg-white shadow rounded p-4 space-y-4">
                  {/* Asignar.svg visible in every filter when bulk */}
                  <img src="/asignar.svg" alt="Asignar" className="w-48 mb-4" />

                  {activeFilter === "No Asignado" && (
                    <>
                      <p className="text-[#4d4d4d] font-medium mb-4">
                        {selectedIds.length} Conversaciones Seleccionadas
                      </p>
                      <button
                        onClick={markAsClosed}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Marcar Como
                        Cerrado
                      </button>
                      <div className="relative w-64 mb-2">
                        <button
                          ref={assignButtonRef}
                          onClick={() => setShowAssignMenu((v) => !v)}
                          className="border-2 border-gray-300 w-full px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Asignar
                          Conversaciones
                        </button>
                        {showAssignMenu && (
                          <div
                            ref={assignMenuRef}
                            className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg w-full max-h-60 overflow-y-auto z-20"
                          >
                            {profiles.map((p) => (
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
                                <span className="text-sm">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" /> Quitar selección
                      </button>
                    </>
                  )}
                  {(activeFilter === "Tú" || activeFilter === "Equipo") && (
                    <>
                      <button
                        onClick={markAsClosed}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Marcar como
                        Cerrado
                      </button>
                      <div className="relative w-64">
                        <button
                          ref={assignButtonRef}
                          onClick={() => setShowAssignMenu((v) => !v)}
                          className="border-2 border-gray-300 w-full px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Asignar
                          conversaciones
                        </button>
                        {showAssignMenu && (
                          <div
                            ref={assignMenuRef}
                            className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg w-full max-h-60 overflow-y-auto z-20"
                          >
                            {profiles.map((p) => (
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
                                <span className="text-sm">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={unassignConversations}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> No asignar
                        conversaciones
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" /> Quitar selección
                      </button>
                    </>
                  )}
                  {activeFilter === "Todos" && allOpen && (
                    <>
                      <button
                        onClick={markAsClosed}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Marcar
                        como Cerrado
                      </button>
                      <div className="relative w-64">
                        <button
                          ref={assignButtonRef}
                          onClick={() => setShowAssignMenu((v) => !v)}
                          className="border-2 border-gray-300 w-full px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          <UserPlus className="w-4 h-4 mr-1" /> Asignar
                          conversaciones
                        </button>
                        {showAssignMenu && (
                          <div
                            ref={assignMenuRef}
                            className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg w-full max-h-60 overflow-y-auto z-20"
                          >
                            {profiles.map((p) => (
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
                                <span className="text-sm">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={unassignConversations}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> No asignar
                        conversaciones
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" /> Quitar selección
                      </button>
                    </>
                  )}
                  {activeFilter === "Todos" && allClosed && (
                    <>
                      <button
                        onClick={reOpenConversations}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Reabrir
                        Conversaciones
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        <XIcon className="w-4 h-4 mr-1" /> Quitar selección
                      </button>
                    </>
                  )}
                  {activeFilter === "Todos" && !allOpen && !allClosed && (
                    <button
                      onClick={() => setSelectedIds([])}
                      className="border-2 border-gray-300 w-64 px-4 py-2 rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      <XIcon className="w-4 h-4 mr-1" /> Quitar selección
                    </button>
                  )}
                </div>
              </div>
            ) : selectedContact ? (
              <>
                <div className="flex-1">
                  <div className="bg-white shadow rounded p-4 h-full flex flex-col">
                    {/* Header dinámico con avatar y flecha */}
                    <div className="mb-2 flex items-center">
                      {assignedProfile ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={assignedProfile.avatar_url || "/avatar-placeholder.png"}
                            alt={assignedProfile.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-500">
                            {assignedProfile.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {activeFilter}
                        </span>
                      )}
                      <div className="relative inline-block ml-2">
                        <button
                          ref={assignButtonRef}
                          onClick={() => setShowAssignMenu((v) => !v)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <ChevronDown size={16} className="text-gray-500" />
                        </button>
                        {showAssignMenu && (
                          <div
                            ref={assignMenuRef}
                            className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-20 max-h-60 overflow-y-auto"
                          >
                            <button
                              onClick={unassignCurrentContact}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                            >
                              <XIcon className="w-6 h-6 mr-2" />
                              <span className="text-sm">No Asignar</span>
                            </button>
                            {profiles
                              .filter((p) => p.id !== selectedContact.assigned_to)
                              .map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => assignCurrentContactTo(p.id)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                >
                                  <img
                                    src={p.avatar_url || "/avatar-placeholder.png"}
                                    alt={p.name}
                                    className="w-6 h-6 rounded-full mr-2 object-cover"
                                  />
                                  <span className="text-sm">{p.name}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <hr className="border-t border-gray-200 mb-4" />

                    <div className="flex items-center mb-4">
                      <img
                        src="/avatar-placeholder.png"
                        alt={selectedContact.name}
                        className="w-10 h-10 rounded-full mr-2 shadow-md"
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
                <aside className="w-1/4 bg-white shadow rounded p-4 flex flex-col overflow-y-auto">
                  <h2 className="text-xl font-bold mb-2">
                    {selectedContact.name}
                  </h2>
                  <img
                    src="/avatar-placeholder.png"
                    alt={selectedContact.name}
                    className="w-24 h-24 rounded-full mb-4"
                  />
                  <div className="flex items-center mb-4 space-x-1">
                    <Phone size={16} color="#818b9c" />
                    <span className="text-sm text-gray-700">
                      {selectedContact.session_id}
                    </span>
                  </div>
                  <hr className="border-t border-gray-300 mb-4" />

                  {/* Automatización */}
                  <div className="mb-4 relative">
                    <p className="font-semibold mb-2">Automatización</p>
                    {isPaused ? (
                      <>
                        <button
                          ref={pauseButtonRef}
                          onClick={() => setShowPauseMenu((v) => !v)}
                          className={`w-full py-2 rounded ${
                            showPauseMenu ? "bg-gray-600" : "bg-gray-500"
                          } text-white`}
                        >
                          {contactPauseUntil
                            ? formatTime(timeLeft)
                            : "Pausado"}
                        </button>
                        {showPauseMenu && (
                          <div
                            ref={pauseMenuRef}
                            className="absolute top-full mt-1 w-full bg-white border rounded shadow-lg z-20"
                          >
                            <button
                              onClick={resumeAutomation}
                              className="w-full px-4 py-2 hover:bg-gray-100 flex items-center"
                            >
                              <Play className="w-4 h-4 mr-2" /> Reanudar
                            </button>
                            {[
                              { label: "30 Minutos", duration: 30 * 60 * 1000 },
                              { label: "1 Hora", duration: 60 * 60 * 1000 },
                              { label: "Pausar Para Siempre", duration: null },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => {
                                  setShowPauseMenu(false);
                                  pauseAutomation(opt.duration);
                                }}
                                className="w-full px-4 py-2 hover:bg-gray-100 flex items-center"
                              >
                                {opt.label === "Pausar Para Siempre" && (
                                  <Pause className="w-4 h-4 mr-2" />
                                )}
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          ref={pauseButtonRef}
                          onClick={() => setShowPauseMenu(true)}
                          className={`w-full py-2 rounded ${
                            showPauseMenu ? "bg-blue-600" : "bg-blue-500"
                          } text-white`}
                        >
                          Pausar
                        </button>
                        {showPauseMenu && (
                          <div
                            ref={pauseMenuRef}
                            className="absolute top-full mt-1 w-full bg-white border rounded shadow-lg z-20"
                          >
                            {[
                              { label: "30 Minutos", duration: 30 * 60 * 1000 },
                              { label: "1 Hora", duration: 60 * 60 * 1000 },
                              { label: "Pausar Para Siempre", duration: null },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => {
                                  setShowPauseMenu(false);
                                  pauseAutomation(opt.duration);
                                }}
                                className="w-full px-4 py-2 hover:bg-gray-100 flex items-center"
                              >
                                {opt.label === "Pausar Para Siempre" && (
                                  <Pause className="w-4 h-4 mr-2" />
                                )}
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <hr className="border-t border-gray-300 mb-4" />

                  {/* Notas */}
                  <div className="mb-4">
                    <p className="font-semibold mb-2">Notas</p>
                    {notes.length ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          id={`note-${note.id}`}
                          onClick={() => handleNoteClick(note)}
                          className="relative p-2 mb-2 bg-[#fdf0d0] rounded cursor-pointer hover:opacity-80"
                        >
                          <button
                            onClick={(e) => {
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
                            {note.created_at &&
                              new Date(note.created_at).toLocaleString()}
                          </small>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        No hay notas.
                      </span>
                    )}
                  </div>

                  <hr className="border-t border-gray-300 mb-4" />

                  {/* Etiquetas */}
                  <p className="font-semibold mb-2">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {contactEtiquetas &&
                      Object.entries(contactEtiquetas).map(
                        ([key, value]) =>
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
                </aside>
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

        {/* Confirm Close Modal */}
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
                      .update({ estado: "Cerrado", assigned_to: null })
                      .in("session_id", selectedIds);
                    setShowConfirmClose(false);
                    setShowDeletedToast(true);
                    setSelectedIds([]);
                    setShowAssignMenu(false);
                    await fetchCounts();
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

        {/* Toasts */}
        {showDeletedToast && (
          <div className="fixed bottom-4 left-4 bg-white border p-4 rounded shadow-lg animate-fadeIn">
            Contacto Cerrado
          </div>
        )}
        {showAssignedToast && (
          <div className="fixed bottom-4 left-4 bg-white border p-4 rounded shadow-lg animate-fadeIn">
            Contacto Asignado a {assignedToName}
          </div>
        )}
        {showReopenedToast && (
          <div className="fixed bottom-4 left-4 bg-white border p-4 rounded shadow-lg animate-fadeIn">
            Conversación Reabierta
          </div>
        )}
      </div>
    </>
  );
}
