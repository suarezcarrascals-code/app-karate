import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import useDojoStore from '../../stores/useDojoStore'
import DojoEmptyState from '../../components/dojos/DojoEmptyState'
import DojoForm from '../../components/dojos/DojoForm'
import DojoCard from '../../components/dojos/DojoCard'

export default function DojosPage() {
  const { id } = useParams()
  const [mostrarForm, setMostrarForm] = useState(false)
  const { dojos, loading, error, fetchDojos, addDojo } = useDojoStore()

  useEffect(() => { fetchDojos(id) }, [id, fetchDojos])

  async function handleAgregar(datos) {
    try {
      await addDojo({ ...datos, torneo_id: id })
      setMostrarForm(false)
    } catch { /* error en store */ }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Dojos</h1>
        {!mostrarForm && (
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors active:scale-95">
            <Plus size={14} weight="bold" />
            Agregar dojo
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="mb-4">
          <DojoForm onSubmit={handleAgregar} onCancel={() => setMostrarForm(false)} loading={loading} />
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

      {!loading && dojos.length === 0 && !mostrarForm && (
        <DojoEmptyState onAgregar={() => setMostrarForm(true)} />
      )}

      {dojos.length > 0 && (
        <div className="grid gap-3">
          {dojos.map((d) => <DojoCard key={d.id} dojo={d} />)}
        </div>
      )}
    </div>
  )
}
