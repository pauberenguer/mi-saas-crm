"use client";
import Link from "next/link";

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex">
        {/* Sidebar exclusivo de Configuración sin borde */}
        <aside className="w-64 pr-4">
          <ul className="space-y-4">
            <li>
              <Link
                href="/configuracion/general"
                className="text-lg font-bold text-gray-800 hover:text-green-500"
              >
                General
              </Link>
            </li>
            <li>
              <Link
                href="/configuracion/miembros"
                className="text-lg text-gray-700 hover:text-green-500"
              >
                Miembros del Equipo
              </Link>
            </li>
            <li>
              <Link
                href="/configuracion/automatizacion"
                className="text-lg font-bold text-gray-800 hover:text-green-500"
              >
                Automatización
              </Link>
            </li>
            <li>
              <Link
                href="/configuracion/etiquetas"
                className="text-lg text-gray-700 hover:text-green-500"
              >
                Etiquetas
              </Link>
            </li>
          </ul>
        </aside>

        {/* Contenido Principal de Configuración */}
        <main className="flex-1 pl-4">
          <section id="general" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">General</h2>
            <p className="text-sm text-gray-700">
              Configuraciones generales del sistema, como idioma y zona horaria.
            </p>
          </section>

          <section id="automatizacion" className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Automatización</h2>
            <p className="text-sm text-gray-700">
              Configura y gestiona los flujos automatizados del sistema.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}