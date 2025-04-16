// src/app/inicio/page.tsx
"use client";

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

      <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 p-8">
        {/* Encabezado con animación y texto descriptivo */}
        <header className="mb-8 text-center animate-fadeIn">
          <h1 className="text-5xl font-bold text-gray-800">
            Bienvenido a Casachata CRM
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Administra tus conversaciones y contactos con eficiencia y profesionalismo.
          </p>
        </header>

        {/* Tarjetas de Navegación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fadeIn">
          {/* Tarjeta Chat */}
          <div className="bg-white shadow rounded-lg p-6 transform transition duration-500 hover:scale-105">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chat</h2>
            <p className="text-gray-600 mb-6">
              Accede a las conversaciones en tiempo real con tus clientes.
            </p>
            <a
              href="/chat"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Ir a Chat
            </a>
          </div>

          {/* Tarjeta Contactos */}
          <div className="bg-white shadow rounded-lg p-6 transform transition duration-500 hover:scale-105">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contactos</h2>
            <p className="text-gray-600 mb-6">
              Gestiona y visualiza la información de tus clientes.
            </p>
            <a
              href="/contactos"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Ver Contactos
            </a>
          </div>

          {/* Tarjeta Automatizaciones */}
          <div className="bg-white shadow rounded-lg p-6 transform transition duration-500 hover:scale-105">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Automatizaciones</h2>
            <p className="text-gray-600 mb-6">
              Administra las secuencias y flujos automatizados del sistema.
            </p>
            <a
              href="/automatizaciones"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Ver Automatizaciones
            </a>
          </div>
        </div>
      </div>
    </>
  );
}