import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShieldCheck, SignOut } from '@phosphor-icons/react'
import useTorneoStore from '../../stores/useTorneoStore'
import useAuthStore from '../../stores/useAuthStore'
import TorneoCard from '../../components/torneos/TorneoCard'
import EmptyState from '../../components/torneos/EmptyState'

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-zinc-800" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-800 rounded w-2/5" />
          <div className="h-3 bg-zinc-800/70 rounded w-1/4" />
        </div>
        <div className="h-6 w-24 bg-zinc-800 rounded-full" />
      </div>
      <div className="h-3 bg-zinc-800/70 rounded w-1/3 mt-4" />
    </div>
  )
}

export default function TorneosPage() {
  const navigate = useNavigate()
  const { torneos, loading, error, fetchTorneos } = useTorneoStore()
  const { profile, signOut } = useAuthStore()

  useEffect(() => {
    fetchTorneos()
  }, [fetchTorneos])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950">
      {/* Topbar */}
      <header className="border-b border-zinc-900 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 flex items-center justify-center">
              <span className="text-white text-xs font-black">K</span>
            </div>
            <span className="font-bold text-zinc-100 text-sm tracking-tight">Karate App</span>
          </div>
          <div className="flex items-center gap-1">
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-zinc-900 transition-colors"
              >
                <ShieldCheck size={14} />
                Admin
              </Link>
            )}
            <span className="text-xs text-zinc-600 px-2 hidden sm:inline truncate max-w-40">
              {profile?.nombre || profile?.email}
            </span>
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <SignOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Mis torneos</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {loading
                ? 'Cargando...'
                : torneos.length === 0
                ? 'Todavía no creaste ninguno'
                : `${torneos.length} torneo${torneos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/torneos/nuevo"
            className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-500 transition-all active:scale-[0.98] shadow-lg shadow-rose-950/40 shrink-0"
          >
            <Plus size={15} weight="bold" />
            Crear torneo
          </Link>
        </div>

        {loading && (
          <div className="grid gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm">
            Error al cargar los torneos: {error}
          </div>
        )}

        {!loading && !error && torneos.length === 0 && <EmptyState />}

        {!loading && torneos.length > 0 && (
          <div className="grid gap-3">
            {torneos.map((torneo) => (
              <TorneoCard key={torneo.id} torneo={torneo} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
