"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

// Tipos
type ButtonType = "URL" | "REPLY" | "";

const allLanguages = ["es", "en", "ca", "fr"];

// Helper para sanitizar variables
const sanitizeVars = (txt: string) =>
  txt.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, v) => `{{${v.trim().toLowerCase()}}}`);

export default function CrearPlantillaPage() {
  const router = useRouter();

  // Estados principales
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("MARKETING");
  const [templateLanguage, setTemplateLanguage] = useState("es");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerMedia, setHeaderMedia] = useState<File | null>(null);
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [variables, setVariables] = useState<Array<{name: string, example: string}>>([]);
  const [fileError, setFileError] = useState("");

  // Estados para modales
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showCharPrompt, setShowCharPrompt] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  interface MediaUploadResponse {
    id: string;
    url: string;
    [key: string]: unknown;
  }

  // Función para subir media
  const uploadMedia = async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document");
    formData.append("messaging_product", "whatsapp");

    const response = await fetch("/api/whatsapp/upload-media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al subir el archivo");
    }

    return response.json() as Promise<MediaUploadResponse>;
  };

  // cuando escribes algo en el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
  };

  /* -------------------------
        File input + preview
  --------------------------*/
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !headerType) return;
    let valid = false, maxSize = 0;
    if (headerType === "IMAGE") {
      valid = ["image/jpeg","image/png"].includes(file.type);
      maxSize = 5 * 1024 * 1024;
    } else if (headerType === "VIDEO") {
      valid = ["video/mp4","video/3gpp"].includes(file.type);
      maxSize = 16 * 1024 * 1024;
    } else {
      valid = file.type === "application/pdf";
      maxSize = 16 * 1024 * 1024;
    }
    if (!valid) {
      setFileError("Formato inválido");
      setHeaderMedia(null);
      setMediaPreview(null);
      return;
    }
    if (file.size > maxSize) {
      setFileError(`Supera ${maxSize/1e6}MB`);
      setHeaderMedia(null);
      setMediaPreview(null);
      return;
    }
    setFileError("");
    setHeaderMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  // character counters
  const remMsg = 1024 - bodyText.length;
  const remFtr =   60 - footerText.length;

  // render line with blue variables (ya sanitizado a minúsculas)
  const renderLine = (ln: string) =>
    sanitizeVars(ln).split(/(\{\{.*?\}\})/g).map((s, i) =>
      s.match(/\{\{.*?\}\}/)
        ? <span key={i} className="text-blue-600">{s}</span>
        : <span key={i}>{s}</span>
    );

  // botón habilitado solo si se cumplen los requisitos básicos
  const canSend =
    templateName.trim() !== "" &&
    templateCategory !== "" &&
    bodyText.trim() !== "";

  /* ======================================
        Manejador para envío al webhook
  ====================================== */
  const handleSendToReview = async () => {
    // 1. Sólo minúsculas, números y guión bajo
    if (/[^a-z0-9_]/.test(templateName)) {
      setShowCharPrompt(true);
      return;
    }
    // 2. Sin mayúscula inicial
    if (/^[A-Z]/.test(templateName)) {
      setShowNamePrompt(true);
      return;
    }

    const language = templateLanguage;
    const format   = headerType ?? "NONE";

    // formateo de body_text: reemplaza saltos de línea por "\n" solo si existen
    let bodyTextFormatted = sanitizeVars(bodyText);
    if (bodyTextFormatted.includes("\n")) {
      bodyTextFormatted = bodyTextFormatted.replace(/\n/g, "\\n");
    }

    const payload: Record<string, unknown> = {
      name: templateName,
      language,
      category: templateCategory,
      format,
      body_text: bodyTextFormatted,
    };
    if (headerText.trim()) payload.header_text = sanitizeVars(headerText);
    if (footerText.trim()) payload.footer_text = footerText;

    try {
      await fetch(
        "https://n8n.asisttente.com/webhook/elglobocrearplantilla",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      setShowConfirm(true);
    } catch (err) {
      console.error("Error al enviar:", err);
    }
  };

  /* =========== JSX ============ */
  return (
    <>
      <div
        className="flex h-screen overflow-hidden bg-gray-50"
        onWheel={(e) => e.preventDefault()}
      >
        <div className="flex-1 bg-white rounded-lg shadow flex items-start">

          {/* Column 1 */}  
          <div className="w-1/3 border-r border-gray-200 px-6 py-4 space-y-4" ref={menuRef}>
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Nombre de Plantilla
              </label>
              <input
                type="text"
                placeholder="Nombre"
                value={templateName}
                onChange={handleNameChange}
                className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Categoría de Plantilla
              </label>
              <select
                value={templateCategory}
                onChange={e => setTemplateCategory(e.target.value)}
                className={`w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  templateCategory ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="">Elegir categoría</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilidad</option>
                <option value="AUTHENTICATION">Autenticación</option>
              </select>
            </div>

            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Idioma
              </label>
              <select
                value={templateLanguage}
                onChange={e => setTemplateLanguage(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {allLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Header */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Cabecera (Opcional)
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  {(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { 
                        setHeaderType(t); 
                        setHeaderText(""); 
                        setHeaderMedia(null); 
                        setMediaPreview(null); 
                        setFileError(""); 
                      }}
                      className={`flex-1 border border-dashed border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:border-gray-400 ${headerType===t?"bg-gray-100":""}`}
                    >
                      {t === "NONE" ? "Ninguna" : t}
                    </button>
                  ))}
                </div>
                
                {headerType === "TEXT" && (
                  <input
                    type="text"
                    placeholder="Texto de cabecera"
                    value={headerText}
                    onChange={e => setHeaderText(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
                
                {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                  <div>
                    <div className="flex items-center space-x-2">
                      <label className="flex-1 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
                        {headerMedia?.name ?? (headerType==="IMAGE"?"Seleccionar Imagen":headerType==="VIDEO"?"Seleccionar Video":"Seleccionar Documento")}
                        <input type="file" accept={
                          headerType==="IMAGE"?".jpg,.jpeg,.png":
                          headerType==="VIDEO"?".mp4,.3gp":".pdf"
                        } onChange={onFileChange} className="hidden"/>
                      </label>
                    </div>
                    {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Mensaje de texto *
              </label>
              <textarea
                rows={4}
                placeholder="Mensaje de texto"
                value={bodyText}
                onChange={e=>setBodyText(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{remMsg} caracteres restantes</p>
            </div>

            {/* Footer */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Pie de página (Opcional)
              </label>
              <input
                type="text"
                placeholder="Texto del pie"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{remFtr} caracteres restantes</p>
            </div>

            {/* Botón enviar */}
            <div className="pt-4">
              <button
                onClick={canSend ? handleSendToReview : undefined}
                disabled={!canSend || isSubmitting}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  canSend && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Enviando..." : "Enviar para Revisión"}
              </button>
              {submitMessage && (
                <p className={`mt-2 text-sm ${submitMessage.includes("exitosamente") ? "text-green-600" : "text-red-600"}`}>
                  {submitMessage}
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Vista previa */}
          <div className="w-2/3 p-6 bg-gray-100 relative">
            <h3 className="text-lg font-semibold mb-4">Vista Previa</h3>
            <div className="max-w-sm mx-auto">
              <div className="bg-[#dcf8c6] rounded-lg p-4 shadow-sm">
                {headerType === "IMAGE" && mediaPreview && <img src={mediaPreview} alt="" className="rounded-md mb-2 w-full" />}
                {headerType === "VIDEO" && mediaPreview && <video src={mediaPreview} controls className="rounded-md mb-2 w-full" />}
                {headerType === "DOCUMENT" && headerMedia && (
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-6 h-6 text-gray-500" />
                    <span className="text-sm truncate">{headerMedia.name}</span>
                  </div>
                )}
                {headerText && <p className="font-semibold text-gray-900 text-sm mb-1">{renderLine(headerText)}</p>}
                {bodyText.split("\n").map((ln,i)=><p key={i} className="text-gray-800 text-sm mb-1">{renderLine(ln)}</p>)}
                {footerText && <p className="text-gray-500 text-xs mb-1">{footerText}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">¡Plantilla Enviada!</h3>
            <p className="text-gray-600 mb-4">
              Tu plantilla ha sido enviada para revisión. Recibirás una notificación cuando sea aprobada.
            </p>
            <button
              onClick={() => {
                setShowConfirm(false);
                router.push("/configuracion/whatsapp");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Volver a Plantillas
            </button>
          </div>
        </div>
      )}

      {showNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nombre inválido</h3>
            <p className="text-gray-600 mb-4">
              El nombre no puede empezar con mayúscula. Por favor, corrígelo.
            </p>
            <button
              onClick={() => setShowNamePrompt(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showCharPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Caracteres inválidos</h3>
            <p className="text-gray-600 mb-4">
              Solo se permiten letras minúsculas, números y guiones bajos (_).
            </p>
            <button
              onClick={() => setShowCharPrompt(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
