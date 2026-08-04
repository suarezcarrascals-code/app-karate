import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchTorneoById } from '../../lib/torneos'
import { fetchTatamis } from '../../lib/tatamis'
import { fetchCategorias } from '../../lib/categorias'
import { fetchCompetidores } from '../../lib/competidores'
import { fetchCombatesByCategoriasIds } from '../../lib/combates'

const ESTADO_BADGE = {
  abierta:    { label: 'Abierta',    color: 'text-zinc-500 bg-zinc-800' },
  cerrada:    { label: 'Lista',      color: 'text-emerald-400 bg-emerald-950/50' },
  en_curso:   { label: 'En curso',   color: 'text-amber-400 bg-amber-950/50' },
  finalizada: { label: 'Finalizada', color: 'text-zinc-600 bg-zinc-900' },
}

function inferirFaseKata(combate) {
  if (!combate) return null
  if (combate.j1_azul != null) return 'Evaluando resultado'
  if (combate.j1_rojo != null) return 'AO actuando'
  return 'En anuncio'
}

function TarjetaCombateActivo({ combate, categoria, competidoresMap, torneoId, navigate }) {
  const rojo = competidoresMap[combate?.competidor_rojo_id]
  const azul = competidoresMap[combate?.competidor_azul_id]
  const esKumite = categoria?.modalidad?.includes('kumite')
  const faseKata = esKumite ? null : inferirFaseKata(combate)

  return (
    <button
      onClick={() => navigate(`/torneo/${torneoId}/publico/categoria/${categoria.id}`)}
      className="w-full text-left bg-zinc-900 border border-amber-800/50 rounded-2xl p-5 hover:border-amber-700/70 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">{categoria?.nombre}</p>
        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full font-semibold">
          En curso
        </span>
      </div>

      {esKumite ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-rose-300 truncate">{rojo ? `${rojo.nombre} ${rojo.apellido}` : '—'}</p>
            {rojo?.dojo?.nombre && <p className="text-xs text-zinc-600 truncate">{rojo.dojo.nombre}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-5xl font-black tabular-nums text-rose-400 leading-none">
              {combate?.puntos_rojo ?? 0}
            </span>
            <span className="text-2xl text-zinc-700 font-bold">—</span>
            <span className="text-5xl font-black tabular-nums text-sky-400 leading-none">
              {combate?.puntos_azul ?? 0}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-base font-bold text-sky-300 truncate">{azul ? `${azul.nombre} ${azul.apellido}` : '—'}</p>
            {azul?.dojo?.nombre && <p className="text-xs text-zinc-600 truncate">{azul.dojo.nombre}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <p className="text-base font-bold text-zinc-100 truncate">{rojo ? `${rojo.nombre} ${rojo.apellido}` : '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
              <p className="text-base font-bold text-zinc-100 truncate">{azul ? `${azul.nombre} ${azul.apellido}` : '—'}</p>
            </div>
          </div>
          {faseKata && (
            <span className="shrink-0 text-xs font-semibold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-xl">
              {faseKata}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

export default function TorneoPublicoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [torneo, setTorneo] = useState(null)
  const [tatamis, setTatamis] = useState([])
  const [categorias, setCategorias] = useState([])
  const [competidoresMap, setCompetidoresMap] = useState({})
  const [combatesActivos, setCombatesActivos] = useState([])
  const [filtroTatami, setFiltroTatami] = useState(searchParams.get('tatami') ?? null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)

  const catIdsRef = useRef([])
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
      const [torneoData, tatamiData, catData, compData] = await Promise.all([
        fetchTorneoById(id),
        fetchTatamis(id),
        fetchCategorias(id),
        fetchCompetidores(id),
      ])

      setTorneo(torneoData)
      setTatamis(tatamiData)
      setCategorias(catData)

      const mapa = {}
      compData.forEach((c) => { mapa[c.id] = c })
      setCompetidoresMap(mapa)

      const catIds = catData.map((c) => c.id)
      catIdsRef.current = catIds

      const activos = await fetchCombatesByCategoriasIds(catIds)
      setCombatesActivos(activos)
      setLoading(false)
    }
    cargar()
  }, [id])

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (catIdsRef.current.length === 0) return
      try {
        const activos = await fetchCombatesByCategoriasIds(catIdsRef.current)
        setCombatesActivos(activos)
      } catch {
        // silently ignore poll errors — keep last data
      }
    }, 2000)
    return () => clearInterval(intervalRef.current)
  }, [])

  function handleFiltroTatami(tatamiId) {
    const nuevo = tatamiId === filtroTatami ? null : tatamiId
    setFiltroTatami(nuevo)
    if (nuevo) {
      setSearchParams({ tatami: nuevo })
    } else {
      setSearchParams({})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!torneo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <p className="text-zinc-500">Torneo no encontrado.</p>
      </div>
    )
  }

  const noDisponible = torneo.estado === 'borrador' || torneo.estado === 'inscripciones'

  const tatamisFiltrados = filtroTatami
    ? tatamis.filter((t) => t.id === filtroTatami)
    : tatamis

  function getCategoriasPorTatami(tatamiId) {
    return categorias.filter((c) => c.tatami_id === tatamiId)
  }

  function getCombateActivoPorCategoria(catId) {
    return combatesActivos.find((c) => c.categoria_id === catId) ?? null
  }

  function formatFecha(fecha) {
    if (!fecha) return ''
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-16">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-zinc-900">
        <h1 className="text-2xl font-black text-zinc-100 leading-tight">{torneo.nombre}</h1>
        {(torneo.lugar || torneo.fecha_inicio) && (
          <p className="text-sm text-zinc-500 mt-1">
            {[torneo.lugar, formatFecha(torneo.fecha_inicio)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {noDisponible ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-lg font-semibold text-zinc-400 mb-1">La competencia aún no ha comenzado</p>
            <p className="text-sm text-zinc-600">Los resultados estarán disponibles cuando inicie la competencia.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Chips de filtro por tatami */}
          {tatamis.length > 1 && (
            <div className="flex gap-2 px-5 py-4 overflow-x-auto scrollbar-none border-b border-zinc-900">
              <button
                onClick={() => handleFiltroTatami(null)}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-colors ${
                  !filtroTatami
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Todos
              </button>
              {tatamis.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleFiltroTatami(t.id)}
                  className={`shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-colors ${
                    filtroTatami === t.id
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Contenido por tatami */}
          <div className="flex-1 px-5 py-5 space-y-8 max-w-2xl mx-auto w-full">
            {tatamisFiltrados.length === 0 && (
              <div className="text-center py-16">
                <p className="text-zinc-600 text-sm">No hay tatamis disponibles.</p>
              </div>
            )}

            {tatamisFiltrados.map((tatami) => {
              const cats = getCategoriasPorTatami(tatami.id)
              const catEnCurso = cats.find((c) => c.estado === 'en_curso')
              const combateActivo = catEnCurso ? getCombateActivoPorCategoria(catEnCurso.id) : null
              const otrosCats = cats.filter((c) => c.id !== catEnCurso?.id)

              return (
                <div key={tatami.id}>
                  <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                    {tatami.nombre}
                  </h2>

                  {catEnCurso && combateActivo ? (
                    <TarjetaCombateActivo
                      combate={combateActivo}
                      categoria={catEnCurso}
                      competidoresMap={competidoresMap}
                      torneoId={id}
                      navigate={navigate}
                    />
                  ) : catEnCurso ? (
                    <button
                      onClick={() => navigate(`/torneo/${id}/publico/categoria/${catEnCurso.id}`)}
                      className="w-full text-left bg-zinc-900 border border-amber-800/40 rounded-2xl p-4 hover:border-amber-700/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-200">{catEnCurso.nombre}</p>
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full font-semibold">
                          En curso
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                      <p className="text-sm text-zinc-600 italic">En espera</p>
                    </div>
                  )}

                  {otrosCats.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {otrosCats.map((cat) => {
                        const cfg = ESTADO_BADGE[cat.estado] ?? ESTADO_BADGE.abierta
                        return (
                          <button
                            key={cat.id}
                            onClick={() => navigate(`/torneo/${id}/publico/categoria/${cat.id}`)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition-colors text-left"
                          >
                            <p className="text-sm text-zinc-400 truncate">{cat.nombre}</p>
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Indicador online/offline */}
      <div className="fixed bottom-4 right-4 flex items-center gap-1.5 text-xs text-zinc-600">
        <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        {!online && <span className="text-red-500 font-semibold">Sin conexión</span>}
      </div>
    </div>
  )
}
