// File: src/app/acceso/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Hand } from "lucide-react";

export default function AccessPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Si ya hay sesión activa, redirige a /inicio
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/inicio");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!name.trim()) {
        setError("Por favor, introduce tu nombre");
        return;
      }
      if (secret !== "clientes2018") {
        setError("Clave secreta incorrecta");
        return;
      }
      // 1) Registramos al usuario
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(`Error al registrarse: ${signUpError.message}`);
        return;
      }
      // 2) Guardamos en profiles
      const user = signUpData?.user;
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, email, name }]);
        if (profileError) {
          setError(`Error guardando perfil: ${profileError.message}`);
          return;
        }
      }
      // 3) Vamos a inicio
      router.push("/inicio");
    } else {
      // Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(`Error al iniciar sesión: ${signInError.message}`);
      } else {
        router.push("/inicio");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 transform transition duration-500 hover:scale-105 animate-fadeIn">
        {/* Icono saludando */}
        <div className="flex justify-center mb-4">
          <Hand className="w-14 h-14 text-blue-600 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Bienvenido al CRM de Casachata
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Sistema Interno de Gestión de Conversaciones y Contactos
        </p>

        <div className="flex justify-center mb-6 space-x-4 border-b border-gray-300">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-2 font-medium transition ${
              mode === "login"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-2 font-medium transition ${
              mode === "register"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-gray-700">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-gray-700">Clave de Registro</label>
              <input
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
          >
            {mode === "login" ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>
      </div>

      {/* Animación fadeIn */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
