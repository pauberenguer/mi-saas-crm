"use client";

export default function HomeDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Encabezado */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800">Bienvenido a Casachata</h1>
        <p className="text-xl text-gray-600 mt-4">
          Sistema Interno de Gestión de Conversaciones y Contactos.
        </p>
      </div>

      {/* Tarjetas de Navegación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Tarjeta Chat */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Chat</h2>
          <p className="text-gray-600 mb-6">
            Accede a las conversaciones en tiempo real con tus clientes.
          </p>
          <a
            href="/chat"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
          >
            Ir a Chat
          </a>
        </div>

        {/* Tarjeta Contactos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contactos</h2>
          <p className="text-gray-600 mb-6">
            Gestiona y visualiza la información de tus clientes.
          </p>
          <a
            href="/contactos"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
          >
            Ver Contactos
          </a>
        </div>

        {/* Tarjeta Automatizaciones */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Automatizaciones</h2>
          <p className="text-gray-600 mb-6">
            Administra las secuencias y flujos automatizados del sistema.
          </p>
          <a
            href="/automatizaciones"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition"
          >
            Ver Automatizaciones
          </a>
        </div>
      </div>
    </div>
  );
}