import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../lib/torneos'
import { fetchCategorias } from '../../lib/categorias'
import { fetchDojos } from '../../lib/dojos'
import useCompetidorStore from '../../stores/useCompetidorStore'
import CompetidorEmptyState from '../../components/competidores/CompetidorEmptyState'
import CompetidorForm from '../../components/competidores/CompetidorForm'
import CompetidorCard from '../../components/competidores/CompetidorCard'
import FueraDeRangoModal from '../../components/competidores/FueraDeRangoModal'

export default function CompetidoresPage() {
  const { id: torneoId } = useParams()
  const navigate = useNavigate()

  const [torneo, setTorneo] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [dojos, setDojos] = useState([])
  const [loadingCtx, setLoadingCtx] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pendiente, setPendiente] = useState(null)

  const { competidores, loading, error, fetchCompetidores, addCompetidores } = useCompetidorStore()

  useEffect(() => {
    async function cargar() {
      try {
        const [t, cats, djs] = await Promise.all([fetchTorneoById(torneoId), fetchCategorias(torneoId), fetchDojos(torneoId)])
        setTorneo(t)
        setCategorias(cats)
        setDojos(djs)
      } catch { navigate('/') }
      finally { setLoadingCtx(false) }
    }
    cargar()
    fetchCompetidores(torneoId)
  }, [torneoId, fetchCompetidores, navigate])

  async function handleFormSubmit({ datosBase, categoriasSeleccionadas, fueraDeRango }) {
    if (fueraDeRango.length > 0) {
      const motivos = fueraDeRango.map((c) => `${c.nombre} (${c.modalidad.replace('_', ' ')})`)
      setPendiente({ datosBase, categoriasSeleccionadas, motivos })
      return
    }
    await guardar(datosBase, categoriasSeleccionadas, false)
  }

  async function handleConfirmarFueraDeRango() {
    await guardar(pendiente.datosBase, pendiente.categoriasSeleccionadas, true)
    setPendiente(null)
  }

  async function guardar(datosBase, cats, inscripcionManual) {
    try {
      await addCompetidores({ ...datosBase, torneo_id: torneoId }, cats, inscripcionManual)
      setMostrarForm(false)
    } catch { /* error en store */ }
  }

  if (loadingCtx) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Competidores</h1>
          <p className="text-xs text-zinc-600 mt-0.5">{competidores.length} inscriptos</p>
        </div>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors active:scale-95">
            <Plus size={14} weight="bold" />
            Inscribir
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="mb-4">
          <CompetidorForm
            onSubmit={handleFormSubmit}
            onCancel={() => setMostrarForm(false)}
            loading={loading}
            categorias={categorias}
            dojos={dojos}
          />
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

      {!loading && competidores.length === 0 && !mostrarForm && (
        <CompetidorEmptyState onInscribir={() => setMostrarForm(true)} />
      )}

      {competidores.length > 0 && (
        <div className="grid gap-3">
          {competidores.map((c) => (
            <CompetidorCard key={c.id} competidor={c} torneoEstado={torneo?.estado} categorias={categorias} />
          ))}
        </div>
      )}

      {pendiente && (
        <FueraDeRangoModal
          motivos={pendiente.motivos}
          onConfirmar={handleConfirmarFueraDeRango}
          onCancelar={() => setPendiente(null)}
        />
      )}
    </div>
  )
}
