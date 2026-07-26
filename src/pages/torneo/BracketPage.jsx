import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowsClockwise } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../lib/torneos'
import { fetchCategorias } from '../../lib/categorias'
import { fetchCompetidores } from '../../lib/competidores'
import useCombateStore from '../../stores/useCombateStore'
import BracketView from '../../components/brackets/BracketView'

export default function BracketPage() {
  const { id: torneoId, catId } = useParams()
  const navigate = useNavigate()

  const [torneo, setTorneo] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [competidores, setCompetidores] = useState([])
  const [loadingCtx, setLoadingCtx] = useState(true)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const { combates, loading, error, fetchCombates, resetBracket, generarBracket, declararGanador } = useCombateStore()

  useEffect(() => {
    async function cargar() {
      try {
        const [t, cats, comps] = await Promise.all([
          fetchTorneoById(torneoId),
          fetchCategorias(torneoId),
          fetchCompetidores(torneoId),
        ])
        setTorneo(t)
        const cat = cats.find((c) => c.id === catId)
        if (!cat) { navigate(`/torneo/${torneoId}/categorias`); return }
        setCategoria(cat)
        setCompetidores(comps.filter((c) => c.inscripciones?.some((i) => i.categoria_id === catId)))
      } catch {
        navigate('/')
      } finally {
        setLoadingCtx(false)
      }
    }
    cargar()
    fetchCombates(catId)
  }, [torneoId, catId, fetchCombates, navigate])

  if (loadingCtx) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendientes = combates.filter((c) => c.estado === 'pendiente').length
  const finalizados = combates.filter((c) => c.estado === 'finalizado').length
  const total = combates.filter((c) => c.estado !== 'bye').length

  async function handleRegenerarBracket() {
    try {
      await resetBracket(catId)
      await generarBracket(catId, categoria.tatami_id, competidores)
      setConfirmRegen(false)
    } catch {
      setConfirmRegen(false)
    }
  }

  return (
    <div className="max-w-full px-4 py-6">
      <button
        onClick={() => navigate(`/torneo/${torneoId}/categorias`)}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 mb-5 transition-colors"
      >
        <ArrowLeft size={13} />
        {torneo?.nombre} / Categorías
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight leading-tight">
            {categoria?.nombre}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Bracket · {competidores.length} competidores
            {total > 0 && ` · ${finalizados}/${total} combates finalizados`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {combates.length > 0 && !confirmRegen && (
            <button
              onClick={() => setConfirmRegen(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowsClockwise size={12} />
              Regenerar
            </button>
          )}
          {confirmRegen && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400">¿Borrar y regenerar bracket?</span>
              <button
                onClick={handleRegenerarBracket}
                disabled={loading}
                className="text-xs bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmRegen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
            categoria?.estado === 'cerrada'
              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
              : categoria?.estado === 'en_curso'
              ? 'bg-orange-950/50 text-orange-400 border-orange-900/50'
              : 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50'
          }`}>
            {categoria?.estado}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && combates.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && combates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-400 font-medium mb-1">No hay bracket generado</p>
          <p className="text-zinc-600 text-sm">
            Cerrá las inscripciones desde la página de Categorías para generar el bracket.
          </p>
        </div>
      )}

      {combates.length > 0 && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <BracketView
            combates={combates}
            competidores={competidores}
            onDeclararGanador={(combateId, ganadorId) => declararGanador(combateId, ganadorId, catId)}
          />
        </div>
      )}
    </div>
  )
}
