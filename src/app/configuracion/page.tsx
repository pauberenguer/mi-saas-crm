// src/app/configuracion/page.tsx
"use client";

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 flex items-center justify-center p-6">
      {/* “Tarjeta” central */}
      <div className="bg-white rounded-xl shadow-2xl p-10 max-w-3xl w-full">
        {/* Cabecera */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Centro de Configuración
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Ajusta la plataforma a las necesidades de tu equipo.
          </p>
        </header>

        {/* Bloques de contenido */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">General</h2>
          <p className="text-gray-700 leading-relaxed">
            Define opciones fundamentales como el idioma por defecto, la zona
            horaria, la moneda y la información de la empresa que aparecerá en
            los reportes. Estos ajustes se aplican a todo el sistema.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Automatización
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Crea y gestiona flujos automáticos para agilizar la interacción con
            los clientes y reducir tareas repetitivas. Desde aquí podrás
            encadenar eventos, configurar disparadores y supervisar el
            rendimiento de cada flujo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Seguridad</h2>
          <p className="text-gray-700 leading-relaxed">
            Controla los permisos, añade autenticación de dos factores y revisa
            los registros de acceso para mantener tu información a salvo.
          </p>
        </section>
      </div>
    </div>
  );
}