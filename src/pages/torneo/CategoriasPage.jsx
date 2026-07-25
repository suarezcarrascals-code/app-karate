import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ListChecks, CheckSquare, X } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../lib/torneos'
import useCategoriaStore from '../../stores/useCategoriaStore'
import useTatamiStore from '../../stores/useTatamiStore'
import useCompetidorStore from '../../stores/useCompetidorStore'
import CategoriaEmptyState from '../../components/categorias/CategoriaEmptyState'
import CategoriaForm from '../../components/categorias/CategoriaForm'
import CategoriaCard from '../../components/categorias/CategoriaCard'
import CategoriasWKFSelector from '../../components/categorias/CategoriasWKFSelector'
import AsignarTatamiLoteModal from '../../components/categorias/AsignarTatamiLoteModal'

const GRUPOS = [
  {
    modalidad: 'kumite_individual',
    label: 'Kumite Individual',
    color: 'text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-900/40',
  },
  {
    modalidad: 'kumite_equipo',
    label: 'Kumite Equipo',
    color: 'text-orange-400',
    dot: 'bg-orange-500',
    border: 'border-orange-900/40',
  },
  {
    modalidad: 'kata_individual',
    label: 'Kata Individual',
    color: 'text-sky-400',
    dot: 'bg-sky-500',
    border: 'border-sky-900/40',
  },
  {
    modalidad: 'kata_equipo',
    label: 'Kata Equipo',
    color: 'text-cyan-400',
    dot: 'bg-cyan-500',
    border: 'border-cyan-900/40',
  },
]

export default function CategoriasPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [torneo, setTorneo] = useState(null)
  const [loadingTorneo, setLoadingTorneo] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarWKF, setMostrarWKF] = useState(false)

  const { categorias, loading, error, fetchCategorias, addCategoria, addCategoriasBulk, asignarTatamiLote } = useCategoriaStore()
  const { tatamis, fetchTatamis } = useTatamiStore()
  const { competidores, fetchCompetidores } = useCompetidorStore()

  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccionadas, setSeleccionadas] = useState(new Set())
  const [mostrarLote, setMostrarLote] = useState(false)
  const [loadingLote, setLoadingLote] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        const t = await fetchTorneoById(id)
        setTorneo(t)
      } catch { navigate('/') }
      finally { setLoadingTorneo(false) }
    }
    cargar()
    fetchCategorias(id)
    fetchTatamis(id)
    fetchCompetidores(id)
  }, [id, fetchCategorias, fetchTatamis, fetchCompetidores, navigate])

  function toggleSeleccion(catId) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  function salirModoSeleccion() {
    setModoSeleccion(false)
    setSeleccionadas(new Set())
  }

  async function handleAsignarLote(tatamiId, items) {
    setLoadingLote(true)
    try {
      await asignarTatamiLote(tatamiId, items)
      setMostrarLote(false)
      salirModoSeleccion()
    } catch { /* error en store */ }
    finally { setLoadingLote(false) }
  }

  async function handleCrear(datos) {
    try {
      await addCategoria({ ...datos, torneo_id: id })
      setMostrarForm(false)
    } catch { /* error en store */ }
  }

  async function handleImportarWKF(cats) {
    try {
      await addCategoriasBulk(id, cats)
      setMostrarWKF(false)
    } catch { /* error en store */ }
  }

  if (loadingTorneo) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Agrupar categorías por modalidad, solo los grupos con al menos 1 categoría
  const grupos = GRUPOS.map((g) => ({
    ...g,
    items: categorias.filter((c) => c.modalidad === g.modalidad),
  })).filter((g) => g.items.length > 0)

  // Categorías con modalidad desconocida (por si acaso)
  const otrasModalidades = categorias.filter(
    (c) => !GRUPOS.some((g) => g.modalidad === c.modalidad)
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(`/torneo/${id}`)}
        className="text-xs text-zinc-600 hover:text-zinc-400 mb-5 flex items-center gap-1 transition-colors">
        ← {torneo?.nombre}
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Categorías</h1>
          {categorias.length > 0 && (
            <p className="text-xs text-zinc-600 mt-0.5">{categorias.length} en total</p>
          )}
        </div>
        {!mostrarForm && (
          <div className="flex items-center gap-2">
            {categorias.length > 0 && !modoSeleccion && (
              <button
                onClick={() => setModoSeleccion(true)}
                className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:text-zinc-200 transition-colors border border-zinc-700"
              >
                <CheckSquare size={14} />
                Seleccionar
              </button>
            )}
            {modoSeleccion && (
              <button
                onClick={salirModoSeleccion}
                className="flex items-center gap-1.5 bg-zinc-800 text-zinc-400 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                <X size={14} />
                Cancelar
              </button>
            )}
            {!modoSeleccion && (
              <>
                <button
                  onClick={() => setMostrarWKF(true)}
                  className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  <ListChecks size={14} />
                  Importar WKF
                </button>
                <button onClick={() => setMostrarForm(true)}
                  className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors active:scale-95">
                  <Plus size={14} weight="bold" />
                  Crear categoría
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {mostrarWKF && (
        <CategoriasWKFSelector
          torneoId={id}
          categoriasExistentes={categorias}
          onImportar={handleImportarWKF}
          onCancel={() => setMostrarWKF(false)}
          loading={loading}
        />
      )}

      {mostrarForm && (
        <div className="mb-6">
          <CategoriaForm onSubmit={handleCrear} onCancel={() => setMostrarForm(false)} loading={loading} />
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      {loading && !mostrarForm && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && categorias.length === 0 && !mostrarForm && (
        <CategoriaEmptyState onCrear={() => setMostrarForm(true)} />
      )}

      {/* Grupos por modalidad */}
      {grupos.length > 0 && (
        <div className="space-y-8">
          {grupos.map((grupo) => (
            <div key={grupo.modalidad}>
              {/* Encabezado de grupo */}
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${grupo.border}`}>
                <span className={`w-2 h-2 rounded-full ${grupo.dot} shrink-0`} />
                <h2 className={`text-xs font-bold uppercase tracking-widest ${grupo.color}`}>
                  {grupo.label}
                </h2>
                <span className="text-xs text-zinc-600">
                  {grupo.items.length} categoría{grupo.items.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setModoSeleccion(true)
                    setSeleccionadas((prev) => {
                      const next = new Set(prev)
                      grupo.items.forEach((cat) => next.add(cat.id))
                      return next
                    })
                  }}
                  className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${grupo.color} hover:bg-zinc-800`}
                >
                  Seleccionar todas
                </button>
              </div>

              {/* Cards del grupo */}
              <div className="grid gap-3">
                {grupo.items.map((cat) => (
                  <CategoriaCard
                    key={cat.id}
                    categoria={cat}
                    competidoresTorneo={competidores}
                    seleccionada={seleccionadas.has(cat.id)}
                    onToggleSeleccion={modoSeleccion ? toggleSeleccion : null}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Otras modalidades no reconocidas */}
          {otrasModalidades.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Otras</h2>
              </div>
              <div className="grid gap-3">
                {otrasModalidades.map((cat) => (
                  <CategoriaCard
                    key={cat.id}
                    categoria={cat}
                    competidoresTorneo={competidores}
                    seleccionada={seleccionadas.has(cat.id)}
                    onToggleSeleccion={modoSeleccion ? toggleSeleccion : null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra flotante de selección */}
      {modoSeleccion && seleccionadas.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 z-30">
          <span className="text-sm font-medium text-zinc-200">
            {seleccionadas.size} categoría{seleccionadas.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setMostrarLote(true)}
            className="bg-rose-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-rose-500 transition-colors active:scale-95"
          >
            Asignar tatami
          </button>
          <button onClick={salirModoSeleccion} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {mostrarLote && (
        <AsignarTatamiLoteModal
          categorias={categorias.filter((c) => seleccionadas.has(c.id))}
          tatamis={tatamis}
          onConfirmar={handleAsignarLote}
          onCancel={() => setMostrarLote(false)}
          loading={loadingLote}
        />
      )}
    </div>
  )
}
