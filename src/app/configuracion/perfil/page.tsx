// File: src/app/configuracion/perfil/page.tsx
"use client";

import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

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

    if (error) {
      console.warn("Perfil no encontrado:", error.message);
      const fallback = (user.user_metadata as any)?.name || "Usuario";
      setProfile({ name: fallback, avatar_url: null });
      setPreviewUrl("");
    } else {
      setProfile({ name: data.name, avatar_url: data.avatar_url });
      setPreviewUrl(data.avatar_url ?? "");
    }

    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".jpg")) {
        alert("Solo se permiten archivos con extensión .jpg");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function applyChanges() {
    if (!selectedFile || !user) return;
    setUploading(true);

    const file = selectedFile;
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    // 1) Subir al storage
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      console.error("Error subiendo avatar:", upErr.message);
      alert("No se pudo subir la imagen: " + upErr.message);
      setUploading(false);
      return;
    }

    // 2) Obtener URL pública
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // 3) Actualizar tabla profiles y devolver la fila
    const { data: updated, error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)
      .select()
      .single();

    if (dbError) {
      console.error("❌ Error actualizando perfil en la BBDD:", dbError.message);
      alert("No se pudo guardar la foto en el perfil: " + dbError.message);
    } else {
      console.log("✅ Perfil actualizado:", updated);
      await loadProfile(user);
      setSelectedFile(null);
    }

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
      <div className="flex items-center justify-center pt-24 px-8">
        <div
          className="group bg-white rounded-lg shadow-lg p-10 max-w-md w-full text-center
                     transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
        >
          <User className="mx-auto mb-4 w-12 h-12 text-blue-500" />

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mi Perfil</h1>
          <hr className="border-t border-gray-100 mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{profile?.name}</h2>

          <div className="mx-auto mb-6 w-32 h-32 relative rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={previewUrl || "/avatar-placeholder.png"}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {user.created_at
              ? `Miembro desde ${new Date(user.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
          </p>

          {/* Seleccionar Imagen */}
          <label className="block mb-2 text-center">
            <input
              type="file"
              accept=".jpg"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded cursor-pointer transition">
              Seleccionar Imagen
            </span>
          </label>

          {/* Aplicar Cambios */}
          <button
            onClick={applyChanges}
            disabled={!selectedFile || uploading}
            className="
              inline-block mb-4 mx-auto
              bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-400 disabled:hover:bg-gray-400
              text-white font-medium py-2 px-4 rounded
              cursor-pointer transition
            "
          >
            {uploading ? "Aplicando..." : "Aplicar Cambios"}
          </button>

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
