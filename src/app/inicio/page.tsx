// File: src/app/inicio/page.tsx
"use client";
import React from "react";

export default function HomeDashboard() {
  return (
    <>
      {/* Definición de la animación fadeIn */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-[#f9fafb] p-8">
        {/* Pequeño header en la esquina superior izquierda */}
        <header className="animate-fadeIn mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "#1d1d1d" }}>
            Inicio
          </h1>
        </header>

        {/* Línea horizontal fina de color #4d4d4d */}
        <hr className="border-t" style={{ borderColor: "#4d4d4d" }} />

        {/* Mensaje de bienvenida centrado */}
        <div className="text-center animate-fadeIn mt-8 mb-12">
          <h1 className="text-5xl font-bold text-gray-800">
            Bienvenido a Casachata CRM
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Administra tus conversaciones y contactos con eficiencia y profesionalismo.
          </p>
        </div>

        {/* Tarjetas de navegación empujadas hacia abajo */}
        <div className="flex items-center justify-center pt-4 px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl w-full animate-fadeIn">
            {/* 1. Contactos */}
            <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Contactos
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Gestiona y visualiza la información de tus clientes.
              </p>
              <a
                href="/contactos"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
              >
                Ver Contactos
              </a>
            </div>

            {/* 2. Chat */}
            <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Chat
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Accede a las conversaciones en tiempo real con tus clientes.
              </p>
              <a
                href="/chat"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
              >
                Ir a Chat
              </a>
            </div>

            {/* 3. Automatizaciones */}
            <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Automatización
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Administra las secuencias y flujos automatizados del sistema.
              </p>
              <a
                href="/automatizaciones"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
              >
                Ver Automatización
              </a>
            </div>

            {/* 4. Configuración */}
            <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Configuración
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Ajusta las preferencias y parámetros de tu cuenta.
              </p>
              <a
                href="/configuracion"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
              >
                Ir a Configuración
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
