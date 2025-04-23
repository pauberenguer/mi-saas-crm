// src/components/ContactListMini.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  ChevronDown,
  Filter,
  ChevronsUpDown,
  Folder,
} from "lucide-react";

export interface Contact {
  session_id: string;
  name: string;
  created_at: string;
  is_paused?: boolean;
}

export interface Profile {
  id: string;
  name: string;
}

type FilterType = "No Asignado" | "Tú" | "Equipo" | "Todos";

interface ContactListMiniProps {
  onSelect: (contact: Contact) => void;
  selectedContactId?: string;
  filter: FilterType;
  currentUser: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function ContactListMini({
  onSelect,
  selectedContactId,
  filter,
  currentUser,
  selectedIds,
  onSelectionChange,
}: ContactListMiniProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"Abierto" | "Cerrado" | "Todos">("Abierto");

  // 1) Suscripción en real‑time a toda la tabla "contactos"
  useEffect(() => {
    const channel = supabase
      .channel("contacts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contactos" },
        (payload) => {
          const nc = payload.new as Contact;
          setContacts(prev => {
            if (payload.eventType === "INSERT") {
              return [...prev, nc];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map(c =>
                c.session_id === nc.session_id ? nc : c
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter(c => c.session_id !== (payload.old as Contact).session_id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2) Reset folder on filter change
  useEffect(() => {
    setSelectedFolder(null);
  }, [filter]);

  // 3) Fetch team profiles for 'Equipo'
  useEffect(() => {
    if (filter !== "Equipo") return;
    setLoadingProfiles(true);
    supabase
      .from<Profile>("profiles")
      .select("id, name")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setProfiles(data || []);
        setLoadingProfiles(false);
      });
  }, [filter]);

  // 4) Initial load of contacts & last messages
  useEffect(() => {
    if (!currentUser) return;
    if (filter === "Equipo" && selectedFolder === null) return;

    (async () => {
      setLoading(true);
      let q = supabase.from<Contact>("contactos").select("*");
      if (filter === "No Asignado") q = q.is("assigned_to", null);
      else if (filter === "Tú") q = q.eq("assigned_to", currentUser.id);
      else if (filter === "Equipo") q = q.eq("assigned_to", selectedFolder!);

      const { data, error } = await q.order("name", { ascending: true });
      if (!error) setContacts(data || []);

      // traer último mensaje
      await Promise.all(
        (data || []).map(async c => {
          const { data: msg } = await supabase
            .from("conversaciones")
            .select("message")
            .eq("session_id", c.session_id)
            .eq("message->>type", "human")
            .order("id", { ascending: false })
            .limit(1);
          if (msg?.[0]?.message)
            setLastMessages(m => ({ ...m, [c.session_id]: msg[0].message.content }));
        })
      );

      setLoading(false);
    })();
  }, [filter, currentUser, selectedFolder]);

  // 5) Helpers de selección
  const allChecked = contacts.length > 0 && selectedIds.length === contacts.length;
  const toggleAll = (chk: boolean) =>
    onSelectionChange(chk ? contacts.map(c => c.session_id) : []);
  const toggleOne = (id: string, chk: boolean) => {
    const next = chk ? [...selectedIds, id] : selectedIds.filter(x => x !== id);
    onSelectionChange(next);
  };

  // 6) Render loading / empty states
  if (loadingProfiles && filter === "Equipo" && !selectedFolder)
    return <div className="p-4 text-center text-gray-500">Cargando…</div>;

  if (filter === "Equipo" && selectedFolder === null) {
    return (
      <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
        <h3 className="mb-4 font-semibold text-gray-700">Miembros del Equipo</h3>
        <ul className="divide-y divide-gray-200">
          {profiles.map(p => (
            <li
              key={p.id}
              className="flex items-center py-2 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedFolder(p.id)}
            >
              <Folder className="w-5 h-5 text-gray-500 mr-3" />
              <span className="text-gray-800">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando…</div>;

  return (
    <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
      <div className="text-center mb-2 text-sm text-gray-700">{filter}</div>
      <hr className="border-t border-gray-200 mb-2" />
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600 mr-2"
          checked={allChecked}
          onChange={e => toggleAll(e.target.checked)}
        />
        <span className="text-sm text-gray-700 mr-2">Abrir</span>
        <span className="text-sm font-medium text-gray-800 mr-2">
          {contacts.length}
        </span>
        <div className="relative inline-block">
          <button onClick={() => setMenuOpen(o => !o)}>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {menuOpen && (
            <ul className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded shadow-md z-10">
              {["Abierto", "Cerrado", "Todos"].map(o => (
                <li
                  key={o}
                  className="px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setStatusFilter(o as any);
                    setMenuOpen(false);
                  }}
                >
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ml-auto flex space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <ChevronsUpDown className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <hr className="border-t border-gray-200 mb-2" />
      <table className="min-w-full">
        <tbody className="divide-y divide-gray-200">
          {contacts.map(c => (
            <tr
              key={c.session_id}
              onClick={() => onSelect(c)}
              className={`group hover:bg-gray-50 cursor-pointer ${
                selectedContactId === c.session_id ? "bg-gray-100" : ""
              }`}
            >
              <td className="px-4 py-2 w-10">
                <input
                  type="checkbox"
                  className={`form-checkbox h-4 w-4 text-blue-600 ${
                    selectedIds.includes(c.session_id)
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  checked={selectedIds.includes(c.session_id)}
                  onChange={e => {
                    e.stopPropagation();
                    toggleOne(c.session_id, e.target.checked);
                  }}
                />
              </td>
              <td className="px-4 py-2">
                <div className="relative inline-block">
                  <img
                    src="/avatar-placeholder.png"
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {c.is_paused && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center"
                      title="Pausado"
                    >
                      <span className="block w-1 h-1 bg-white" />
                    </span>
                  )}
                </div>
                <div className="inline-block align-top ml-4">
                  <div className="font-semibold text-gray-600">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {lastMessages[c.session_id] || ""}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
