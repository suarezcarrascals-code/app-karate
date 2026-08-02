import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias, actualizarEstadoCategoria } from '../../lib/categorias'
import { fetchProximoCombate } from '../../lib/combates'

const ESTADO_CONFIG = {
  abierta:    { label: 'Abierta',    color: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
  cerrada:    { label: 'Lista',      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
  en_curso:   { label: 'En curso',   color: 'text-amber-400 bg-amber-950/40 border-amber-800/50' },
  finalizada: { label: 'Finalizada', color: 'text-zinc-600 bg-zinc-900 border-zinc-800' },
}

export default function MesaTatamiPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [link, setLink] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [invalido, setInvalido] = useState(false)
  const [iniciando, setIniciando] = useState(null)

  useEffect(() => {
    async function cargar() {
      const linkData = await fetchLinkMesaByToken(token)
      if (!linkData) { setInvalido(true); setLoading(false); return }
      if (linkData.torneo?.estado !== 'en_curso') { setInvalido(true); setLoading(false); return }
      setLink(linkData)
      const cats = await fetchCategorias(linkData.torneo_id)
      setCategorias(cats.filter((c) => c.tatami_id === linkData.tatami_id)
        .sort((a, b) => (a.orden_en_tatami ?? 999) - (b.orden_en_tatami ?? 999)))
      setLoading(false)
    }
    cargar()
  }, [token])

  async function handleIniciar(cat) {
    setIniciando(cat.id)
    try {
      if (cat.estado === 'cerrada') await actualizarEstadoCategoria(cat.id, 'en_curso')
      navigate(`/mesa/${token}/categoria/${cat.id}`)
    } finally {
      setIniciando(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (invalido) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-zinc-400 font-semibold mb-2">Link inválido o torneo no activo</p>
          <p className="text-zinc-600 text-sm">Pedile al organizador un link nuevo.</p>
        </div>
      </div>
    )
  }

  const accionables = categorias.filter((c) => c.estado === 'cerrada' || c.estado === 'en_curso')
  const finalizadas = categorias.filter((c) => c.estado === 'finalizada')

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 max-w-lg mx-auto">
      <div className="mb-8">
        <p className="text-xs text-zinc-600 mb-1">{link.torneo?.nombre}</p>
        <h1 className="text-2xl font-bold text-zinc-100">{link.tatami?.nombre}</h1>
        <p className="text-sm text-zinc-500 mt-1">Mesa técnica · Seleccioná una categoría</p>
      </div>

      {accionables.length === 0 && finalizadas.length === categorias.length ? (
        <div className="text-center py-16">
          <p className="text-zinc-400 font-semibold mb-1">Todas las categorías finalizadas</p>
          <p className="text-zinc-600 text-sm">Excelente trabajo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categorias.map((cat) => {
            const cfg = ESTADO_CONFIG[cat.estado] ?? ESTADO_CONFIG.abierta
            const puedeIniciar = cat.estado === 'cerrada' || cat.estado === 'en_curso'
            const cargando = iniciando === cat.id

            return (
              <div
                key={cat.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex items-center justify-between gap-4 ${
                  puedeIniciar ? 'border-zinc-700' : 'border-zinc-800 opacity-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100 leading-snug">{cat.nombre}</p>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border mt-1.5 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {puedeIniciar && (
                  <button
                    onClick={() => handleIniciar(cat)}
                    disabled={cargando}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                      cat.estado === 'en_curso'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {cargando ? '...' : cat.estado === 'en_curso' ? 'Continuar' : 'Iniciar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
