"use client";

import { Zap, Loader2 } from "lucide-react";

export default function AutomatizacionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 p-8">
      {/* Encabezado con el nombre de la Página */}
      <header className="mb-8 text-left">
        <h1 className="text-4xl font-bold text-gray-800">Automatizaciones</h1>
      </header>
      <div className="flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-10 max-w-2xl w-full text-center">
          <Zap className="mx-auto mb-4" size={48} color="#2acf7e" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Automatizaciones
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Por el momento, esta sección está en construcción. Próximamente
            podrás crear y gestionar flujos automatizados y etiquetar contactos.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="animate-spin" size={24} color="#2acf7e" />
            <span className="text-gray-500">Cargando...</span>
          </div>
        </div>
      </div>
    </div>
  );
}