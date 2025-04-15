"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Filter, Search } from "lucide-react";

interface Contact {
  session_id: string; // Teléfono
  name: string;
  created_at: string;
}

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Contactos</h1>
      {/* Encabezado con Filtro y Buscar en una sola línea */}
      <div className="flex items-center space-x-6 mb-4">
        <div className="flex items-center space-x-2">
          <Filter size={20} color="#818b9c" />
          <span className="text-gray-700">Filtro</span>
        </div>
        <div className="flex items-center space-x-2">
          <Search size={20} color="#818b9c" />
          <span className="text-gray-700">Buscar</span>
        </div>
      </div>
      {/* Contenedor de la tabla */}
      <div className="overflow-x-auto bg-white p-4 rounded shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Avatar</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Teléfono</th>
              <th className="px-4 py-2 text-left">Suscrito</th>
            </tr>
          </thead>
          {/* Usamos divide-y con un gris muy claro para separar las filas */}
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.session_id}>
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
  );
}