// File: src/app/configuracion/whatsapp/crear_plantilla/page.tsx
"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Battery, Trash2, Smile, Code, FileText } from "lucide-react";

// dynamic import of the full WhatsApp emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const categorias = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY",   label: "Utility" },
];

// Lista completa de idiomas
const allLanguages = [
  "Afrikaans","Albanian","Arabic","Azerbaijani","Bengali","Bulgarian","Catalan",
  "Chinese (CHN)","Chinese (HKG)","Chinese (TAI)","Croatian","Czech","Danish",
  "Dutch","English","English (UK)","English (US)","Estonian","Filipino","Finnish",
  "French","German","Greek","Gujarati","Hebrew","Hindi","Hungarian","Indonesian",
  "Irish","Italian","Japanese","Kannada","Kazakh","Korean","Lao","Latvian",
  "Lithuanian","Macedonian","Malay","Marathi","Norwegian","Persian","Polish",
  "Portuguese (BR)","Portuguese (POR)","Punjabi","Romanian","Russian","Serbian",
  "Slovak","Slovenian","Spanish (ARG)","Spanish (SPA)","Spanish (MEX)",
  "Swahili","Swedish","Tamil","Telugu","Thai","Turkish","Ukrainian","Urdu",
  "Uzbek","Vietnamese",
];

enum HeaderType {
  TEXT     = "TEXT",
  IMAGE    = "IMAGE",
  VIDEO    = "VIDEO",
  DOCUMENT = "DOCUMENT",
}

/* ========================
   Variables siempre en minúscula
======================== */
const varOptions = ["nombre","raza","sexo","color"];

type ButtonType = "URL" | "REPLY" | "";

/* Helper que coloca cualquier variable entre {{ }} en minúsculas */
const sanitizeVars = (txt: string) =>
  txt.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, v) => `{{${v.trim().toLowerCase()}}}`);

export default function CrearPlantillaPage() {
  const router = useRouter();

  // form state
  const [templateName, setTemplateName] = useState("");
  const [category,     setCategory]     = useState("");
  const [idiomas,      setIdiomas]      = useState<string[]>([]);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [headerType,   setHeaderType]   = useState<HeaderType|null>(null);
  const [headerText,   setHeaderText]   = useState("");
  const [messageText,  setMessageText]  = useState("");
  const [footerText,   setFooterText]   = useState("");
  const [headerFile,   setHeaderFile]   = useState<File|null>(null);
  const [previewSrc,   setPreviewSrc]   = useState<string>("");
  const [fileError,    setFileError]    = useState("");

  // pickers
  const [emojiOpenMsg, setEmojiOpenMsg] = useState(false);
  const [varOpenMsg,   setVarOpenMsg]   = useState(false);
  const [emojiOpenHdr, setEmojiOpenHdr] = useState(false);
  const [varOpenHdr,   setVarOpenHdr]   = useState(false);

  // buttons
  const [buttonType,   setButtonType]   = useState<ButtonType>("");
  const [btnText,      setBtnText]      = useState("");
  const [btnUrl,       setBtnUrl]       = useState("");
  const [btnVar,       setBtnVar]       = useState("");
  const [replyButtons, setReplyButtons] = useState<string[]>([]);

  // modals
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [showNamePrompt,  setShowNamePrompt]  = useState(false);
  const [showCharPrompt,  setShowCharPrompt]  = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // filter languages
  const filteredLangs = allLanguages.filter(l =>
    l.toLowerCase().includes(search.toLowerCase())
  );

  // close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // cuando escribes algo en el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
  };

  // language handlers
  const addLanguage = (lang: string) => {
    if (!idiomas.includes(lang)) setIdiomas(prev => [...prev, lang]);
    setMenuOpen(false);
    setSearch("");
  };
  const removeLanguage = (i: number) =>
    setIdiomas(prev => prev.filter((_, idx) => idx !== i));

  /* -------------------------
        File input + preview
  --------------------------*/
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !headerType) return;
    let valid = false, maxSize = 0;
    if (headerType === HeaderType.IMAGE) {
      valid = ["image/jpeg","image/png"].includes(file.type);
      maxSize = 5 * 1024 * 1024;
    } else if (headerType === HeaderType.VIDEO) {
      valid = ["video/mp4","video/3gpp"].includes(file.type);
      maxSize = 16 * 1024 * 1024;
    } else {
      valid = file.type === "application/pdf";
      maxSize = 16 * 1024 * 1024;
    }
    if (!valid) {
      setFileError("Formato inválido");
      setHeaderFile(null);
      setPreviewSrc("");
      return;
    }
    if (file.size > maxSize) {
      setFileError(`Supera ${maxSize/1e6}MB`);
      setHeaderFile(null);
      setPreviewSrc("");
      return;
    }
    setFileError("");
    setHeaderFile(file);
    setPreviewSrc(URL.createObjectURL(file));
  };

  /* ------------
     Insertions
  -------------*/
  const insertEmojiMsg = (d: any) => { setMessageText(p => p + d.emoji); setEmojiOpenMsg(false); };
  const insertEmojiHdr = (d: any) => { setHeaderText(p => p + d.emoji); setEmojiOpenHdr(false); };
  const insertVarMsg   = (v: string) => { setMessageText(p => p + `{{${v}}}`); setVarOpenMsg(false); };
  const insertVarHdr   = (v: string) => { setHeaderText(p => p + `{{${v}}}`); setVarOpenHdr(false); };

  // character counters
  const remMsg = 1024 - messageText.length;
  const remHdr =   40 - headerText.length;
  const remFtr =   60 - footerText.length;
  const selLang = idiomas.at(-1) || "";

  // render line with blue variables (ya sanitizado a minúsculas)
  const renderLine = (ln: string) =>
    sanitizeVars(ln).split(/(\{\{.*?\}\})/g).map((s, i) =>
      s.match(/\{\{.*?\}\}/)
        ? <span key={i} className="text-blue-600">{s}</span>
        : <span key={i}>{s}</span>
    );

  // botón habilitado solo si se cumplen los 4 requisitos
  const canSend =
    templateName.trim() !== "" &&
    category !== "" &&
    idiomas.length > 0 &&
    messageText.trim() !== "";

  /* ======================================
        Manejador para envío al webhook
     Ahora transforma saltos de línea en "\n"
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

    const language = selLang;
    const format   = headerType ?? "NONE";

    // formateo de body_text: reemplaza saltos de línea por "\n" solo si existen
    let bodyTextFormatted = sanitizeVars(messageText);
    if (bodyTextFormatted.includes("\n")) {
      bodyTextFormatted = bodyTextFormatted.replace(/\n/g, "\\n");
    }

    const payload: Record<string, any> = {
      name: templateName,
      language,
      category,
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
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  category ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="" disabled>Seleccionar Categoría…</option>
                {categorias.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Idioma */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-800 mb-1">Idioma</label>
              <div className="space-y-1">
                {idiomas.map((lang, i) => (
                  <div key={i} className="flex items-center px-2 py-1 border border-gray-300 rounded-md">
                    <span className="text-gray-900 flex-1 truncate">{lang}</span>
                    <Trash2
                      className="w-4 h-4 text-gray-500 hover:text-red-600 cursor-pointer ml-1"
                      onClick={() => removeLanguage(i)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="mt-1 text-blue-600 text-sm hover:underline"
              >
                + Nuevo idioma
              </button>
              {menuOpen && (
                <div className="absolute z-10 mt-2 w-auto min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Buscar"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <ul className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                    {filteredLangs.map(lang => (
                      <li key={lang}>
                        <button
                          type="button"
                          onClick={() => addLanguage(lang)}
                          className="w-full text-left px-4 py-1 hover:bg-gray-100 text-sm"
                        >
                          {lang}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Column 2 : Preview & Controls */}
          <div className="w-1/3 self-start px-4 py-4 space-y-4">
            {idiomas.length === 0 ? (
              <div className="flex flex-col items-center">
                <Image src="/logo_whatsapp.svg" alt="WhatsApp logo" width={120} height={120} />
                <p className="mt-4 text-gray-500 text-center text-sm">
                  Empieza por añadir un idioma<br/>a la plantilla de tu mensaje
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Notice */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {templateName ? `${templateName} • ${selLang}` : selLang}
                  </h2>
                  <button
                    type="button"
                    onClick={handleSendToReview}
                    disabled={!canSend}
                    className={`px-4 py-2 rounded text-sm ${
                      canSend
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Enviar a Revisión
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Una nueva plantilla requiere la aprobación de Meta antes de su envío,
                  lo que puede tardar desde unos minutos hasta 24 horas.
                </p>

                {/* Encabezado */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Encabezado <span className="text-gray-500 text-xs">Opcional</span>
                  </label>
                  <div className="flex space-x-4">
                    {Object.values(HeaderType).map(t => (
                      <button
                        key={t}
                        onClick={() => { setHeaderType(t); setHeaderText(""); setHeaderFile(null); setPreviewSrc(""); setFileError(""); }}
                        className={`flex-1 border border-dashed border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:border-gray-400 ${headerType===t?"bg-gray-100":""}`}
                      >
                        {t === HeaderType.TEXT ? "Texto"
                          : t === HeaderType.IMAGE ? "Imagen"
                          : t === HeaderType.VIDEO ? "Video"
                          : "Archivo"}
                      </button>
                    ))}
                  </div>

                  {/* Texto Encabezado */}
                  {headerType === HeaderType.TEXT && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Escribe encabezado"
                        value={headerText}
                        onChange={e => setHeaderText(e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-end items-center space-x-2 mt-1 relative">
                        <button onClick={()=>setEmojiOpenHdr(o=>!o)}><Smile className="w-5 h-5 text-gray-500"/></button>
                        {emojiOpenHdr && <div className="absolute bottom-full right-0 z-30"><EmojiPicker onEmojiClick={insertEmojiHdr}/></div>}
                        <button onClick={()=>setVarOpenHdr(o=>!o)}><Code className="w-5 h-5 text-gray-500"/></button>
                        {varOpenHdr && (
                          <div className="absolute bottom-full right-0 bg-white border rounded shadow p-2 z-30">
                            {varOptions.map(v=>(
                              <button key={v} onClick={()=>insertVarHdr(v)} className="block px-2 py-1 text-sm hover:bg-gray-100 text-blue-600">
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                        <span className={`text-xs ${remHdr<0?"text-red-600":"text-gray-500"}`}>{remHdr}</span>
                      </div>
                    </div>
                  )}

                  {/* Media/File Encabezado */}
                  {(headerType===HeaderType.IMAGE||headerType===HeaderType.VIDEO||headerType===HeaderType.DOCUMENT) && (
                    <div className="flex items-center space-x-2">
                      <label className="flex-1 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
                        {headerFile?.name ?? (headerType===HeaderType.IMAGE?"Seleccionar Imagen":headerType===HeaderType.VIDEO?"Seleccionar Video":"Seleccionar Documento")}
                        <input type="file" accept={
                          headerType===HeaderType.IMAGE?".jpg,.jpeg,.png":
                          headerType===HeaderType.VIDEO?".mp4,.3gp":".pdf"
                        } onChange={onFileChange} className="hidden"/>
                      </label>
                      {headerFile && <Trash2 className="w-5 h-5 text-gray-500 cursor-pointer" onClick={()=>{setHeaderFile(null);setPreviewSrc("")}}/>}
                      <span className="text-xs text-gray-500">40</span>
                    </div>
                  )}
                  {fileError && <p className="text-red-600 text-xs">{fileError}</p>}
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    rows={4}
                    placeholder="Mensaje de texto"
                    value={messageText}
                    onChange={e=>setMessageText(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex justify-end items-center space-x-2 mt-1 relative">
                    <button onClick={()=>setEmojiOpenMsg(o=>!o)}><Smile className="w-5 h-5 text-gray-500"/></button>
                    {emojiOpenMsg && <div className="absolute bottom-full right-0 z-30"><EmojiPicker onEmojiClick={insertEmojiMsg}/></div>}
                    <button onClick={()=>setVarOpenMsg(o=>!o)}><Code className="w-5 h-5 text-gray-500"/></button>
                    {varOpenMsg && (
                      <div className="absolute bottom-full right-0 bg-white border rounded shadow p-2 z-30">
                        {varOptions.map(v=>(
                          <button key={v} onClick={()=>insertVarMsg(v)} className="block px-2 py-1 text-sm hover:bg-gray-100 text-blue-600">
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className={`text-xs ${remMsg<0?"text-red-600":"text-gray-500"}`}>{remMsg}</span>
                  </div>
                </div>

                {/* Pie de página */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pie de página <span className="text-gray-500 text-xs">Opcional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Texto del pie de página"
                    value={footerText}
                    onChange={e=>setFooterText(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className={`text-xs float-right ${remFtr<0?"text-red-600":"text-gray-500"}`}>{remFtr}</span>
                </div>
              </div>
            )}
          </div>

          {/* Column 3 : Mobile Mockup */}
          <div className="w-1/3 flex items-center justify-center self-start p-6">
            <div className="relative w-[280px] h-[600px] bg-white border-8 border-gray-100 rounded-[40px] shadow-xl overflow-hidden">
              {/* wallpaper */}
              <div className="absolute inset-x-0 bottom-0 top-[72px] bg-cover bg-center z-0"
                style={{ backgroundImage: "url('/fondo_whatsapp.jpg')" }} />
              {/* notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-50 rounded-b-2xl z-10" />
              {/* status bar */}
              <div className="absolute top-4 inset-x-0 px-4 flex justify-between items-center text-black text-xs z-10">
                <span>3:50 PM</span>
                <Battery className="w-5 h-5 text-black" />
              </div>
              {/* header */}
              <div className="absolute top-16 inset-x-0 h-14 bg-[#075e54] flex items-center px-4 z-10">
                <button className="text-white text-xl mr-3">←</button>
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white mr-2">
                  <Image src="/casachata.png" alt="Avatar" fill style={{ objectFit:"cover" }} />
                </div>
                <span className="text-white font-medium">Casachata</span>
                <span className="ml-auto text-white text-xl">⋮</span>
              </div>
              {/* preview bubble */}
              {idiomas.length > 0 && (
                <div className="absolute top-[140px] left-4 z-10 space-y-2">
                  <div className="bg-white p-2 rounded-lg shadow">
                    {headerType===HeaderType.IMAGE && previewSrc && <img src={previewSrc} className="rounded-md mb-2 w-full" />}
                    {headerType===HeaderType.VIDEO && previewSrc && <video src={previewSrc} controls className="rounded-md mb-2 w-full" />}
                    {headerType===HeaderType.DOCUMENT && headerFile && (
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-6 h-6 text-gray-500" />
                        <span className="text-sm truncate">{headerFile.name}</span>
                      </div>
                    )}
                    {headerText && <p className="font-semibold text-gray-900 text-sm mb-1">{renderLine(headerText)}</p>}
                    {messageText.split("\n").map((ln,i)=><p key={i} className="text-gray-800 text-sm mb-1">{renderLine(ln)}</p>)}
                    {footerText && <p className="text-gray-500 text-xs mb-1">{footerText}</p>}
                  </div>
                  {buttonType==="REPLY" && replyButtons.map((t,i)=>(<button key={i} className="w-full bg-white border rounded-md py-2 text-blue-600">{t}</button>))}
                  {buttonType==="URL" && btnText && (<button className="w-full bg-white border rounded-md py-2 text-blue-600">{btnText}</button>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Por favor, pon el nombre de la plantilla en minúscula 🐶
            </h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowNamePrompt(false)}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
      {showCharPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Recuerda que Meta solo permite minúsculas, números y guiones bajos,<br/>sin espacios ni otros símbolos 🐶
            </h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowCharPrompt(false)}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <h3 className="text-xl font-semibold mb-2">Listo</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tu plantilla se ha enviado a revisión, te mantendremos informado sobre el estado de su aprobación.
            </p>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => router.push("/configuracion/whatsapp")}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Estilos globales para ocultar scroll y desactivar wheel */}
      <style jsx global>{`
        /* Oculta scrollbars en Chrome, Safari y Opera */
        ::-webkit-scrollbar {
          display: none;
        }
        /* Oculta scrollbar en Firefox */
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Desactiva todo scroll de página */
        html, body {
          overflow: hidden !important;
        }
      `}</style>
    </>
  );
}
