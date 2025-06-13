// File: src/components/Sidebar.tsx
"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  MessageCircle,
  Zap,
  Settings,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";

// Tipos para los objetos de Supabase
interface ConversationInsert {
  session_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface ContactUpdate {
  session_id: string;
  last_viewed_at: string;
  [key: string]: unknown;
}

const navItems = [
  { name: "Inicio",         href: "/inicio",          Icon: Home },
  { name: "Contactos",      href: "/contactos",       Icon: Users },
  { name: "Chat",           href: "/chat",            Icon: MessageCircle },
  { name: "Automatización", href: "/automatizaciones",Icon: Zap },
  { name: "Configuración",  href: "/configuracion",   Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastViewedAt, setLastViewedAt] = useState<Record<string, string>>({});
  const [lastMessageAt, setLastMessageAt] = useState<Record<string, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // 1) Cargo avatar
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
  }, []);

  // 2) Cargo last_viewed_at de cada contacto
  useEffect(() => {
    supabase
      .from("contactos")
      .select("session_id, last_viewed_at")
      .then(({ data }) => {
        if (!data) return;
        const lv: Record<string, string> = {};
        data.forEach(c => {
          lv[c.session_id] = c.last_viewed_at;
        });
        setLastViewedAt(lv);
      });
  }, []);

  // 3) Cargo último mensaje por sesión
  useEffect(() => {
    const sids = Object.keys(lastViewedAt);
    if (sids.length === 0) return;
    (async () => {
      const lm: Record<string, string> = {};
      await Promise.all(
        sids.map(async sid => {
          const { data: msgs } = await supabase
            .from("conversaciones")
            .select("created_at")
            .eq("session_id", sid)
            .order("created_at", { ascending: false })
            .limit(1);
          if (msgs?.[0]) lm[sid] = msgs[0].created_at;
        })
      );
      setLastMessageAt(lm);
    })();
  }, [lastViewedAt]);

  // 4) Calculo cuántas sesiones tienen mensajes no leídos
  useEffect(() => {
    let count = 0;
    for (const sid in lastMessageAt) {
      const lm = new Date(lastMessageAt[sid]).getTime();
      const lv = new Date(lastViewedAt[sid] || 0).getTime();
      if (lm > lv) count++;
    }
    setUnreadCount(count);
  }, [lastMessageAt, lastViewedAt]);

  // 5) Realtime: INSERT en conversaciones
  useEffect(() => {
    const ch = supabase
      .channel("sidebar-convos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversaciones" },
        ({ new: row }) => {
          const typedRow = row as ConversationInsert;
          const sid = typedRow.session_id;
          const ts = typedRow.created_at;
          setLastMessageAt(lm => ({ ...lm, [sid]: ts }));
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, []);

  // 6) Realtime: UPDATE en contactos (para last_viewed_at)
  useEffect(() => {
    const ch2 = supabase
      .channel("sidebar-contactos")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contactos" },
        ({ new: row }) => {
          const typedRow = row as ContactUpdate;
          const sid = typedRow.session_id;
          const lv = typedRow.last_viewed_at;
          setLastViewedAt(prev => ({ ...prev, [sid]: lv }));
        }
      )
      .subscribe();
    return () => void supabase.removeChannel(ch2);
  }, []);

  return (
    <aside className="w-16 h-screen bg-[#f5f6f8] p-2 flex flex-col items-center">
      <img
        src="/asisttente.png"
        alt="Logo Asisttente"
        className="w-10 h-10 mb-6"
      />

      <Link href="/configuracion/perfil">
        <img
          src={avatarUrl ?? "/casachata.png"}
          alt="Avatar usuario"
          className="w-8 h-8 mb-8 rounded-full object-cover cursor-pointer hover:brightness-90 transition"
        />
      </Link>

      <nav className="flex-1">
        <ul className="flex flex-col items-center space-y-6 overflow-visible">
          {navItems.map(({ name, href, Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href} className="relative group w-full">
                <Link
                  href={href}
                  className={`flex items-center justify-center w-full p-1 rounded transition-colors ${
                    isActive
                      ? "bg-gray-300 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {href === "/chat" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </Link>
                <span
                  className="absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50
                             bg-black text-white text-xs rounded px-2 py-1
                             opacity-0 group-hover:opacity-100 whitespace-nowrap"
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
