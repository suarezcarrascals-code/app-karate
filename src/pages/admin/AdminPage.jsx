import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { fetchPendingProfiles, approveUser, rejectUser } from '../../lib/auth'

export default function AdminPage() {
  const navigate = useNavigate()
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await fetchPendingProfiles()
      setPendientes(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleAprobar(id) {
    setProcesando(id)
    try {
      await approveUser(id)
      setPendientes((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setProcesando(null)
    }
  }

  async function handleRechazar(id) {
    setProcesando(id)
    try {
      await rejectUser(id)
      setPendientes((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 mb-4 transition-colors">
            <ArrowLeft size={12} />
            Mis torneos
          </button>
          <h1 className="text-xl font-black tracking-tight">Panel de Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Aprobación de nuevos organizadores</p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && pendientes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-400 font-medium">No hay cuentas pendientes</p>
            <p className="text-zinc-600 text-sm mt-1">Todas las solicitudes han sido procesadas</p>
          </div>
        )}

        {pendientes.length > 0 && (
          <div className="space-y-3">
            {pendientes.map((p) => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-100 text-sm">{p.nombre}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{p.email}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {new Date(p.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRechazar(p.id)}
                    disabled={procesando === p.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAprobar(p.id)}
                    disabled={procesando === p.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600 transition-colors disabled:opacity-40"
                  >
                    {procesando === p.id ? '...' : 'Aprobar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
