"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  useRef,
} from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";

// Inicializa Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Template = {
  name: string;
  category: string;
  language: string;
};

// Dropdown individual via portal con cierre al hacer clic fuera
function DropdownMenu({
  anchorRect,
  onEdit,
  onDelete,
  onClose,
}: {
  anchorRect: DOMRect;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "absolute",
    top: anchorRect.top + window.scrollY,
    left: anchorRect.right + window.scrollX + 8,
    width: 128,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: 1000,
  };

  return createPortal(
    <div ref={menuRef} style={style}>
      <button
        onClick={onEdit}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Editar
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
      >
        Eliminar
      </button>
    </div>,
    document.body
  );
}

export default function WhatsappPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [openFor, setOpenFor] = useState<{ name: string; rect: DOMRect } | null>(null);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para acciones masivas
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = templates.length > 0 && selected.size === templates.length;
  const [massMenuOpen, setMassMenuOpen] = useState(false);
  const massMenuRef = useRef<HTMLDivElement>(null);
  const [massConfirm, setMassConfirm] = useState(false);
  const [deletingMass, setDeletingMass] = useState(false);

  // Funciones de selección
  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(templates.map((t) => t.name)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelectOne = (e: ChangeEvent<HTMLInputElement>, name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.target.checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  // Carga inicial y suscripción a cambios
  useEffect(() => {
    supabase
      .from("plantillas")
      .select("name, category, language")
      .then(({ data, error }) => {
        if (!error && data) setTemplates(data as Template[]);
      });
    const channel = supabase
      .channel("public:plantillas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "plantillas" },
        ({ new: row }) => setTemplates((prev) => [...prev, row as Template])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "plantillas" },
        ({ new: row }) =>
          setTemplates((prev) =>
            prev.map((t) =>
              t.name === (row as Template).name ? (row as Template) : t
            )
          )
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "plantillas" },
        ({ old: row }) =>
          setTemplates((prev) =>
            prev.filter((t) => t.name !== (row as Template).name)
          )
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Confirmar eliminación individual
  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await supabase.from("plantillas").delete().eq("name", toDelete.name);
    setToDelete(null);
    setDeleting(false);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(toDelete.name);
      return next;
    });
  };

  // Cerrar menú masivo al clicar fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        massMenuRef.current &&
        !massMenuRef.current.contains(e.target as Node)
      ) {
        setMassMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Confirmar eliminación masiva
  const confirmMassDelete = async () => {
    setDeletingMass(true);
    await supabase
      .from("plantillas")
      .delete()
      .in("name", Array.from(selected));
    setDeletingMass(false);
    setMassConfirm(false);
    setMassMenuOpen(false);
    setSelected(new Set());
  };

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mis plantillas</h1>
        <Link
          href="/configuracion/whatsapp/crear_plantilla"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
        >
          + Nueva Plantilla
        </Link>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 mb-4">
        Las plantillas de WhatsApp son mensajes preaprobados…{" "}
        <Link
          href="https://developers.facebook.com/docs/whatsapp"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Obtén más información
        </Link>
      </p>

      {/* Acciones Masivas (sin icono) */}
      <div className="flex justify-end mb-4">
        <div ref={massMenuRef} className="relative">
          <button
            onClick={() => setMassMenuOpen((o) => !o)}
            disabled={selected.size === 0}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded ${
              selected.size === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition`}
          >
            Acciones Masivas
          </button>
          {massMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-40">
              <button
                onClick={() => {
                  setMassConfirm(true);
                  setMassMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Eliminar Plantillas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </th>
              {["Nombre", "Categoría", "Idioma", "Estado"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
              {/* Columna de acciones eliminada */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No hay plantillas.
                </td>
              </tr>
            ) : (
              templates.map((tpl) => (
                <tr key={tpl.name}>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded"
                      checked={selected.has(tpl.name)}
                      onChange={(e) => handleSelectOne(e, tpl.name)}
                    />
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">{tpl.name}</td>
                  <td className="px-6 py-2 whitespace-nowrap">{tpl.category}</td>
                  <td className="px-6 py-2 whitespace-nowrap">{tpl.language}</td>
                  <td className="px-6 py-2 whitespace-nowrap text-green-600">
                    ✓ Aprobado
                  </td>
                  {/* Botón de 3 puntos eliminado */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown individual (inactivo al haber quitado el trigger) */}
      {openFor && (
        <DropdownMenu
          anchorRect={openFor.rect}
          onEdit={() => {
            setOpenFor(null);
            window.location.href = `/configuracion/whatsapp/editar_plantilla?name=${encodeURIComponent(
              openFor.name
            )}`;
          }}
          onDelete={() => {
            setToDelete(templates.find((t) => t.name === openFor.name) || null);
            setOpenFor(null);
          }}
          onClose={() => setOpenFor(null)}
        />
      )}

      {/* Modal de confirmación individual */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              ¿Seguro que quieres eliminar esta plantilla?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción no se puede deshacer
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {deleting ? "Eliminando..." : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación masiva */}
      {massConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              ¿Estás Seguro/a?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción no se puede deshacer
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMassConfirm(false)}
                disabled={deletingMass}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={confirmMassDelete}
                disabled={deletingMass}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {deletingMass ? "Eliminando..." : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
