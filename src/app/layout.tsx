// File: src/app/layout.tsx
"use client";

import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="flex h-screen overflow-hidden">
        {/* Aquí solo renderizamos UNA vez la Sidebar */}
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
