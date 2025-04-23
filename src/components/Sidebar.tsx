// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Zap,
  MessageCircle,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Inicio",         href: "/inicio",         Icon: Home },
  { name: "Contactos",      href: "/contactos",      Icon: Users },
  { name: "Automatización", href: "/automatizaciones",Icon: Zap },
  { name: "Chat",           href: "/chat",           Icon: MessageCircle },
  { name: "Configuración",  href: "/configuracion",  Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 h-screen bg-[#f5f6f8] p-2 flex flex-col items-center">
      {/* Logo de la app */}
      <img
        src="/asisttente.png"
        alt="Logo Asisttente"
        className="w-10 h-10 mb-6"
      />
      {/* Logo de la empresa */}
      <img
        src="/casachata.png"
        alt="Logo Casachata"
        className="w-8 h-8 mb-8"
      />

      <nav className="flex-1">
        <ul className="flex flex-col items-center space-y-6">
          {navItems.map(({ name, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href} className="relative group w-full">
                <Link
                  href={href}
                  className={`flex items-center justify-center w-full p-1 rounded transition-colors ${
                    isActive
                      ? "text-blue-500"          // solo icono azul, sin bg
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
                {/* Tooltip que aparece al hover */}
                <span
                  className="absolute left-full top-1/2 ml-2 -translate-y-1/2 
                             bg-black text-white text-xs rounded px-2 py-1 
                             opacity-0 group-hover:opacity-100 transition-opacity 
                             pointer-events-none whitespace-nowrap"
                >
                  {name}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
