import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTorneoById } from '../../../lib/torneos'
import { fetchCategorias, estaFueraDeRango } from '../../../lib/categorias'
import { calcularEdad } from '../../../lib/competidores'
import useCompetidorStore from '../../../stores/useCompetidorStore'
import CompetidorEmptyState from '../../../components/competidores/CompetidorEmptyState'
import CompetidorForm from '../../../components/competidores/CompetidorForm'
import CompetidorCard from '../../../components/competidores/CompetidorCard'
import FueraDeRangoModal from '../../../components/competidores/FueraDeRangoModal'

export default function CompetidoresPage() {
  const { id: torneoId, catId } = useParams()
  const navigate = useNavigate()

  const [torneo, setTorneo] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [loadingCtx, setLoadingCtx] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pendiente, setPendiente] = useState(null) // datos del form esperando confirmación

  const { competidores, loading, error, fetchCompetidores, addCompetidor } = useCompetidorStore()

  const soloLectura = categoria?.estado !== 'abierta'

  useEffect(() => {
    async function cargar() {
      try {
        const [t, cats] = await Promise.all([
          fetchTorneoById(torneoId),
          fetchCategorias(torneoId),
        ])
        setTorneo(t)
        const cat = cats.find((c) => c.id === catId)
        if (!cat) { navigate(`/torneo/${torneoId}/categorias`); return }
        setCategoria(cat)
      } catch {
        navigate('/')
      } finally {
        setLoadingCtx(false)
      }
    }
    cargar()
    fetchCompetidores(catId)
  }, [torneoId, catId, fetchCompetidores, navigate])

  async function handleFormSubmit(datos) {
    const edad = calcularEdad(datos.fecha_nacimiento)
    const { fueraDeRango, motivos } = estaFueraDeRango(
      { edad, peso: datos.peso },
      categoria
    )

    if (fueraDeRango) {
      setPendiente({ datos, motivos })
      return
    }

    await guardar({ ...datos, inscripcion_manual: false })
  }

  async function handleConfirmarFueraDeRango() {
    await guardar({ ...pendiente.datos, inscripcion_manual: true })
    setPendiente(null)
  }

  async function guardar(datos) {
    try {
      await addCompetidor({ ...datos, torneo_id: torneoId, categoria_id: catId })
      setMostrarForm(false)
    } catch {
      // error en el store
    }
  }

  if (loadingCtx) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/torneo/${torneoId}/categorias`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
        >
          ← {torneo?.nombre} / Categorías
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{categoria?.nombre}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Competidores inscritos</p>
          </div>
          {!soloLectura && !mostrarForm && (
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Inscribir competidor
            </button>
          )}
        </div>

        {mostrarForm && (
          <div className="mb-4">
            <CompetidorForm
              onSubmit={handleFormSubmit}
              onCancel={() => setMostrarForm(false)}
              loading={loading}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {loading && !mostrarForm && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && competidores.length === 0 && !mostrarForm && (
          <CompetidorEmptyState
            soloLectura={soloLectura}
            onInscribir={() => setMostrarForm(true)}
          />
        )}

        {competidores.length > 0 && (
          <div className="grid gap-3">
            {competidores.map((c) => (
              <CompetidorCard key={c.id} competidor={c} torneoEstado={torneo?.estado} />
            ))}
          </div>
        )}
      </div>

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
