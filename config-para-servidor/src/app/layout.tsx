"use client";

import "./globals.css";
import { ReactNode, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import { usePathname } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import React from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Oculta sidebar en "/" y en "/acceso"
  const hideSidebar = pathname === "/" || pathname === "/acceso";

  // Ref para reproducir sonido
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Estado para controlar el tema de la interfaz
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // Detectar preferencia de tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Escuchar cambios en la preferencia de tema
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Suscripción global a nuevos mensajes de cliente
    const channel = supabase
      .channel("global-new-human-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        ({ new: row }) => {
          const mRaw = (row as any).message;
          const m = typeof mRaw === "string" ? JSON.parse(mRaw) : mRaw;
          const origin = m.additional_kwargs?.origin;
          // Solo reproducir si es mensaje humano de cliente
          if (m.type === "human" && origin !== "crm" && origin !== "note") {
            audioRef.current?.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <html lang="es" className={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Audio oculto disponible en todas las páginas */}
        <audio
          ref={audioRef}
          src="/notification.mp3"
          preload="auto"
          className="hidden"
        />

        {!hideSidebar && <Sidebar />}
        <main className={`${hideSidebar ? "w-full" : "flex-1"} overflow-auto`}>
          {children}
        </main>
      </body>
    </html>
  );
}
