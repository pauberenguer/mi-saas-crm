// src/components/ContactListMini.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import {
  ChevronDown,
  ChevronsUpDown,
  Folder,
  Filter as FilterIcon,
} from "lucide-react";

export interface Contact {
  session_id: string;
  name: string;
  created_at: string;
  is_paused?: boolean;
  last_viewed_at: string;
  last_customer_message: string;
  estado?: "Abierto" | "Cerrado";
  etiquetas?: Record<string, string>;
  // <-- Añadido para reflejar asignación
  assigned_to?: string | null;
}

export interface Profile {
  id: string;
  name: string;
}

export type FilterType = "No Asignado" | "Tú" | "Equipo" | "Todos";
type StatusFilter = "Abierto" | "Cerrado" | "Todos";

interface ContactListMiniProps {
  searchTerm?: string;
  onSelect: (contact: Contact) => void;
  selectedContactId?: string;
  filter: FilterType;
  currentUser: any;
  selectedIds?: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function ContactListMini({
  searchTerm = "",
  onSelect,
  selectedContactId,
  filter,
  currentUser,
  selectedIds = [],
  onSelectionChange,
}: ContactListMiniProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [filterCondition, setFilterCondition] = useState("");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"reciente" | "antiguo">("antiguo");

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Título dinámico según filtro y carpeta (equipo)
  const headerTitle =
    filter === "Equipo" && selectedFolder
      ? profiles.find((p) => p.id === selectedFolder)?.name || filter
      : filter;

  // Actualizar "ahora" cada minuto
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Cerrar menús externos
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusMenuOpen]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortMenuOpen]);

  // Reset sub-filtros al cambiar filtro principal
  useEffect(() => {
    setStatusFilter("Todos");
    setStatusMenuOpen(false);
    setShowFilterInput(false);
    setFilterCondition("");
    setSortMenuOpen(false);
  }, [filter]);

  const diffSeconds = (ts?: string) =>
    ts ? (now - new Date(ts).getTime()) / 1000 : Infinity;

  const formatDiff = (sec: number) => {
    if (sec < 60) return "0 m";
    if (sec < 3600) return `${Math.floor(sec / 60)} m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} h`;
    return `${Math.floor(sec / 86400)} d`;
  };

  const truncate = (str: string, max = 28) =>
    str.length > max ? str.slice(0, max) + "..." : str;

  // ----------------------------
  // Fetch inicial de contactos
  // ----------------------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("contactos")
        .select(
          "session_id,name,created_at,is_paused,last_viewed_at,last_customer_message,estado,etiquetas,assigned_to"
        );

      if (filter !== "Todos") {
        query = query.neq("estado", "Cerrado");
      }
      if (filter === "No Asignado") {
        query = query.is("assigned_to", null);
      } else if (filter === "Tú") {
        query = query.eq("assigned_to", currentUser?.id);
      } else if (filter === "Equipo" && selectedFolder) {
        query = query.eq("assigned_to", selectedFolder);
      }
      if (filter === "Todos" && statusFilter !== "Todos") {
        query = query.eq("estado", statusFilter);
      }

      const { data } = await query.order("name", { ascending: true });
      if (data) setContacts(data as Contact[]);

      // Cargar timestamp del último mensaje de cada conversación
      const times: Record<string, string> = {};
      await Promise.all(
        (data || []).map(async (c) => {
          const { data: last } = await supabase
            .from("conversaciones")
            .select("created_at")
            .eq("session_id", c.session_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (last?.[0]) times[c.session_id] = last[0].created_at;
        })
      );
      setLastMessageAt(times);
      setLoading(false);
    })();
  }, [filter, currentUser?.id, selectedFolder, statusFilter]);

  // ----------------------------
  // Escuchar INSERT en conversaciones
  // ----------------------------
  useEffect(() => {
    const chan = supabase
      .channel("convos-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        async ({ new: row }) => {
          const sid = (row as any).session_id as string;
          const ts = (row as any).created_at as string;
          setLastMessageAt((p) => ({ ...p, [sid]: ts }));
          const { data: upd } = await supabase
            .from("contactos")
            .select("last_customer_message")
            .eq("session_id", sid)
            .single();
          if (upd?.last_customer_message) {
            setContacts((prev) =>
              prev.map((c) =>
                c.session_id === sid
                  ? { ...c, last_customer_message: upd.last_customer_message }
                  : c
              )
            );
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(chan);
    };
  }, []);

  // ----------------------------
  // Escuchar UPDATE en contactos (incluye assigned_to)
  // ----------------------------
  useEffect(() => {
    const chan = supabase
      .channel("contactos-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contactos" },
        ({ new: upd }) => {
          setContacts((prev) =>
            prev
              .map((c) =>
                c.session_id === upd.session_id
                  ? {
                      ...c,
                      is_paused: (upd as any).is_paused,
                      estado: (upd as any).estado,
                      etiquetas: (upd as any).etiquetas,
                      last_viewed_at: (upd as any).last_viewed_at,
                      assigned_to: (upd as any).assigned_to,  // <-- Actualiza asignación
                    }
                  : c
              )
              .filter((c) => {
                // Filtrar Cerrados si no estoy en 'Todos'
                if (filter !== "Todos" && c.estado === "Cerrado") return false;
                // Filtrar por estado en 'Todos'
                if (filter === "Todos" && statusFilter !== "Todos" && c.estado !== statusFilter)
                  return false;
                // Filtro de asignación
                if (filter === "No Asignado" && c.assigned_to != null) return false;
                if (filter === "Tú" && c.assigned_to !== currentUser?.id) return false;
                if (filter === "Equipo" && selectedFolder && c.assigned_to !== selectedFolder)
                  return false;
                return true;
              })
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(chan);
    };
  }, [filter, statusFilter, currentUser?.id, selectedFolder]);

  // ----------------------------
  // Selección de fila
  // ----------------------------
  const handleSelect = async (c: Contact) => {
    onSelect(c);
    const nowIso = new Date().toISOString();
    await supabase
      .from("contactos")
      .update({ last_viewed_at: nowIso })
      .eq("session_id", c.session_id);
    setContacts((prev) =>
      prev.map((x) =>
        x.session_id === c.session_id
          ? { ...x, last_viewed_at: nowIso }
          : x
      )
    );
  };

  // Reset de carpeta al cambiar filtro
  useEffect(() => {
    setSelectedFolder(null);
  }, [filter]);

  // Cargar perfiles para filtro 'Equipo'
  useEffect(() => {
    if (filter !== "Equipo") return;
    setLoadingProfiles(true);
    supabase
      .from("profiles")
      .select("id,name")
      .then(({ data }) => {
        if (data) setProfiles(data as Profile[]);
        setLoadingProfiles(false);
      });
  }, [filter]);

  const allChecked = contacts.length > 0 && selectedIds!.length === contacts.length;
  const toggleAll = (chk: boolean) =>
    onSelectionChange!(
      chk ? contacts.map((c) => c.session_id) : []
    );
  const toggleOne = (id: string, chk: boolean) => {
    const next = chk
      ? [...selectedIds!, id]
      : (selectedIds || []).filter((x) => x !== id);
    onSelectionChange!(next);
  };

  if (loadingProfiles && filter === "Equipo" && !selectedFolder)
    return <div className="p-4 text-center text-gray-500">Cargando…</div>;

  if (filter === "Equipo" && selectedFolder === null)
    return (
      <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
        <div className="text-center mb-2 text-gray-600">{headerTitle}</div>
        <hr className="border-t border-gray-300 mb-2" />
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

  if (loading)
    return <div className="p-4 text-center text-gray-500">Cargando…</div>;

  // Filtrado por búsqueda y etiquetas
  const filtered = contacts.filter((c) => {
    if (c.session_id === selectedContactId) return true;
    const term = searchTerm.trim().toLowerCase();
    if (
      term &&
      !c.name.toLowerCase().includes(term) &&
      !c.session_id.toLowerCase().includes(term)
    ) {
      return false;
    }
    if (showFilterInput && filterCondition.trim()) {
      const tags = c.etiquetas
        ? Object.values(c.etiquetas).map((v) => v.toLowerCase())
        : [];
      if (
        !tags.some((v) =>
          v.includes(filterCondition.trim().toLowerCase())
        )
      ) {
        return false;
      }
    }
    return true;
  });

  // Ordenar por fecha de último mensaje
  const sorted = filtered.sort((a, b) => {
    const ta = lastMessageAt[a.session_id]
      ? new Date(lastMessageAt[a.session_id]).getTime()
      : 0;
    const tb = lastMessageAt[b.session_id]
      ? new Date(lastMessageAt[b.session_id]).getTime()
      : 0;
    return sortOrder === "reciente" ? tb - ta : ta - tb;
  });

  return (
    <div className="overflow-y-auto bg-white p-4 rounded shadow h-full">
      <div className="text-center mb-2 text-gray-600">{headerTitle}</div>
      <hr className="border-t border-gray-300 mb-2" />

      {/* CONTROLES: selección múltiple, estado, búsqueda, orden */}
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-gray-600 mr-2"
          checked={allChecked}
          onChange={(e) => toggleAll(e.target.checked)}
        />
        <span className="text-gray-600 mr-1">
          {filter === "Todos" ? statusFilter : "Abrir"}
        </span>
        <span className="font-medium text-gray-700 ml-1">
          {sorted.length}
        </span>

        {filter === "Todos" && !showFilterInput && (
          <div ref={statusMenuRef} className="relative ml-1">
            <button onClick={() => setStatusMenuOpen((o) => !o)}>
              <ChevronDown className="h-4 w-4 text-gray-600 inline" />
            </button>
            {statusMenuOpen && (
              <ul className="absolute left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                {(["Abierto", "Cerrado", "Todos"] as StatusFilter[]).map(
                  (o) => (
                    <li
                      key={o}
                      className="px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setStatusFilter(o);
                        setStatusMenuOpen(false);
                      }}
                    >
                      {o}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center relative">
          {showFilterInput ? (
            <input
              type="text"
              placeholder="Buscar etiqueta..."
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              onBlur={() => {
                if (!filterCondition) setShowFilterInput(false);
              }}
              className="mx-2 w-65 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-400 transition text-gray-600"
              autoFocus
            />
          ) : (
            <FilterIcon
              onClick={() => setShowFilterInput(true)}
              className="mx-2 h-5 w-5 text-gray-600 cursor-pointer"
            />
          )}
          <div ref={sortMenuRef} className="relative ml-2">
            <ChevronsUpDown
              onClick={() => setSortMenuOpen((o) => !o)}
              className="h-4 w-4 text-gray-600 cursor-pointer"
            />
            {sortMenuOpen && (
              <ul className="absolute right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                <li
                  className="px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSortOrder("reciente");
                    setSortMenuOpen(false);
                  }}
                >
                  Más Reciente
                </li>
                <li
                  className="px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSortOrder("antiguo");
                    setSortMenuOpen(false);
                  }}
                >
                  Más Antiguo
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <hr className="border-t border-gray-300 mb-2" />

      <table className="min-w-full">
        <tbody className="divide-y divide-gray-200">
          {sorted.map((c) => {
            const secs = diffSeconds(lastMessageAt[c.session_id]);
            const preview = truncate(c.last_customer_message);
            const unread =
              new Date(lastMessageAt[c.session_id]).getTime() >
              new Date(c.last_viewed_at).getTime();

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
                    className={`form-checkbox h-4 w-4 text-gray-600 ${
                      selectedIds!.includes(c.session_id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    checked={selectedIds!.includes(c.session_id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleOne(c.session_id, e.target.checked);
                    }}
                  />
                </td>
                <td className="pl-0 pr-4 py-2">
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
                          unread ? "text-gray-800 font-semibold" : "text-gray-600"
                        }`}
                      >
                        {c.name}
                      </div>
                      <div
                        className={`${
                          unread ? "text-gray-700" : "text-gray-500"
                        } text-xs`}
                      >
                        {preview}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-xs">
                  {unread && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1 transform -translate-y-0.5" />
                  )}
                  <span className={unread ? "text-blue-500" : "text-gray-500"}>
                    {formatDiff(secs)}
                  </span>
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-500">
                No hay resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
