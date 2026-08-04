import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../lib/torneos'
import { fetchCategorias } from '../../lib/categorias'
import { fetchCompetidores } from '../../lib/competidores'
import { fetchCombates } from '../../lib/combates'
import BracketView from '../../components/brackets/BracketView'

function derivarPodio(combates, competidores) {
  if (!combates || combates.length === 0) return null

  const mainCombates = combates.filter((c) => c.orden_en_ronda > 0 && c.estado !== 'bye')
  if (mainCombates.length === 0) return null

  const maxRonda = Math.max(...mainCombates.map((c) => c.ronda))
  const finalCombate = mainCombates.find((c) => c.ronda === maxRonda)
  const tercerPuestoCombate = combates.find((c) => c.orden_en_ronda === 0)

  if (!finalCombate?.ganador_id) return null

  const findComp = (id) => competidores.find((c) => c.id === id) ?? null

  const primero = findComp(finalCombate.ganador_id)
  const segundoId = finalCombate.ganador_id === finalCombate.competidor_rojo_id
    ? finalCombate.competidor_azul_id
    : finalCombate.competidor_rojo_id
  const segundo = findComp(segundoId)
  const tercero = tercerPuestoCombate?.ganador_id ? findComp(tercerPuestoCombate.ganador_id) : null

  return { primero, segundo, tercero }
}

function NombreComp({ comp }) {
  if (!comp) return <span className="text-zinc-600 italic">—</span>
  return (
    <span>
      <span className="font-black text-zinc-100">{comp.nombre} {comp.apellido}</span>
      {comp.dojo?.nombre && (
        <span className="ml-2 text-sm text-zinc-500">{comp.dojo.nombre}</span>
      )}
    </span>
  )
}

export default function CategoriaPublicoPage() {
  const { id, catId } = useParams()
  const navigate = useNavigate()

  const [torneo, setTorneo] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combates, setCombates] = useState([])
  const [competidores, setCompetidores] = useState([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)

  const intervalRef = useRef(null)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  useEffect(() => {
    async function cargar() {
      const [torneoData, catData, compData, combateData] = await Promise.all([
        fetchTorneoById(id),
        fetchCategorias(id),
        fetchCompetidores(id),
        fetchCombates(catId),
      ])

      setTorneo(torneoData)
      const cat = catData.find((c) => c.id === catId) ?? null
      setCategoria(cat)
      setCompetidores(compData)
      setCombates(combateData)
      setLoading(false)
    }
    cargar()
  }, [id, catId])

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const data = await fetchCombates(catId)
        setCombates(data)
      } catch {
        // silently ignore poll errors
      }
    }, 3000)
    return () => clearInterval(intervalRef.current)
  }, [catId])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const finalizada = categoria?.estado === 'finalizada'
  const podio = finalizada ? derivarPodio(combates, competidores) : null

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
        <button
          onClick={() => navigate(`/torneo/${id}/publico`)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-bold text-zinc-100 truncate">{categoria?.nombre}</p>
          {torneo?.nombre && (
            <p className="text-xs text-zinc-600 truncate">{torneo.nombre}</p>
          )}
        </div>
        <span className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {/* Podio (si la categoría está finalizada) */}
      {podio && (
        <div className="px-5 pt-6 pb-2 max-w-2xl mx-auto w-full">
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Podio</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-amber-950/20 border border-amber-800/40 rounded-2xl px-5 py-4">
              <span className="text-2xl">🥇</span>
              <NombreComp comp={podio.primero} />
            </div>
            {podio.segundo && (
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3">
                <span className="text-2xl">🥈</span>
                <NombreComp comp={podio.segundo} />
              </div>
            )}
            {podio.tercero && (
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3">
                <span className="text-2xl">🥉</span>
                <NombreComp comp={podio.tercero} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="flex-1 px-4 py-5">
        {combates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No hay bracket generado para esta categoría.</p>
          </div>
        ) : (
          <>
            {!finalizada && (
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 px-1">Bracket</p>
            )}
            {finalizada && podio && (
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 mt-2 px-1">Bracket</p>
            )}
            <BracketView
              combates={combates}
              competidores={competidores}
              onDeclararGanador={null}
            />
          </>
        )}
      </div>

      {/* Indicador offline */}
      {!online && (
        <div className="fixed bottom-4 right-4 flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-500 font-semibold">Sin conexión</span>
        </div>
      )}
    </div>
  )
}
