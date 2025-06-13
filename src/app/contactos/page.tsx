// File: src/app/contactos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Filter, Search, Edit } from "lucide-react";
import React from "react";

interface Contact {
  session_id: string;
  name: string;
  created_at: string;
  etiquetas?: { [key: string]: string };
}

interface Note {
  id: number;
  created_at: string;
  message: {
    content: string;
    type: string;
    additional_kwargs?: { origin?: string };
  };
}

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterCondition, setFilterCondition] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [profileNotes, setProfileNotes] = useState<Note[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Nuevos estados para edición de nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Reiniciar estado de edición al abrir/cerrar modal de perfil
  useEffect(() => {
    setIsEditingName(false);
    setEditedName("");
  }, [selectedProfile]);

  // Conteo de etiquetas
  const tagCounts: Record<string, number> = {};
  contacts.forEach(c => {
    if (c.etiquetas) {
      Object.values(c.etiquetas).forEach(v => {
        const t = v.trim();
        if (t) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        }
      });
    }
  });
  const allTags = Object.keys(tagCounts);

  // Carga inicial de contactos
  useEffect(() => {
    supabase
      .from("contactos")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setContacts(data || []);
      });
  }, []);

  // Carga de notas al abrir perfil (solo origin = note)
  useEffect(() => {
    if (!selectedProfile) {
      setProfileNotes([]);
      return;
    }
    supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", selectedProfile.session_id)
      .eq("message->additional_kwargs->>origin", "note")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setProfileNotes(data || []);
      });
  }, [selectedProfile]);

  // Filtrado de contactos
  const filteredContacts = contacts.filter(c => {
    const matchName = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTagClick =
      selectedTag === null ||
      (c.etiquetas &&
        Object.values(c.etiquetas).some(
          v => v.toLowerCase() === selectedTag!.toLowerCase()
        ));
    const matchFilter =
      filterCondition === "" ||
      (c.etiquetas &&
        Object.values(c.etiquetas).some(v =>
          v.toLowerCase().includes(filterCondition.toLowerCase())
        ));
    return matchName && matchTagClick && matchFilter;
  });

  // Selección individual / global
  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedContacts.size < filteredContacts.length) {
      setSelectedContacts(new Set(filteredContacts.map(c => c.session_id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  // Click en fila abre perfil
  const handleRowClick = (c: Contact, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === "input") return;
    setSelectedProfile(c);
  };

  // Funciones para editar nombre
  const handleStartEditName = () => {
    if (!selectedProfile) return;
    setEditedName(selectedProfile.name);
    setIsEditingName(true);
  };
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };
  const handleSaveName = async () => {
    if (!selectedProfile) return;
    const { error } = await supabase
      .from("contactos")
      .update({ name: editedName })
      .eq("session_id", selectedProfile.session_id);
    if (error) {
      console.error(error);
    } else {
      // Actualizar estado local
      setContacts(prev =>
        prev.map(c =>
          c.session_id === selectedProfile.session_id
            ? { ...c, name: editedName }
            : c
        )
      );
      setSelectedProfile(prev =>
        prev ? { ...prev, name: editedName } : prev
      );
      setIsEditingName(false);
    }
  };

  // Eliminar seleccionados
  const confirmDelete = async () => {
    const ids = Array.from(selectedContacts);
    const { error } = await supabase
      .from("contactos")
      .delete()
      .in("session_id", ids);
    if (error) console.error(error);
    else {
      setContacts(prev => prev.filter(c => !selectedContacts.has(c.session_id)));
      setSelectedContacts(new Set());
      setShowDeleteConfirm(false);
      setShowActionsMenu(false);
    }
  };

  // Exportar seleccionados a CSV
  const exportCSV = () => {
    const rows = contacts.filter(c => selectedContacts.has(c.session_id));
    const header = ["session_id", "name", "created_at"];
    const csv = [
      header.join(","),
      ...rows.map(r => [r.session_id, `"${r.name}"`, r.created_at].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contactos.csv";
    a.click();
    URL.revokeObjectURL(url);
    setShowActionsMenu(false);
  };

  return (
    <div
      className="min-h-screen bg-[#f9fafb] p-8 animate-fade-in"
      onClick={() => setShowActionsMenu(false)}
    >
        {/* Header */}
        <header className="mb-2 animate-fadeIn">
          <h1 className="text-3xl font-bold text-[#1d1d1d]">Contactos</h1>
        </header>
        <hr className="border-t mb-8 animate-fadeIn" style={{ borderColor: "#4d4d4d" }} />

        <div className="flex gap-8">
          {/* Panel de etiquetas */}
          <div className="w-48 p-4 bg-white rounded shadow-md hover:scale-105 transition animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Etiquetas</h2>
              <span className="text-sm font-medium text-[#1d1d1d]">Contactos</span>
            </div>
            <ul className="space-y-1">
              {allTags.length ? (
                allTags.map(tag => {
                  const active = selectedTag === tag;
                  return (
                    <li key={tag} className="flex justify-between">
                      <button
                        onClick={() => setSelectedTag(tag)}
                        className={`text-sm ${
                          active ? "font-bold text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {tag}
                      </button>
                      <span className={active ? "text-blue-600" : "text-gray-600"}>
                        {tagCounts[tag]}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-gray-500">No hay etiquetas</li>
              )}
            </ul>
          </div>

          {/* Área de contactos */}
          <div className="flex-1 animate-fadeIn">
            {/* Controles */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-4">
                {showFilter ? (
                  <input
                    type="text"
                    placeholder="Buscar etiqueta..."
                    value={filterCondition}
                    onChange={e => setFilterCondition(e.target.value)}
                    onBlur={() => {
                      if (!filterCondition) setShowFilter(false);
                    }}
                    className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition"
                  />
                ) : (
                  <div
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => setShowFilter(true)}
                  >
                    <Filter size={20} color="#818b9c" />
                    <span className="text-gray-700">Filtro</span>
                  </div>
                )}
                {showSearch ? (
                  <input
                    type="text"
                    placeholder="Buscar nombre..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 transition"
                  />
                ) : (
                  <div
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search size={20} color="#818b9c" />
                    <span className="text-gray-700">Buscar...</span>
                  </div>
                )}
              </div>

              {/* Acciones Masivas */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  disabled={!selectedContacts.size}
                  onClick={() => setShowActionsMenu(prev => !prev)}
                  className={`px-3 py-1 rounded transition ${
                    !selectedContacts.size
                      ? "bg-white text-gray-400 cursor-not-allowed border border-gray-300"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Acciones Masivas
                </button>
                {showActionsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Eliminar Contactos
                    </button>
                    <button
                      onClick={exportCSV}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Exportar Contactos
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto bg-white p-4 rounded shadow transition animate-fadeIn">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-1 py-1 text-center">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={
                          filteredContacts.length > 0 &&
                          selectedContacts.size === filteredContacts.length
                        }
                        className="h-5 w-5 rounded border border-gray-300 checked:bg-gradient-to-br checked:from-blue-500 checked:to-blue-700 transition"
                      />
                    </th>
                    <th className="px-1 py-1 text-center">Avatar</th>
                    <th className="px-1 py-1 text-center">Nombre</th>
                    <th className="px-1 py-1 text-center">Teléfono</th>
                    <th className="px-1 py-1 text-center">Suscrito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContacts.map(contact => (
                    <tr
                      key={contact.session_id}
                      onClick={e => handleRowClick(contact, e)}
                      className="cursor-pointer hover:bg-blue-100 transition"
                    >
                      <td className="px-1 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.session_id)}
                          onChange={() => toggleSelectContact(contact.session_id)}
                          className="h-5 w-5 rounded border border-gray-300 checked:bg-gradient-to-br checked:from-blue-500 checked:to-blue-700 transition"
                        />
                      </td>
                      <td className="px-1 py-1 text-center">
                        <img
                          src="/avatar-placeholder.png"
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover mx-auto"
                        />
                      </td>
                      <td className="px-1 py-1 text-center">{contact.name}</td>
                      <td className="px-1 py-1 text-center">
                        {contact.session_id}
                      </td>
                      <td className="px-1 py-1 text-center">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Confirmación Eliminar */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-center mb-2">
                ¿Estás Seguro/a?
              </h2>
              <p className="text-sm text-gray-500 text-center mb-4">
                Esta acción no se puede deshacer
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded border"
                >
                  No
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Perfil */}
        {selectedProfile && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40"
            onClick={() => setSelectedProfile(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition hover:scale-105 z-50 animate-fadeIn"
              onClick={e => e.stopPropagation()}
            >
              {/* Cabecera Modal */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              {/* Cuerpo Modal */}
              <div className="flex flex-col items-center">
                <img
                  src="/avatar-placeholder.png"
                  alt={selectedProfile.name}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                {/* Nombre y edición */}
                <div className="flex items-center space-x-2 mb-2">
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleSaveName();
                        }
                      }}
                      className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedProfile.name}
                    </h3>
                  )}
                  <button
                    onClick={isEditingName ? handleSaveName : handleStartEditName}
                    className="text-blue-500 hover:text-blue-700 focus:outline-none"
                  >
                    <Edit size={20} />
                  </button>
                  {isEditingName && (
                    <>
                      <button
                        onClick={handleSaveName}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
                <p className="text-gray-600">{selectedProfile.session_id}</p>
                <p className="text-gray-600 mt-2">
                  Suscrito: {new Date(selectedProfile.created_at).toLocaleDateString()}
                </p>

                {/* Etiquetas */}
                {selectedProfile.etiquetas && (
                  <div className="mt-4 w-full">
                    <h4 className="text-base font-semibold text-gray-800 mb-1">
                      Etiquetas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedProfile.etiquetas).map(
                        ([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-1 rounded-full text-sm font-medium bg-[#eff7ff] text-gray-800 border border-blue-500"
                          >
                            {v}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Notas con estilo del Perfil */}
                <div className="mt-4 w-full">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">
                    Notas
                  </h4>
                  {profileNotes.length > 0 ? (
                    profileNotes.map(n => (
                      <div
                        key={n.id}
                        className="relative mb-2 p-2 bg-[#fdf0d0] rounded cursor-pointer hover:opacity-80"
                      >
                        <p className="text-sm text-gray-800">
                          {n.message.content}
                        </p>
                        <small className="text-xs text-gray-600">
                          {new Date(n.created_at).toLocaleString()}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay notas</p>
                  )}
                </div>

                {/* Cerrar */}
                <div className="mt-6 flex justify-center w-full">
                  <button
                    onClick={() => setSelectedProfile(null)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
