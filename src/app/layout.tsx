// File: src/app/layout.tsx
"use client";

import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Oculta sidebar en "/" y en "/acceso"
  const hideSidebar = pathname === "/" || pathname === "/acceso";

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="flex h-screen overflow-hidden">
        {!hideSidebar && <Sidebar />}
        <main className={`${hideSidebar ? "w-full" : "flex-1"} overflow-auto`}>
          {children}
        </main>
      </body>
    </html>
  );
}
