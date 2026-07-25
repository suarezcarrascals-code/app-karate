import { useNavigate } from 'react-router-dom'
import { HourglassMedium } from '@phosphor-icons/react'
import useAuthStore from '../../stores/useAuthStore'

export default function PendingPage() {
  const navigate = useNavigate()
  const { signOut, profile } = useAuthStore()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgb(217 119 6 / 0.06), transparent)' }}
      />

      <div className="w-full max-w-sm text-center relative">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/50 border border-amber-900/40 flex items-center justify-center mx-auto mb-6">
          <HourglassMedium size={28} className="text-amber-400" />
        </div>

        <h1 className="text-xl font-black text-zinc-100 tracking-tight mb-3">Cuenta en revisión</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-2">
          Hola <span className="text-zinc-200 font-medium">{profile?.nombre || 'organizador'}</span>,
          tu cuenta está siendo revisada.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          Recibirás un email cuando esté activa y puedas comenzar a crear torneos.
        </p>

        {profile?.estado === 'rechazado' && (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 mb-6">
            <p className="text-rose-300 text-sm">
              Tu cuenta no fue aprobada. Contactá al administrador para más información.
            </p>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
