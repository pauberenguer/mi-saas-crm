'use client'

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  Suspense,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// --- datos estáticos --------------------------------------------------------
const categorias = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
]

const allLanguages = [
  'Afrikaans', 'Albanian', 'Arabic', 'Azerbaijani', 'Bengali', 'Bulgarian',
  'Catalan', 'Chinese (CHN)', 'Chinese (HKG)', 'Chinese (TAI)', 'Croatian',
  'Czech', 'Danish', 'Dutch', 'English', 'English (UK)', 'English (US)',
  'Estonian', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Gujarati',
  'Hebrew', 'Hindi', 'Hungarian', 'Indonesian', 'Irish', 'Italian', 'Japanese',
  'Kannada', 'Kazakh', 'Korean', 'Lao', 'Latvian', 'Lithuanian', 'Macedonian',
  'Malay', 'Marathi', 'Norwegian', 'Persian', 'Polish', 'Portuguese (BR)',
  'Portuguese (POR)', 'Punjabi', 'Romanian', 'Russian', 'Serbian', 'Slovak',
  'Slovenian', 'Spanish (ARG)', 'Spanish (SPA)', 'Spanish (MEX)', 'Swahili',
  'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu',
  'Uzbek', 'Vietnamese',
]

// --- cliente Supabase -------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ---------------------------------------------------------------------------
//  Componente con la lógica y UI (vive dentro de un <Suspense>)
// ---------------------------------------------------------------------------
function PlantillaEditor() {
  const params = useSearchParams()
  const router = useRouter()
  const nameParam = params.get('name') ?? ''

  const [name, setName] = useState(nameParam)
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ──────────────────── leer plantilla ────────────────────
  useEffect(() => {
    const fetchPlantilla = async () => {
      if (!nameParam) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('plantillas')
          .select('name, category, language')
          .eq('name', nameParam)
          .single()

        if (error) {
          console.error(error)
        } else if (data) {
          setName(data.name)
          setCategory(data.category)
          setLanguage(data.language)
        }
      } finally {
        // se ejecuta siempre, éxito o error
        setLoading(false)
      }
    }

    fetchPlantilla()
  }, [nameParam])

  // ──────────────────── guardar cambios ───────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('plantillas')
      .update({ name, category, language })
      .eq('name', nameParam)

    setSaving(false)

    if (error) {
      console.error(error)
      alert('Error al guardar cambios.')
    } else {
      router.push('/configuracion/whatsapp')
    }
  }

  if (loading) {
    return <div className="p-8">Cargando plantilla…</div>
  }

  // ───────────────────────── UI ───────────────────────────
  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Editar Plantilla</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded shadow"
      >
        {/* nombre ------------------------------------------------ */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* categoría -------------------------------------------- */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value)
            }
            className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="" disabled>
              Seleccionar categoría…
            </option>
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* idioma ----------------------------------------------- */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Idioma
          </label>
          <select
            value={language}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setLanguage(e.target.value)
            }
            className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="" disabled>
              Seleccionar idioma…
            </option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* botones ---------------------------------------------- */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/configuracion/whatsapp')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
//  Página: envuelve el editor en un Suspense (regla Next 15)
// ---------------------------------------------------------------------------
export default function EditarPlantillaPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando plantilla…</div>}>
      <PlantillaEditor />
    </Suspense>
  )
}
