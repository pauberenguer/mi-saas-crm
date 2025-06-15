"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

const allLanguages = ["es", "en", "ca", "fr"];

// Helper para sanitizar variables
const sanitizeVars = (txt: string) =>
  txt.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, v) => `{{${v.trim().toLowerCase()}}}`);

export default function CrearPlantillaPage() {
  const router = useRouter();

  // Estados principales
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("es");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerMedia, setHeaderMedia] = useState<File | null>(null);
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  // Estados para modales
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showCharPrompt, setShowCharPrompt] = useState(false);

  // Estados para la interfaz
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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

  // Función para seleccionar idioma
  const handleLanguageSelect = (lang: string) => {
    setTemplateLanguage(lang);
    setLanguageSelected(true);
    setLanguageMenuOpen(false);
  };

  // Cerrar menú cuando se hace click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* =========== JSX ============ */
  return (
    <>
      <div
        className="flex h-screen overflow-hidden bg-gray-50"
        onWheel={(e) => e.preventDefault()}
      >
        <div className="flex-1 bg-white rounded-lg shadow flex items-start">

          {/* Columna 1: Formulario */}  
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
                <option value="">Seleccionar Categoría</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
              </select>
            </div>

            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Idioma
              </label>
              <select
                value={templateLanguage}
                onChange={e => handleLanguageSelect(e.target.value)}
                className={`w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  languageSelected ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="">Seleccionar Idioma...</option>
                <option value="español">Español</option>
              </select>
            </div>

            
          </div>

          {/* Columna 2: Logo de WhatsApp o Formulario */}
          <div className="w-1/3 border-r border-gray-200 bg-white">
            {!languageSelected ? (
              /* Logo de WhatsApp cuando no hay idioma seleccionado */
              <div className="flex flex-col items-center justify-end h-full pb-32">
                <div className="text-center">
                  <div className="flex justify-center items-center mb-4">
                    <img src="/logo_whatsapp.svg" alt="WhatsApp" className="w-38 h-38" />
                  </div>
                  <p className="text-gray-600 text-sm max-w-[200px]">
                    Empieza por añadir un idioma<br />
                    a la plantilla de tu mensaje
                  </p>
                </div>
              </div>
            ) : (
              /* Formulario de plantilla cuando hay idioma seleccionado */
              <div className="px-6 py-6 overflow-y-auto h-full bg-white">
                                {/* Header con título y botón */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {templateName ? `${templateName} • ` : ""}{templateLanguage.charAt(0).toUpperCase() + templateLanguage.slice(1)}
                    </h2>
                  </div>
                  <button
                    onClick={canSend ? handleSendToReview : undefined}
                    disabled={!canSend}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      canSend
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Enviar a Revisión
                  </button>
                </div>

                {/* Texto descriptivo */}
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                  Una nueva plantilla requiere la aprobación de Meta antes de su envío, lo que 
                  puede tardar desde unos minutos hasta 24 horas.
                </p>

                {/* Encabezado */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Encabezado <span className="text-gray-500 font-normal text-sm">Opcional</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { key: "TEXT", label: "Texto" },
                      { key: "IMAGE", label: "Imagen" },
                      { key: "VIDEO", label: "Vídeo" },
                      { key: "DOCUMENT", label: "Archivo" }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { 
                          setHeaderType(key as any); 
                          setHeaderText(""); 
                          setHeaderMedia(null); 
                          setMediaPreview(null); 
                          setFileError(""); 
                        }}
                        className={`border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 hover:border-gray-400 transition-colors ${
                          headerType === key ? "border-blue-500 bg-blue-50" : ""
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  
                  {headerType === "TEXT" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Texto de cabecera"
                        value={headerText}
                        onChange={e => setHeaderText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        maxLength={40}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-gray-500 text-sm font-medium">{Math.max(0, 40 - headerText.length)}</span>
                      </div>
                    </div>
                  )}
                  
                  {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                    <div className="mt-2">
                      <label className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
                        {headerMedia?.name ?? (headerType==="IMAGE"?"Seleccionar Imagen":headerType==="VIDEO"?"Seleccionar Video":"Seleccionar Documento")}
                        <input type="file" accept={
                          headerType==="IMAGE"?".jpg,.jpeg,.png":
                          headerType==="VIDEO"?".mp4,.3gp":".pdf"
                        } onChange={onFileChange} className="hidden"/>
                      </label>
                      {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                    </div>
                  )}
                </div>

                {/* Mensaje */}
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Mensaje</h3>
                  <div>
                    <textarea
                      rows={6}
                      placeholder="Mensaje de texto"
                      value={bodyText}
                      onChange={e=>setBodyText(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-gray-500 text-sm font-medium">{remMsg > 0 ? remMsg : 0}</span>
                    </div>
                  </div>
                </div>

                {/* Pie de página */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Pie de página <span className="text-gray-500 font-normal text-sm">Opcional</span>
                  </h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Texto del pie de página"
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      maxLength={60}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-gray-500 text-sm font-medium">{Math.max(0, 60 - footerText.length)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna 3: Preview del móvil */}
          <div className="w-1/3 p-6 bg-white flex items-center justify-center">
            <div className="max-w-sm">
              {/* Marco del móvil */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden" style={{width: '280px', height: '580px'}}>
                {/* Status bar del móvil */}
                <div className="flex justify-between items-center px-6 py-3 text-black text-sm font-medium">
                  <div className="text-left">3:50 PM</div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-3 border border-black rounded-sm flex items-center justify-end pr-0.5">
                      <div className="w-4 h-1.5 bg-black rounded-sm"></div>
                    </div>
                  </div>
                </div>

                {/* Header de WhatsApp */}
                <div className="bg-[#4a9b8e] text-white px-4 py-3 flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img src="/casachata.png" alt="Casachata" className="w-8 h-8 object-cover rounded-full" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">Casachata</h3>
                  </div>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>

                {/* Área de chat */}
                <div className="bg-[#e5ddd5] px-4 py-6 flex-1 min-h-[400px]">
                  {/* Mensaje de plantilla - solo mostrar si hay contenido */}
                  {(headerText || bodyText || footerText || mediaPreview || headerMedia) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-[220px]">
                      {/* Preview del contenido */}
                      <div className="space-y-3">
                        {/* Encabezado multimedia */}
                        {headerType === "IMAGE" && mediaPreview && (
                          <div className="rounded-md overflow-hidden">
                            <img src={mediaPreview} alt="Header" className="w-full h-32 object-cover" />
                          </div>
                        )}
                        {headerType === "VIDEO" && mediaPreview && (
                          <div className="rounded-md overflow-hidden">
                            <video src={mediaPreview} className="w-full h-32 object-cover" />
                          </div>
                        )}
                        {headerType === "DOCUMENT" && headerMedia && (
                          <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">📄</span>
                            </div>
                            <span className="text-xs text-gray-700 truncate">{headerMedia.name}</span>
                          </div>
                        )}
                        
                        {/* Encabezado texto - solo mostrar si hay contenido real */}
                        {headerText && (
                          <div className="text-gray-900 font-semibold text-sm">
                            {headerText}
                          </div>
                        )}
                        
                        {/* Mensaje - solo mostrar si hay contenido */}
                        {bodyText && (
                          <div className="text-gray-900 text-sm whitespace-pre-wrap">
                            {bodyText}
                          </div>
                        )}
                        
                        {/* Pie - solo mostrar si hay contenido */}
                        {footerText && (
                          <div className="text-gray-500 text-xs">
                            {footerText}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
