// File: src/components/ContactListMini.tsx
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
  last_viewed_at: string;
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
  const [lastMessageAt, setLastMessageAt] = useState<Record<string, string>>({});
  const [lastMessageText, setLastMessageText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const diffSeconds = (ts?: string) =>
    ts ? (Date.now() - new Date(ts).getTime()) / 1000 : Infinity;
  const formatDiff = (sec: number) => {
    if (sec < 60) return `${Math.floor(sec)} seg`;
    if (sec < 3600) return `${Math.floor(sec / 60)} min`;
    return `${Math.floor(sec / 3600)} h`;
  };

  // 1) Initial load of contacts
  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from<Contact>("contactos")
        .select("session_id,name,created_at,is_paused,last_viewed_at");
      if (filter === "No Asignado") q = q.is("assigned_to", null);
      else if (filter === "Tú") q = q.eq("assigned_to", currentUser.id);
      else if (filter === "Equipo" && selectedFolder)
        q = q.eq("assigned_to", selectedFolder);

      const { data: ct } = await q.order("name", { ascending: true });
      if (ct) setContacts(ct);

      const times: Record<string, string> = {};
      const texts: Record<string, string> = {};
      await Promise.all(
        (ct || []).map(async (c) => {
          const { data: msg } = await supabase
            .from("conversaciones")
            .select("created_at,message")
            .eq("session_id", c.session_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (msg?.[0]) {
            times[c.session_id] = msg[0].created_at;
            texts[c.session_id] = msg[0].message.content;
          }
        })
      );
      setLastMessageAt(times);
      setLastMessageText(texts);
      setLoading(false);
    })();
  }, [filter, currentUser?.id, selectedFolder]);

  // 2) Real-time updates of lastMessageAt
  useEffect(() => {
    const ch = supabase
      .channel("convos-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        ({ new: row }) => {
          const sid = (row as any).session_id as string;
          const ts = (row as any).created_at as string;
          setLastMessageAt((t) => ({ ...t, [sid]: ts }));
          setLastMessageText((t) => ({ ...t, [sid]: (row as any).message.content }));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // 3) Handle selecting a contact: clear unread and update last_viewed_at
  const handleSelect = async (c: Contact) => {
    onSelect(c);
    const nowIso = new Date().toISOString();
    await supabase
      .from("contactos")
      .update({ last_viewed_at: nowIso })
      .eq("session_id", c.session_id);
    setContacts((cs) =>
      cs.map((x) =>
        x.session_id === c.session_id ? { ...x, last_viewed_at: nowIso } : x
      )
    );
  };

  // 4) Reset folder on filter change
  useEffect(() => {
    setSelectedFolder(null);
  }, [filter]);

  // 5) Load team profiles
  useEffect(() => {
    if (filter !== "Equipo") return;
    setLoadingProfiles(true);
    supabase
      .from<Profile>("profiles")
      .select("id,name")
      .then(({ data, error }) => {
        if (!error) setProfiles(data || []);
        setLoadingProfiles(false);
      });
  }, [filter]);

  // Selection helpers
  const allChecked = contacts.length > 0 && selectedIds.length === contacts.length;
  const toggleAll = (chk: boolean) =>
    onSelectionChange(chk ? contacts.map((c) => c.session_id) : []);
  const toggleOne = (id: string, chk: boolean) => {
    const next = chk
      ? [...selectedIds, id]
      : selectedIds.filter((x) => x !== id);
    onSelectionChange(next);
  };

  if (loadingProfiles && filter === "Equipo" && !selectedFolder)
    return <div className="p-4 text-center text-gray-500">Cargando…</div>;
  if (filter === "Equipo" && selectedFolder === null) {
    return (
      <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
        <h3 className="mb-4 font-semibold text-gray-700">Miembros del Equipo</h3>
        <ul className="divide-y divide-gray-200">
          {profiles.map((p) => (
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
  if (loading)
    return <div className="p-4 text-center text-gray-500">Cargando…</div>;

  // 6) Sort contacts by recency
  const sortedContacts = [...contacts].sort(
    (a, b) =>
      diffSeconds(lastMessageAt[a.session_id]) -
      diffSeconds(lastMessageAt[b.session_id])
  );

  return (
    <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
      <div className="text-center mb-2 text-sm text-gray-700">{filter}</div>
      <hr className="border-t border-gray-200 mb-2" />

      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600 mr-2"
          checked={allChecked}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <span className="text-sm text-gray-700 mr-2">Abrir</span>
        <span className="text-sm font-medium text-gray-800 mr-2">
          {sortedContacts.length}
        </span>
        <div className="relative inline-block">
          <button onClick={() => setMenuOpen((o) => !o)}>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {menuOpen && (
            <ul className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded shadow-md z-10">
              {["Abierto", "Cerrado", "Todos"].map((o) => (
                <li
                  key={o}
                  className="px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
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
          {sortedContacts.map((c) => {
            const secs = diffSeconds(lastMessageAt[c.session_id]);
            const previewRaw = lastMessageText[c.session_id] || "";
            const preview =
              previewRaw.length > 30 ? previewRaw.slice(0, 30) + "..." : previewRaw;
            const unread =
              new Date(lastMessageAt[c.session_id]).getTime() >
                new Date(c.last_viewed_at).getTime() &&
              c.session_id !== selectedContactId;

            return (
              <tr
                key={c.session_id}
                onClick={() => handleSelect(c)}
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
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOne(c.session_id, e.target.checked);
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <div className="relative inline-block">
                      <img
                        src="/avatar-placeholder.png"
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {c.is_paused && (
                        <span
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                          title="Pausado"
                        />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div
                        className={`${
                          unread ? "text-gray-900 font-semibold" : "text-gray-600"
                        }`}
                      >
                        {c.name}
                      </div>
                      <div
                        className={`${
                          unread ? "text-gray-800" : "text-gray-500"
                        } text-xs`}
                      >
                        {preview}
                      </div>
                    </div>
                    {unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-xs text-gray-500">
                  {formatDiff(secs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
