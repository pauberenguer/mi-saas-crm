// src/app/automatizaciones/page.tsx
"use client";

import { Zap, Loader2 } from "lucide-react";

export default function AutomatizacionesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-200 p-8 transition-all duration-500">
      {/* Encabezado con el nombre de la Página */}
      <header className="mb-8 text-left">
        <h1 className="text-4xl font-bold text-blue-800 animate-fadeIn">Automatizaciones</h1>
      </header>
      <div className="flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-10 max-w-2xl w-full text-center transform transition duration-500 hover:scale-105">
          {/* Icono en azul */}
          <Zap className="mx-auto mb-4 animate-bounce" size={48} color="#2f80ed" />
          <h2 className="text-3xl font-bold text-blue-800 mb-4">
            Entrena a Eva
          </h2>
          <p className="text-lg text-blue-600 mb-6">
            En esta sección podrás entrenar a Eva, la inteligencia artificial de nuestro CRM. Ajusta y configura flujos automatizados para mejorar la interacción con los clientes y optimizar la comunicación.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="animate-spin" size={24} color="#2f80ed" />
            <span className="text-blue-500">Cargando...</span>
          </div>
        </div>
      </div>
    </div>
  );
}