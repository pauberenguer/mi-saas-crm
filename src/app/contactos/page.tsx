// src/app/contactos/page.tsx
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
  // Estado para contactos seleccionados (checkboxes)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  // Estado para filtrar por etiqueta (null = todos)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // Estado para notas del perfil (del contacto seleccionado)
  const [profileNotes, setProfileNotes] = useState<Note[]>([]);

  // Extraemos las etiquetas de todos los contactos que tengan datos en su propiedad "etiquetas"
  const unionTags = new Set<string>();
  contacts.forEach((contact) => {
    if (contact.etiquetas) {
      Object.values(contact.etiquetas).forEach((val) => {
        if (typeof val === "string" && val.trim() !== "") {
          unionTags.add(val.trim());
        }
      });
    }
  });
  const allTags = Array.from(unionTags);

  // Cargar contactos desde Supabase
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from("contactos")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching contacts:", error);
      } else {
        setContacts(data || []);
      }
    };
    fetchContacts();
  }, []);

  // Filtrar contactos basado en búsqueda, filtro por condición y etiqueta seleccionada
  const filteredContacts = contacts.filter((contact) => {
    const matchesQuery = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag =
      selectedTag === null ||
      (contact.etiquetas &&
        Object.values(contact.etiquetas).some(
          (val) => val.toLowerCase() === selectedTag.toLowerCase()
        ));
    const matchesFilter =
      filterCondition === "" ||
      contact.name.toLowerCase().includes(filterCondition.toLowerCase());
    return matchesQuery && matchesTag && matchesFilter;
  });

  // Función para manejar selección/deselección de un contacto (checkbox)
  const toggleSelectContact = (session_id: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(session_id)) {
        newSet.delete(session_id);
      } else {
        newSet.add(session_id);
      }
      return newSet;
    });
  };

  // Evitar que al clicar en el checkbox se abra el perfil
  const handleRowClick = (
    contact: Contact,
    event: React.MouseEvent<HTMLTableRowElement>
  ) => {
    if ((event.target as HTMLElement).tagName.toLowerCase() === "input") return;
    setSelectedProfile(contact);
  };

  // Al abrir un perfil, cargar las notas (mensajes con type "nota")
  useEffect(() => {
    const fetchProfileNotes = async () => {
      if (selectedProfile) {
        const { data, error } = await supabase
          .from("conversaciones")
          .select("*")
          .eq("session_id", selectedProfile.session_id)
          .eq("message->>type", "nota")
          .order("id", { ascending: true });
        if (error) {
          console.error("Error fetching profile notes:", error);
          setProfileNotes([]);
        } else {
          setProfileNotes(data || []);
        }
      } else {
        setProfileNotes([]);
      }
    };
    fetchProfileNotes();
  }, [selectedProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 p-8 transition-all duration-500">
      {/* Encabezado */}
      <header className="mb-8 text-left">
        <h1 className="text-3xl font-bold text-gray-800 animate-fadeIn">Contactos</h1>
      </header>

      {/* Contenedor principal en fila: Panel de Etiquetas (izquierda) y área de contactos (derecha) */}
      <div className="flex gap-8">
        {/* Panel de Etiquetas */}
        <div className="w-48 p-4 bg-white rounded shadow-md transition-transform duration-500 hover:scale-105">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Etiquetas</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-sm ${
                  selectedTag === null ? "font-bold text-blue-600" : "text-gray-700"
                } transition`}
              >
                Todas
              </button>
            </li>
            {allTags.length > 0 ? (
              allTags.map((tag, index) => (
                <li key={index}>
                  <button
                    onClick={() => setSelectedTag(tag)}
                    className={`text-sm transition ${
                      selectedTag === tag ? "font-bold text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {tag}
                  </button>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No hay etiquetas</li>
            )}
          </ul>
        </div>

        {/* Área de Contactos */}
        <div className="flex-1">
          {/* Controles superiores */}
          <div className="flex items-center justify-between mb-4">
            {/* Izquierda: Filtro y Buscar */}
            <div className="flex items-center space-x-4">
              {/* Filtro: Al clicar se muestra un input con placeholder "Condición" */}
              <div className="flex items-center">
                {showFilter ? (
                  <input
                    type="text"
                    placeholder="Condición"
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value)}
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
              {/* Buscar: Al clicar se muestra un input en lugar del icono y texto */}
              <div className="flex items-center">
                {showSearch ? (
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
            {/* Derecha: Contador y Botón de Acciones Masivas */}
            <div className="flex items-center space-x-4">
              <div className="text-gray-700 text-sm">
                {selectedContacts.size} contactos seleccionados de {filteredContacts.length}
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

          {/* Tabla de contactos */}
          <div className="overflow-x-auto bg-white p-4 rounded shadow transition-all duration-500">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-4 py-2 text-left">Seleccionar</th>
                  <th className="px-4 py-2 text-left">Avatar</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">Suscrito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.session_id}
                    className="cursor-pointer hover:bg-blue-100 transition-transform duration-500"
                    onClick={(e) => handleRowClick(contact, e)}
                  >
                    {/* Columna del checkbox */}
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.session_id)}
                        onChange={() => toggleSelectContact(contact.session_id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <img
                        src="/avatar-placeholder.png"
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">{contact.name}</td>
                    <td className="px-4 py-2">{contact.session_id}</td>
                    <td className="px-4 py-2">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para mostrar el Perfil del contacto */}
      {selectedProfile && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full transform transition duration-500 hover:scale-105"
            onClick={(e) => e.stopPropagation()}
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
              {/* Mostrar Etiquetas del contacto (si existen) */}
              {selectedProfile.etiquetas && (
                <div className="mt-4 w-full">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedProfile.etiquetas).map(([key, value]) =>
                      value.toString().trim() !== "" ? (
                        <div key={key} className="relative inline-block">
                          <span className="px-2 py-1 rounded-full text-sm font-medium bg-[#eff7ff] text-gray-800 border border-blue-500">
                            {value}
                          </span>
                          <button
                            onClick={() => deleteTag(key)}
                            className="absolute -top-1 -right-1 text-black text-xs hover:text-gray-700"
                          >
                            X
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              {/* Mostrar Notas del contacto (si hay) */}
              {profileNotes.length > 0 && (
                <div className="mt-4 w-full">
                  <h4 className="text-base font-semibold text-gray-800 mb-1">Notas</h4>
                  <ul className="space-y-1">
                    {profileNotes.map((note) => (
                      <li key={note.id} className="relative text-sm text-gray-700">
                        {note.message.content}{" "}
                        <span className="text-xs text-gray-600">
                          ({new Date(note.created_at).toLocaleString()})
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="absolute top-0 right-0 text-black text-xs hover:text-gray-700"
                        >
                          X
                        </button>
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