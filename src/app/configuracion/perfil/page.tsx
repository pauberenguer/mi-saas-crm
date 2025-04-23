// File: src/app/configuracion/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        loadProfile(user);
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function loadProfile(user: any) {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();
    if (data) {
      setProfile({ name: data.name, avatar_url: data.avatar_url });
    } else {
      const fallback = (user.user_metadata as any)?.name || "Usuario";
      setProfile({ name: fallback, avatar_url: null });
      console.warn("Perfil no encontrado:", error?.message);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      console.error("Error subiendo avatar:", upErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setProfile(p => (p ? { ...p, avatar_url: urlData.publicUrl } : p));
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Empuja la tarjeta exactamente igual que en Etiquetas */}
      <div className="flex items-center justify-center pt-24 px-8">
        <div
          className="group bg-white rounded-lg shadow-lg p-10 max-w-md w-full text-center
                     transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
        >
          {/* Icono estático arriba */}
          <User className="mx-auto mb-4 w-12 h-12 text-blue-500" />

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mi Perfil</h1>

          {/* Línea separadora */}
          <hr className="border-t border-gray-100 mb-6" />

          {/* Nombre del miembro encima de la foto */}
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{profile?.name}</h2>

          {/* Avatar */}
          <div className="mx-auto mb-6 w-32 h-32 relative rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>

          {/* Fecha de alta */}
          <p className="text-sm text-gray-500 mb-6">
            {user.created_at
              ? `Miembro desde ${new Date(user.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
          </p>

          {/* Botón cambiar foto */}
          <label className="inline-block mb-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <span
              className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded cursor-pointer transition
                          ${uploading ? "opacity-70 pointer-events-none" : ""}`}
            >
              {uploading ? "Subiendo..." : "Cambiar Foto"}
            </span>
          </label>

          {/* Indicador de carga */}
          {uploading && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <Loader2 className="text-blue-500 w-6 h-6 animate-spin" />
              <span className="text-gray-600">Actualizando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
