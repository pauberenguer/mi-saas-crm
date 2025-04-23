// File: src/app/configuracion/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfiguracionIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/configuracion/perfil");
  }, [router]);
  return null;
}
