// File: src/app/LayoutClientRuntime.tsx
"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { supabase } from "../utils/supabaseClient";

export default function LayoutClientRuntime({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/" || pathname === "/acceso";

  const audioRef = useRef<HTMLAudioElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Detectar tema sistema
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) =>
      setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Suscripción a Supabase en cada pestaña, leyendo localStorage en cada evento
  useEffect(() => {
    const channel = supabase
      .channel("global-new-human-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        ({ new: row }) => {
          const mRaw = (row as any).message;
          const m = typeof mRaw === "string" ? JSON.parse(mRaw) : mRaw;
          const origin = m.additional_kwargs?.origin;

          if (m.type === "human" && origin !== "crm" && origin !== "note") {
            // Leer siempre la preferencia más reciente:
            let activo = true;
            try {
              const v = localStorage.getItem("notificacionesActivas");
              activo = v === null ? true : v === "true";
            } catch {
              activo = true;
            }

            if (activo) {
              audioRef.current?.play().catch(console.error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className={theme}>
      <audio
        ref={audioRef}
        src="/notification.mp3"
        preload="auto"
        className="hidden"
      />
      <div className="flex h-screen overflow-hidden">
        {!hideSidebar && <Sidebar />}
        <main className={`${hideSidebar ? "w-full" : "flex-1"} overflow-auto`}>
          {children}
        </main>
      </div>
    </div>
  );
}
