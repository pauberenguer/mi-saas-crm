// File: src/app/configuracion/notificaciones/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function NotificacionesPage() {
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);

  // Leer la preferencia de localStorage al cargar
  useEffect(() => {
    const guardado = localStorage.getItem("notificacionesActivas");
    if (guardado === "false") {
      setNotificacionesActivas(false);
    } else if (guardado === "true") {
      setNotificacionesActivas(true);
    }
  }, []);

  // Función para cambiar estado y guardar en localStorage
  const toggleNotificaciones = () => {
    const nuevaOpcion = !notificacionesActivas;
    setNotificacionesActivas(nuevaOpcion);
    localStorage.setItem("notificacionesActivas", String(nuevaOpcion));

    // Reproduce sonido solo si se activan
    if (nuevaOpcion) {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: "#1d1d1d" }}>
        Notificaciones
      </h2>
      <p className="text-gray-600 mb-4">
        Gestiona si deseas recibir notificaciones del sistema para eventos importantes y actualizaciones.
      </p>

      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          id="toggle-notificaciones"
          checked={notificacionesActivas}
          onChange={toggleNotificaciones}
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
        {notificacionesActivas
          ? "Las notificaciones están activadas. Recibirás avisos sobre actividad importante."
          : "Las notificaciones están desactivadas. No recibirás avisos hasta que las actives nuevamente."}
      </div>
    </div>
  );
}
