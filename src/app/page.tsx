// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function LandingPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      // Validación de la clave secreta para registro (sin mostrar "clientes2018")
      if (secret !== "clientes2018") {
        setError("Clave secreta incorrecta");
        return;
      }
      // Registramos al usuario usando Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        // Después del registro redirigimos a la página de inicio (/inicio)
        router.push("/inicio");
      }
    } else {
      // Inicio de sesión (login)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        // Login exitoso: redirigimos a la página de inicio (/inicio)
        router.push("/inicio");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-10 max-w-md w-full transform transition duration-500 hover:scale-105">
        <h1 className="text-4xl font-bold text-center mb-6">Bienvenido al CRM de Casachata</h1>
        <p className="text-center text-gray-600 mb-8">
          Sistema Interno de Gestión de Conversaciones y Contactos
        </p>
        <div className="flex justify-center mb-6 border-b border-gray-300">
          <button
            onClick={() => setMode("login")}
            className={`w-1/2 py-2 font-medium transition ${
              mode === "login" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`w-1/2 py-2 font-medium transition ${
              mode === "register" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
          >
            Registro
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                // Se ha eliminado el placeholder para no mostrar "clientes2018"
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
    </div>
  );
}