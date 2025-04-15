"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Home, User, Zap, MessageSquare, Settings } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const defaultColor = "#818b9c";
  const activeColor = "#2acf7e";

  return (
    <html lang="es">
      <head>
        {/* Meta tags, título, etc. */}
      </head>
      <body>
        <div className="flex h-screen">
          {/* Sidebar global sin el borde separador y sin separador entre sidebar y contenido */}
          <div className="w-16 bg-[#eaecf0] p-4 flex flex-col space-y-6">
            {/* Logo de nuestra empresa que redirige a /inicio */}
            <div className="flex justify-center">
              <Link href="/inicio">
                <img
                  src="/logo-empresa-nuestra.png"
                  alt="Nuestra Empresa"
                  className="w-12 h-12 object-contain"
                />
              </Link>
            </div>
            {/* Imagen de la empresa del cliente */}
            <div className="flex justify-center">
              <img
                src="/logo-empresa-cliente.png"
                alt="Empresa del Cliente"
                className="w-12 h-12 object-contain"
              />
            </div>
            {/* Menú de navegación */}
            <nav>
              <ul className="space-y-4 flex flex-col items-center">
                <li>
                  <Link href="/inicio">
                    <Home size={22} color={pathname === "/inicio" ? activeColor : defaultColor} />
                  </Link>
                </li>
                <li>
                  <Link href="/contactos">
                    <User size={22} color={pathname.startsWith("/contactos") ? activeColor : defaultColor} />
                  </Link>
                </li>
                <li>
                  <Link href="/automatizaciones">
                    <Zap size={22} color={pathname.startsWith("/automatizaciones") ? activeColor : defaultColor} />
                  </Link>
                </li>
                <li>
                  <Link href="/chat">
                    <MessageSquare size={22} color={pathname.startsWith("/chat") ? activeColor : defaultColor} />
                  </Link>
                </li>
                <li>
                  <Link href="/configuracion">
                    <Settings size={22} color={pathname.startsWith("/configuracion") ? activeColor : defaultColor} />
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          {/* Área principal para el contenido sin padding extra */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}