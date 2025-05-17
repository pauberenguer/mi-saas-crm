// File: src/app/configuracion/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const baseLink = "block rounded px-2 py-1 transition-colors text-sm";

  // Ocultamos el sidebar si estamos en la ruta de crear plantilla
  const hideSidebar = pathname === "/configuracion/whatsapp/crear_plantilla";

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

      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header de Configuración */}
        <header className="animate-fadeIn mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "#1d1d1d" }}>
            Configuración
          </h1>
        </header>
        <hr className="border-t mb-4" style={{ borderColor: "#4d4d4d" }} />

        <div className="flex">
          {!hideSidebar && (
            <aside className="w-60 pr-6 border-r border-gray-200">
              <nav className="space-y-4">
                {/* Título: General */}
                <span className="block px-2 py-1 text-base font-medium text-gray-900">
                  General
                </span>

                <Link
                  href="/configuracion/perfil"
                  className={
                    pathname === "/configuracion/perfil"
                      ? `${baseLink} bg-gray-200 text-gray-900`
                      : `${baseLink} text-gray-700 hover:bg-gray-100`
                  }
                >
                  Perfil
                </Link>

                <Link
                  href="/configuracion/miembros"
                  className={
                    pathname === "/configuracion/miembros"
                      ? `${baseLink} bg-gray-200 text-gray-900`
                      : `${baseLink} text-gray-700 hover:bg-gray-100`
                  }
                >
                  Miembros del Equipo
                </Link>

                {/* Título: Automatización */}
                <span className="block px-2 py-1 text-base font-medium text-gray-900">
                  Automatización
                </span>

                <Link
                  href="/configuracion/whatsapp"
                  className={
                    pathname.startsWith("/configuracion/whatsapp")
                      ? `${baseLink} bg-gray-200 text-gray-900`
                      : `${baseLink} text-gray-700 hover:bg-gray-100`
                  }
                >
                  Whatsapp
                </Link>

                {/* Título: Sonido */}
                <span className="block px-2 py-1 text-base font-medium text-gray-900">
                  Sonido
                </span>

                <Link
                  href="/configuracion/notificaciones"
                  className={
                    pathname.startsWith("/configuracion/notificaciones")
                      ? `${baseLink} bg-gray-200 text-gray-900`
                      : `${baseLink} text-gray-700 hover:bg-gray-100`
                  }
                >
                  Notificaciones
                </Link>
              </nav>
            </aside>
          )}

          <main className={hideSidebar ? "w-full pl-0" : "flex-1 pl-6"}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
