import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UploadSimple, LockSimple } from '@phosphor-icons/react'
import { fetchLinkByToken } from '../lib/links'
import { fetchCategorias } from '../lib/categorias'
import { insertCompetidorPorLink, fetchCompetidoresPorLink } from '../lib/competidores'
import AtletaForm from '../components/inscripcion/AtletaForm'
import AtletaInscritoCard from '../components/inscripcion/AtletaInscritoCard'
import CategoriaDisplay from '../components/inscripcion/CategoriaDisplay'
import GlosarioTerminos from '../components/inscripcion/GlosarioTerminos'
import ImportarCSVModal from '../components/inscripcion/ImportarCSVModal'

export default function InscripcionPublica() {
  const { token } = useParams()

  const [link, setLink] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [atletas, setAtletas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [error, setError] = useState(null)
  const [linkInvalido, setLinkInvalido] = useState(false)
  const [mostrarCSV, setMostrarCSV] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        const linkData = await fetchLinkByToken(token)
        if (!linkData) { setLinkInvalido(true); setLoading(false); return }

        setLink(linkData)

        const [cats, inscritos] = await Promise.all([
          fetchCategorias(linkData.torneo_id),
          fetchCompetidoresPorLink(linkData.id),
        ])
        setCategorias(cats.filter((c) => c.estado === 'abierta'))
        setAtletas(inscritos)
      } catch (err) {
        setError('No se pudo cargar la información. Intentá de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [token])

  async function handleImportarCSV(nuevosAtletas) {
    setLoadingAdd(true)
    setError(null)
    try {
      const nuevos = await Promise.all(
        nuevosAtletas.map((a) => {
          const categoria = categorias.find((c) => c.id === a.categoria_id)
          return insertCompetidorPorLink(
            { ...a, torneo_id: link.torneo_id, dojo_id: link.dojo_id, modalidad: categoria?.modalidad ?? null },
            link.id
          )
        })
      )
      setAtletas((prev) => [...prev, ...nuevos])
      setMostrarCSV(false)
    } catch (err) {
      setError(err.message || 'Error al importar. Intentá de nuevo.')
    } finally {
      setLoadingAdd(false)
    }
  }

  async function handleAgregar(datos) {
    setLoadingAdd(true)
    setError(null)
    try {
      const ids = datos.categoria_ids ?? (datos.categoria_id ? [datos.categoria_id] : [])
      const primeraCategoria = categorias.find((c) => c.id === ids[0])
      const nuevo = await insertCompetidorPorLink(
        {
          ...datos,
          torneo_id: link.torneo_id,
          dojo_id: link.dojo_id,
          modalidad: primeraCategoria?.modalidad ?? null,
          categoria_ids: ids,
        },
        link.id
      )
      setAtletas((prev) => [...prev, nuevo])
    } catch (err) {
      setError(err.message || 'Error al guardar el atleta. Intentá de nuevo.')
    } finally {
      setLoadingAdd(false)
    }
  }

  // Link inválido o inactivo
  if (!loading && linkInvalido) {
    return (
      <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
            <LockSimple size={26} className="text-zinc-500" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight mb-2">Link no disponible</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Este link ya no está activo o no existe. Contactá al organizador del torneo.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgb(225 29 72 / 0.06), transparent)' }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="flex gap-5 items-start">

          {/* LEFT — contenido principal */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-b from-rose-600 to-rose-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black">K</span>
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest truncate">
                  {link.torneo?.nombre}
                </p>
              </div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
                {link.dojo?.nombre}
              </h1>

            </div>

            {/* Formulario */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-zinc-300">Agregar atleta</p>
                <button
                  onClick={() => setMostrarCSV(true)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <UploadSimple size={13} />
                  Importar CSV
                </button>
              </div>
              <AtletaForm
                categorias={categorias}
                onAgregar={handleAgregar}
                loading={loadingAdd}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Lista de atletas inscritos */}
            {atletas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  Atletas inscritos
                </p>
                <div className="space-y-2">
                  {atletas.map((a, i) => (
                    <AtletaInscritoCard key={a.id} atleta={a} numero={i + 1} />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT — sidebar sticky */}
          <div className="w-80 shrink-0 sticky top-4 self-start">
            <div className="max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 pb-4">
              <GlosarioTerminos />
              <CategoriaDisplay categorias={categorias} />
            </div>
          </div>

        </div>

        {mostrarCSV && (
          <ImportarCSVModal
            categorias={categorias}
            onConfirmar={handleImportarCSV}
            onCancel={() => setMostrarCSV(false)}
            loading={loadingAdd}
          />
        )}
      </div>
    </div>
  )
}
