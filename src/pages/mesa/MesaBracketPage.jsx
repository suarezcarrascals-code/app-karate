import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TelevisionSimple, Play, Trophy } from '@phosphor-icons/react'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias, actualizarEstadoCategoria } from '../../lib/categorias'
import { fetchCombates } from '../../lib/combates'
import { fetchCompetidores } from '../../lib/competidores'

const ESTADO_STYLE = {
  pendiente: 'text-zinc-500 border-zinc-700 bg-zinc-900',
  en_curso:  'text-amber-400 border-amber-800/60 bg-amber-950/30',
  finalizado:'text-emerald-500 border-emerald-900/50 bg-emerald-950/20',
  bye:       'text-zinc-700 border-zinc-800 bg-zinc-900/50',
}

export default function MesaBracketPage() {
  const { token, catId } = useParams()
  const navigate = useNavigate()

  const [link, setLink] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combates, setCombates] = useState([])
  const [comps, setComps] = useState({})
  const [loading, setLoading] = useState(true)
  const [finalizando, setFinalizando] = useState(false)

  const cargar = useCallback(async () => {
    const linkData = await fetchLinkMesaByToken(token)
    if (!linkData) { navigate('/'); return }
    setLink(linkData)

    const [cats, competidores, lista] = await Promise.all([
      fetchCategorias(linkData.torneo_id),
      fetchCompetidores(linkData.torneo_id),
      fetchCombates(catId),
    ])

    const cat = cats.find((c) => c.id === catId)
    if (!cat) { navigate(`/mesa/${token}`); return }
    setCategoria(cat)

    const mapaComps = {}
    competidores.forEach((c) => { mapaComps[c.id] = c })
    setComps(mapaComps)
    setCombates(lista)
    setLoading(false)
  }, [token, catId, navigate])

  useEffect(() => { cargar() }, [cargar])

  function nombreComp(id) {
    if (!id) return <span className="text-zinc-700 italic">Por definir</span>
    const c = comps[id]
    return c ? `${c.nombre} ${c.apellido}` : '?'
  }

  // Agrupar por ronda (excluye byes del display, pero los 3er puesto sí)
  const visibles = combates.filter((c) => c.estado !== 'bye')
  const maxRonda = visibles.length > 0 ? Math.max(...visibles.map((c) => c.ronda)) : 0

  function labelRonda(ronda, esTercero) {
    if (esTercero) return '3er Puesto'
    if (ronda === maxRonda) return 'Final'
    if (ronda === maxRonda - 1 && maxRonda > 1) return 'Semifinal'
    return `Ronda ${ronda}`
  }

  // Separar el combate de 3er puesto del resto
  const principalPorRonda = {}
  let tercerPuesto = null
  for (const c of visibles) {
    if (c.orden_en_ronda === 0) { tercerPuesto = c; continue }
    if (!principalPorRonda[c.ronda]) principalPorRonda[c.ronda] = []
    principalPorRonda[c.ronda].push(c)
  }
  const rondas = Object.keys(principalPorRonda).map(Number).sort((a, b) => a - b)

  const todasFinalizadas = visibles.length > 0 && visibles.every((c) => c.estado === 'finalizado')

  async function handleFinalizar() {
    setFinalizando(true)
    try {
      await actualizarEstadoCategoria(catId, 'finalizada')
      navigate(`/mesa/${token}`)
    } finally {
      setFinalizando(false)
    }
  }

  function CombateRow({ combate, esTercero = false }) {
    const rojo = comps[combate.competidor_rojo_id]
    const azul = comps[combate.competidor_azul_id]
    const ganador = combate.ganador_id
    const puedeOperar = combate.estado === 'pendiente' || combate.estado === 'en_curso'
    const ambosDefinidos = combate.competidor_rojo_id && combate.competidor_azul_id
    const esEnCurso = combate.estado === 'en_curso'

    return (
      <div className={`rounded-xl border p-3.5 transition-colors ${ESTADO_STYLE[combate.estado] || ESTADO_STYLE.pendiente}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Rojo */}
            <div className={`flex items-center gap-2 ${ganador === combate.competidor_rojo_id ? 'font-bold text-white' : 'text-zinc-400'}`}>
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-sm truncate">{nombreComp(combate.competidor_rojo_id)}</span>
              {ganador === combate.competidor_rojo_id && (
                <Trophy size={12} className="text-amber-400 shrink-0" />
              )}
            </div>
            {/* Azul */}
            <div className={`flex items-center gap-2 ${ganador === combate.competidor_azul_id ? 'font-bold text-white' : 'text-zinc-400'}`}>
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
              <span className="text-sm truncate">{nombreComp(combate.competidor_azul_id)}</span>
              {ganador === combate.competidor_azul_id && (
                <Trophy size={12} className="text-amber-400 shrink-0" />
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            {esEnCurso && (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
                En curso
              </span>
            )}
            {puedeOperar && ambosDefinidos && (
              <button
                onClick={() => navigate(`/mesa/${token}/categoria/${catId}/combate/${combate.id}`)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                  esEnCurso
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                <Play size={11} weight="fill" />
                {esEnCurso ? 'Continuar' : 'Operar'}
              </button>
            )}
            {!ambosDefinidos && combate.estado === 'pendiente' && (
              <span className="text-[10px] text-zinc-700">Esperando</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
        <button
          onClick={() => navigate(`/mesa/${token}`)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <ArrowLeft size={13} />
          {link?.tatami?.nombre}
        </button>
        <p className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{categoria?.nombre}</p>
        <button
          onClick={() => window.open(`/mesa/${token}/categoria/${catId}/tv`, '_blank')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <TelevisionSimple size={13} />
          TV
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-6">
        {combates.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">
            No hay combates generados para esta categoría.
          </div>
        )}

        {rondas.map((ronda) => (
          <div key={ronda}>
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
              {labelRonda(ronda, false)}
            </p>
            <div className="space-y-2">
              {principalPorRonda[ronda]
                .sort((a, b) => a.orden_en_ronda - b.orden_en_ronda)
                .map((c) => <CombateRow key={c.id} combate={c} />)}
            </div>
          </div>
        ))}

        {tercerPuesto && (
          <div>
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
              3er Puesto
            </p>
            <CombateRow combate={tercerPuesto} esTercero />
          </div>
        )}

        {todasFinalizadas && categoria?.estado !== 'finalizada' && (
          <button
            onClick={handleFinalizar}
            disabled={finalizando}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 mt-4"
          >
            {finalizando ? 'Guardando...' : 'Finalizar categoría'}
          </button>
        )}

        {categoria?.estado === 'finalizada' && (
          <div className="text-center py-4">
            <span className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">
              Categoría finalizada
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
