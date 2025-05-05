// File: src/app/configuracion/miembros/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";

interface Profile {
  id: string;
  name: string;
}

export default function MiembrosPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")            // ← Aquí quitamos el genérico <Profile>
        .select("id, name");
      if (error) {
        console.error("Error fetching members:", error);
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center pt-24 px-4">
        <div
          className="
            group bg-white rounded-lg shadow-2xl p-10 max-w-3xl w-full
            transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl
          "
        >
          {/* Cabecera */}
          <div className="text-center mb-8">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-gray-800">
              Miembros de Casachata
            </h1>
            <p className="mt-2 text-gray-600">
              Aquí puedes ver y gestionar quién tiene acceso al CRM.
            </p>
          </div>

          {/* Indicador de carga */}
          {loading ? (
            <div className="flex items-center justify-center space-x-2 animate-pulse">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-gray-600">Cargando miembros...</span>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="
                    flex items-center p-4 border border-gray-200 rounded-lg
                    hover:shadow-xl hover:scale-105 transition-transform duration-200
                  "
                >
                  <Users className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{member.name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Mensaje si no hay miembros */}
          {!loading && members.length === 0 && (
            <p className="mt-6 text-center text-gray-500">
              No hay miembros registrados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
