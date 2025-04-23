// File: src/app/configuracion/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const baseLink = "block rounded px-2 py-1 transition-colors";

  return (
    <div className="flex min-h-screen bg-gray-50 p-8">
      {/* Sidebar exclusivo de Configuración */}
      <aside className="w-60 pr-6 border-r border-gray-200">
        <nav className="space-y-4">
          {/* Título: General */}
          <span className="block px-2 py-1 text-base font-medium text-gray-800">
            General
          </span>

          {/* Enlace: Perfil (1.2× tamaño) */}
          <Link
            href="/configuracion/perfil"
            className={
              `${baseLink} text-sm ` +
              (pathname === "/configuracion/perfil"
                ? "font-semibold text-blue-600"
                : "text-gray-700 hover:text-blue-500")
            }
          >
            Perfil
          </Link>

          {/* Enlace: Miembros del Equipo (1.2× tamaño) */}
          <Link
            href="/configuracion/miembros"
            className={
              `${baseLink} text-sm ` +
              (pathname === "/configuracion/miembros"
                ? "font-semibold text-blue-600"
                : "text-gray-700 hover:text-blue-500")
            }
          >
            Miembros del Equipo
          </Link>

          {/* Título: Automatización */}
          <span className="block px-2 py-1 text-base font-medium text-gray-800">
            Automatización
          </span>

          {/* Enlace: Etiquetas (1.2× tamaño) */}
          <Link
            href="/configuracion/etiquetas"
            className={
              `${baseLink} text-sm ` +
              (pathname === "/configuracion/etiquetas"
                ? "font-semibold text-blue-600"
                : "text-gray-700 hover:text-blue-500")
            }
          >
            Etiquetas
          </Link>
        </nav>
      </aside>

      {/* Contenido de cada sub‑página */}
      <main className="flex-1 pl-6">{children}</main>
    </div>
  );
}
