"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
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

// Dropdown via portal (igual que antes)
function DropdownMenu({
  anchorRect,
  onEdit,
  onDelete,
}: {
  anchorRect: DOMRect;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
    <div style={style}>
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
  const [openFor, setOpenFor] = useState<{ name: string; rect: DOMRect } | null>(
    null
  );
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  // estado de selección
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected =
    templates.length > 0 && selected.size === templates.length;

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(templates.map((t) => t.name)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectOne = (
    e: ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.target.checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

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
        ({ new: row }) =>
          setTemplates((prev) => [...prev, row as Template])
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
    return () => supabase.removeChannel(channel);
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await supabase.from("plantillas").delete().eq("name", toDelete.name);
    setToDelete(null);
    setDeleting(false);
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

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Alineamos horizontalmente con text-center */}
              <th className="px-4 py-2 align-middle text-center">
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
                  className="px-6 py-2 align-middle text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
              <th className="px-6 py-2 align-middle" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No hay plantillas.
                </td>
              </tr>
            ) : (
              templates.map((tpl) => (
                <tr key={tpl.name}>
                  <td className="px-4 py-2 align-middle text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded"
                      checked={selected.has(tpl.name)}
                      onChange={(e) => handleSelectOne(e, tpl.name)}
                    />
                  </td>
                  <td className="px-6 py-2 align-middle whitespace-nowrap">
                    {tpl.name}
                  </td>
                  <td className="px-6 py-2 align-middle whitespace-nowrap">
                    {tpl.category}
                  </td>
                  <td className="px-6 py-2 align-middle whitespace-nowrap">
                    {tpl.language}
                  </td>
                  <td className="px-6 py-2 align-middle whitespace-nowrap text-green-600">
                    ✓ Aprobado
                  </td>
                  <td className="px-6 py-2 align-middle text-right relative">
                    <button
                      className="p-1"
                      onClick={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setOpenFor(
                          openFor?.name === tpl.name
                            ? null
                            : { name: tpl.name, rect }
                        );
                      }}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown via portal */}
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
            setToDelete(
              templates.find((t) => t.name === openFor.name) || null
            );
            setOpenFor(null);
          }}
        />
      )}

      {/* Modal de confirmación */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              ¿Seguro que quieres eliminar esta plantilla?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
