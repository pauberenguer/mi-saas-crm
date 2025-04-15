"use client";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags, título, etc. */}
      </head>
      <body>
        <div className="flex h-screen">
          {/* Sidebar global completo */}
          <div className="w-64 bg-gray-100 p-4 border-r flex flex-col space-y-6">
            {/* Foto de nuestra empresa */}
            <div className="flex justify-center">
              <img
                src="/logo-empresa-nuestra.png"
                alt="Nuestra Empresa"
                className="w-20 h-20 object-contain"
              />
            </div>
            {/* Línea separadora */}
            <hr className="border-gray-300" />
            {/* Foto de la empresa del cliente */}
            <div className="flex justify-center">
              <img
                src="/logo-empresa-cliente.png"
                alt="Empresa del Cliente"
                className="w-20 h-20 object-contain"
              />
            </div>
            {/* Línea separadora */}
            <hr className="border-gray-300" />
            {/* Menú de navegación completo */}
            <nav>
              <ul className="space-y-4">
                <li>
                  <Link href="/">
                    <span className="text-blue-600 hover:underline">Inicio</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contactos">
                    <span className="text-blue-600 hover:underline">Contactos</span>
                  </Link>
                </li>
                <li>
                  <Link href="/automatizaciones">
                    <span className="text-blue-600 hover:underline">Automatizaciones</span>
                  </Link>
                </li>
                <li>
                  <Link href="/chat">
                    <span className="text-blue-600 hover:underline">Chat</span>
                  </Link>
                </li>
                <li>
                  <Link href="/configuracion">
                    <span className="text-blue-600 hover:underline">Configuración</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          {/* Área principal para el contenido */}
          <div className="flex-1 p-4 overflow-y-auto">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}