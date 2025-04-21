// src/app/configuracion/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // devuelve estilos activos/inactivos sin verde
  const linkCls = (href: string) =>
    `block rounded px-2 py-1 text-lg transition ${
      pathname === href
        ? "font-semibold text-blue-600"      // activo ↔ azul
        : "text-gray-700 hover:text-blue-500" // hover ↔ azul claro
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50 p-8">
      {/* --- sidebar exclusivo de Configuración --- */}
      <aside className="w-60 pr-6 border-r border-gray-200">
        <nav className="space-y-2">
          <Link href="/configuracion/general"        className={linkCls("/configuracion/general")}>
            General
          </Link>
          <Link href="/configuracion/miembros"       className={linkCls("/configuracion/miembros")}>
            Miembros del Equipo
          </Link>
          <Link href="/configuracion/automatizacion" className={linkCls("/configuracion/automatizacion")}>
            Automatización
          </Link>
          <Link href="/configuracion/etiquetas"      className={linkCls("/configuracion/etiquetas")}>
            Etiquetas
          </Link>
        </nav>
      </aside>

      {/* ---------- contenido de cada sub‑página ---------- */}
      <main className="flex-1 pl-6">{children}</main>
    </div>
  );
}