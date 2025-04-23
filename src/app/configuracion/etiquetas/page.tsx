// File: src/app/configuracion/etiquetas/page.tsx
"use client";

import { Tag, Loader2 } from "lucide-react";

export default function EtiquetasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Flex container con padding-top para empujar la tarjeta */}
      <div className="flex items-center justify-center pt-24 px-8">
        <div
          className="group bg-white rounded-lg shadow-lg p-10 max-w-2xl w-full text-center
                     transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
        >
          {/* Icono Tag animado */}
          <Tag
            className="mx-auto mb-4 text-blue-500 w-12 h-12 animate-bounce"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Etiquetas de Contacto
          </h1>
          <p className="text-base text-gray-700 mb-6">
            Esta sección está en construcción. Próximamente podrás gestionar las etiquetas para clasificar tus flujos y contactos.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition">
            + Añadir Etiqueta
          </button>
          {/* Círculo de carga + texto */}
          <div className="mt-6 flex items-center justify-center space-x-2">
            <Loader2 className="text-blue-500 w-6 h-6 animate-spin" />
            <span className="text-gray-600">Cargando...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
