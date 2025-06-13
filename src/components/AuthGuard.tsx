// File: src/components/AuthGuard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../utils/supabaseClient";
import { Home, User, Zap, MessageSquare, Settings } from "lucide-react";
import Image from "next/image";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<boolean | null>(null);
  const defaultColor = "#818b9c";
  const activeColor = "#0084ff";

  // Comprobar sesión al montar y suscribir cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      if (session && pathname === "/") {
        router.replace("/inicio");
      }
      if (!session && pathname !== "/") {
        router.replace("/");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(!!s);
      if (!s) router.replace("/");
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Mientras se determina la sesión…
  if (session === null) return null;

  return (
    <div className="flex h-screen">
      {session && (
        <div className="w-16 bg-[#eaecf0] p-4 flex flex-col space-y-6">
          <div className="flex justify-center">
            <Link href="/inicio">
              <Image
                src="/logo-empresa-nuestra.png"
                alt="Nuestra Empresa"
                width={48}
                height={48}
                className="object-contain"
              />
            </Link>
          </div>
          <div className="flex justify-center">
            <Image
              src="/logo-empresa-cliente.png"
              alt="Empresa del Cliente"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <nav>
            <ul className="space-y-4 flex flex-col items-center">
              <li>
                <Link href="/inicio">
                  <Home
                    size={22}
                    color={pathname === "/inicio" ? activeColor : defaultColor}
                  />
                </Link>
              </li>
              <li>
                <Link href="/contactos">
                  <User
                    size={22}
                    color={
                      pathname.startsWith("/contactos")
                        ? activeColor
                        : defaultColor
                    }
                  />
                </Link>
              </li>
              <li>
                <Link href="/automatizaciones">
                  <Zap
                    size={22}
                    color={
                      pathname.startsWith("/automatizaciones")
                        ? activeColor
                        : defaultColor
                    }
                  />
                </Link>
              </li>
              <li>
                <Link href="/chat">
                  <MessageSquare
                    size={22}
                    color={
                      pathname.startsWith("/chat") ? activeColor : defaultColor
                    }
                  />
                </Link>
              </li>
              <li>
                <Link href="/configuracion">
                  <Settings
                    size={22}
                    color={
                      pathname.startsWith("/configuracion")
                        ? activeColor
                        : defaultColor
                    }
                  />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}