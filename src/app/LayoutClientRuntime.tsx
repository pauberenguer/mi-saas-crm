"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { supabase } from "../utils/supabaseClient";

// Tipo del contexto
interface NotificationContextType {
  enabled: boolean;
  toggle: () => void;
}

// Creamos el contexto con valores por defecto
const NotificationContext = createContext<NotificationContextType>({
  enabled: true,
  toggle: () => {},
});

// Hook para consumirlo
export function useNotification() {
  return useContext(NotificationContext);
}

// Provider + lógica global
export default function LayoutClientRuntime({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/" || pathname === "/acceso";

  // Ref para el audio
  const audioRef = useRef<HTMLAudioElement>(null);

  // Estado tema
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Estado y ref para notificaciones
  const [enabled, setEnabled] = useState<boolean>(true);
  const enabledRef = useRef<boolean>(true);

  // Detectar tema oscuro
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    const onChange = (e: MediaQueryListEvent) =>
      setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Al montar, leemos localStorage
  useEffect(() => {
    const v = localStorage.getItem("notificacionesActivas");
    const activo = v === null ? true : v === "true";
    setEnabled(activo);
    enabledRef.current = activo;
  }, []);

  // Sincronizamos la ref cada vez que cambie enabled
  useEffect(() => {
    enabledRef.current = enabled;
    localStorage.setItem("notificacionesActivas", String(enabled));
  }, [enabled]);

  // Suscripción Supabase en cada pestaña
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

          if (
            m.type === "human" &&
            origin !== "crm" &&
            origin !== "note" &&
            enabledRef.current
          ) {
            audioRef.current?.play().catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Función para alternar estado
  const toggle = () => setEnabled((prev) => !prev);

  return (
    <NotificationContext.Provider value={{ enabled, toggle }}>
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
    </NotificationContext.Provider>
  );
}
