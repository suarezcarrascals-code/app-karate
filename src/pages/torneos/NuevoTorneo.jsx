import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import useTorneoStore from '../../stores/useTorneoStore'
import TorneoForm from '../../components/torneos/TorneoForm'

export default function NuevoTorneo() {
  const navigate = useNavigate()
  const { addTorneo, loading, error } = useTorneoStore()

  async function handleSubmit(datos) {
    try {
      await addTorneo(datos)
      navigate('/')
    } catch {
      // el error ya queda en el store
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a mis torneos
        </button>

        <h1 className="text-xl font-bold text-zinc-100 tracking-tight mb-1">Crear torneo</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Completá los datos del torneo. Podés editarlos después.
        </p>

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <TorneoForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}
