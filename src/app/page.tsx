// File: src/app/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Users, Zap, Lock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      Icon: MessageCircle,
      title: "Mensajería en Tiempo Real",
      desc:
        "Chatea con tus clientes directamente desde la plataforma, mantiene un historial completo y responde al instante.",
    },
    {
      Icon: Zap,
      title: "Automatizaciones Inteligentes",
      desc:
        "Define flujos de mensajes automáticos para recordatorios, seguimientos y mucho más, sin despeinarte.",
    },
    {
      Icon: Users,
      title: "Gestión de Contactos",
      desc:
        "Centraliza toda la información de tus clientes, segmenta por etiquetas y obtén estadísticas de interacción.",
    },
    {
      Icon: Lock,
      title: "Seguridad y Escalabilidad",
      desc:
        "Construido sobre Supabase, garantiza que tus datos estén seguros y tu plataforma crezca sin límites.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div
          className="max-w-2xl space-y-8 animate-fadeIn"
          style={{ textAlign: "center", textJustify: "inter-word" }}
        >
          <h1 className="text-5xl font-extrabold text-gray-900">
            Bienvenido a Casachata CRM
          </h1>
          <p className="text-lg text-gray-700">
            Gestiona tus conversaciones y contactos de manera eficiente, en tiempo
            real y con el poder de la automatización avanzada.
          </p>
          <button
            onClick={() => router.push("/acceso")}
            className="bg-[#0084ff] hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Acceder al CRM
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 px-6 bg-[#f9fafb]">
        <div className="max-w-4xl mx-auto grid gap-10 md:grid-cols-2">
          {features.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className={`flex flex-col items-center space-y-4 animate-fadeIn delay-${(i + 1) *
                100}`}
              style={{ textAlign: "center", textJustify: "inter-word" }}
            >
              <Icon
                className="w-8 h-8 text-[#0084ff] animate-pulse"
                aria-hidden="true"
              />
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Animations */}
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
          opacity: 0;
          animation: fadeIn 0.6s ease-in-out forwards;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
