"use client";

import React from "react";
import { useNotification } from "../../LayoutClientRuntime";

export default function NotificacionesPage() {
  const { enabled, toggle } = useNotification();

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "#1d1d1d" }}>
        Notificaciones
      </h2>
      <p className="text-gray-600 mb-4">
        Gestiona si deseas recibir notificaciones del sistema para eventos
        importantes y actualizaciones.
      </p>

      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          id="toggle-notificaciones"
          checked={enabled}
          onChange={toggle}
          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="toggle-notificaciones"
          className="text-gray-800 text-sm select-none"
        >
          Activar/Desactivar Notificaciones
        </label>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        {enabled
          ? "Las notificaciones están activadas. Recibirás avisos sobre actividad importante."
          : "Las notificaciones están desactivadas. No recibirás avisos hasta que las actives nuevamente."}
      </div>
    </div>
  );
}
