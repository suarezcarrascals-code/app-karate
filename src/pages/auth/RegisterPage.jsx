import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import useAuthStore from '../../stores/useAuthStore'

const INPUT = 'w-full border border-zinc-800 bg-zinc-900 text-zinc-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-700/60 placeholder:text-zinc-600 transition-colors'
const LABEL = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, loading, error, clearError } = useAuthStore()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [localError, setLocalError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      await signUp(email, password, nombre)
      navigate('/pendiente')
    } catch {
      // error ya en el store
    }
  }

  const mostrarError = localError || error

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgb(225 29 72 / 0.07), transparent)' }}
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 shadow-lg shadow-rose-950/50 flex items-center justify-center mx-auto mb-5">
            <span className="text-white text-2xl font-black tracking-tighter">K</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Crear cuenta</h1>
          <p className="text-zinc-500 text-sm mt-1">Tu cuenta será revisada antes de activarse</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-nombre" className={LABEL}>Nombre completo</label>
              <input
                id="reg-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="reg-email" className={LABEL}>Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="reg-password" className={LABEL}>Contraseña</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                  className={`${INPUT} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors p-0.5"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm" className={LABEL}>Confirmar contraseña</label>
              <input
                id="reg-confirm"
                type={verPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
                required
                className={INPUT}
              />
            </div>

            {mostrarError && (
              <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-3.5 py-2.5 rounded-xl text-sm">
                {mostrarError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-rose-950/40"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-rose-400 hover:text-rose-300 font-medium transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
