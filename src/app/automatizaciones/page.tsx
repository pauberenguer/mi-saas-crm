// File: src/app/automatizaciones/page.tsx
"use client";

import { Zap, Loader2 } from "lucide-react";

export default function AutomatizacionesPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] p-8 transition-all duration-500">
      {/* Encabezado con el nombre de la Página */}
      <header className="mb-8 text-left">
        <h1 className="text-4xl font-bold" style={{ color: "#1d1d1d" }}>
          Automatizaciones
        </h1>
      </header>

      {/* Contenedor con padding superior para alinear con otras secciones */}
      <div className="flex items-center justify-center pt-24 px-8">
        <div
          className="group bg-white rounded-lg shadow-xl p-10 max-w-2xl w-full text-center
                     transform transition duration-500 hover:-translate-y-1 hover:shadow-2xl"
        >
          {/* Icono en azul */}
          <Zap className="mx-auto mb-4 animate-bounce" size={48} color="#2f80ed" />

          <h2 className="text-3xl font-bold mb-4" style={{ color: "#1d1d1d" }}>
            Entrena a Eva
          </h2>

          <p className="text-lg mb-6" style={{ color: "#4d4d4d" }}>
            En esta sección podrás entrenar a Eva, la inteligencia artificial de nuestro CRM. Ajusta y configura flujos automatizados para mejorar la interacción con los clientes y optimizar la comunicación.
          </p>

          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="animate-spin" size={24} color="#2f80ed" />
            <span className="text-[#4d4d4d]">Cargando...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
