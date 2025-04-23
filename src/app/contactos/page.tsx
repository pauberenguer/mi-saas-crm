// File: src/app/contactos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Filter, Search } from "lucide-react";

interface Contact {
  session_id: string; // Teléfono
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

  // Extraer etiquetas únicas y contar
  const tagCounts: Record<string, number> = {};
  contacts.forEach(c => {
    if (c.etiquetas) {
      Object.values(c.etiquetas).forEach(v => {
        const tag = v.trim();
        if (!tag) return;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  const allTags = Object.keys(tagCounts);

  // Cargar contactos
  useEffect(() => {
    supabase
      .from("contactos")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Error fetching contacts:", error);
        else setContacts(data || []);
      });
  }, []);

  // Cargar notas del perfil abierto
  useEffect(() => {
    if (!selectedProfile) {
      setProfileNotes([]);
      return;
    }
    supabase
      .from("conversaciones")
      .select("*")
      .eq("session_id", selectedProfile.session_id)
      .eq("message->>type", "nota")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Error fetching profile notes:", error);
        else setProfileNotes(data || []);
      });
  }, [selectedProfile]);

  // Filtrado combinado
  const filteredContacts = contacts.filter(c => {
    const mQ = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const mT =
      selectedTag === null ||
      (c.etiquetas &&
        Object.values(c.etiquetas).some(
          v => v.toLowerCase() === selectedTag.toLowerCase()
        ));
    const mF =
      filterCondition === "" ||
      c.name.toLowerCase().includes(filterCondition.toLowerCase());
    return mQ && mT && mF;
  });

  // Selección individual
  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Seleccionar / deseleccionar todo
  const toggleSelectAll = () => {
    if (selectedContacts.size < filteredContacts.length) {
      setSelectedContacts(
        new Set(filteredContacts.map(c => c.session_id))
      );
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleRowClick = (c: Contact, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === "input") return;
    setSelectedProfile(c);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      {/* Header con línea fina */}
      <header className="mb-2">
        <h1 className="text-3xl font-bold" style={{ color: "#1d1d1d" }}>
          Contactos
        </h1>
      </header>
      <hr className="border-t mb-8" style={{ borderColor: "#4d4d4d" }} />

      {/* Layout etiquetas + tabla */}
      <div className="flex gap-8">
        {/* Panel de etiquetas */}
        <div className="w-48 p-4 bg-white rounded shadow-md transition-transform duration-500 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">Etiquetas</h2>
            <span className="text-sm font-medium" style={{ color: "#1d1d1d" }}>
              Contactos
            </span>
          </div>
          <ul className="space-y-1">
            {allTags.length > 0 ? (
              allTags.map(tag => {
                const isActive = selectedTag === tag;
                return (
                  <li key={tag} className="flex justify-between">
                    <button
                      onClick={() => setSelectedTag(tag)}
                      className={`text-sm transition ${
                        isActive ? "font-bold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {tag}
                    </button>
                    <span
                      className={`text-sm transition ${
                        isActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
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
        <div className="flex-1">
          {/* Controles */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Filtro */}
              <div className="flex items-center">
                {showFilter ? (
                  <input
                    type="text"
                    placeholder="Condición"
                    value={filterCondition}
                    onChange={e => setFilterCondition(e.target.value)}
                    onBlur={() => setShowFilter(false)}
                    className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              </div>
              {/* Búsqueda */}
              <div className="flex items-center">
                {showSearch ? (
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => setShowSearch(false)}
                    className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-gray-700 text-sm">
                {selectedContacts.size} seleccionados de {filteredContacts.length}
              </div>
              <button
                disabled={selectedContacts.size === 0}
                className={`px-3 py-1 rounded transition ${
                  selectedContacts.size === 0
                    ? "bg-white text-gray-400 cursor-not-allowed border border-gray-300"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Acciones Masivas
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto bg-white p-4 rounded shadow transition-all duration-500">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-1 py-1 text-left">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        filteredContacts.length > 0 &&
                        selectedContacts.size === filteredContacts.length
                      }
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                  </th>
                  <th className="px-1 py-1 text-left">Avatar</th>
                  <th className="px-1 py-1 text-left">Nombre</th>
                  <th className="px-1 py-1 text-left">Teléfono</th>
                  <th className="px-1 py-1 text-left">Suscrito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map(contact => (
                  <tr
                    key={contact.session_id}
                    className="cursor-pointer hover:bg-blue-100 transition-transform duration-500"
                    onClick={e => handleRowClick(contact, e)}
                  >
                    <td className="px-1 py-1">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.session_id)}
                        onChange={() => toggleSelectContact(contact.session_id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <img
                        src="/avatar-placeholder.png"
                        alt={contact.name}
                        className="inline-block w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-1 py-1">{contact.name}</td>
                    <td className="px-1 py-1">{contact.session_id}</td>
                    <td className="px-1 py-1">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de perfil del contacto */}
      {selectedProfile && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition duration-500 hover:scale-105"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Perfil</h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="/avatar-placeholder.png"
                alt={selectedProfile.name}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-800">{selectedProfile.name}</h3>
              <p className="text-gray-600">{selectedProfile.session_id}</p>
              <p className="text-gray-600 mt-2">
                Suscrito: {new Date(selectedProfile.created_at).toLocaleDateString()}
              </p>
              {selectedProfile.etiquetas && (
                <div className="mt-4 w-full">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedProfile.etiquetas).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-1 rounded-full text-sm font-medium bg-[#eff7ff] text-gray-800 border border-blue-500"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profileNotes.length > 0 && (
                <div className="mt-4 w-full">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">Notas</h4>
                  <ul className="space-y-1 text-gray-700">
                    {profileNotes.map(n => (
                      <li key={n.id} className="relative text-sm">
                        {n.message.content}{" "}
                        <span className="text-xs text-gray-600">
                          ({new Date(n.created_at).toLocaleString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedProfile(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
