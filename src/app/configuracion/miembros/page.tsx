"use client";

import { Users } from "lucide-react";

export default function MiembrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 p-8">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-10 max-w-2xl w-full text-center">
          <Users className="mx-auto mb-4" size={48} color="#2acf7e" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Miembros del Equipo</h1>
          <p className="text-base text-gray-600 mb-6">
            Esta sección está en construcción. Próximamente podrás gestionar los miembros del equipo y sus permisos.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition">
            Agregar Miembro
          </button>
        </div>
      </div>
    </div>
  );
}