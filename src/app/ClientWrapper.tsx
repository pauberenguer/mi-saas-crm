// File: src/app/ClientWrapper.tsx
"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { supabase } from "../utils/supabaseClient";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/" || pathname === "/acceso";

  const audioRef = useRef<HTMLAudioElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) =>
      setTheme(e.matches ? "dark" : "light");

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

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
            const notificacionesActivas = localStorage.getItem("notificacionesActivas");
            if (notificacionesActivas === "true") {
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
    <>
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
    </>
  );
}
