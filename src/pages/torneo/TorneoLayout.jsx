import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { ArrowLeft, SquaresFour, Buildings, UsersThree, Tag, LinkSimple, SignOut, ShieldCheck, ArrowRight, Eye, Copy, Check } from '@phosphor-icons/react'
import useAuthStore from '../../stores/useAuthStore'
import { fetchTorneoById, cambiarEstadoTorneo } from '../../lib/torneos'
import EstadoBadge from '../../components/torneos/EstadoBadge'

const ESTADO_SIGUIENTE = {
  borrador: 'inscripciones',
  inscripciones: 'en_curso',
  en_curso: 'finalizado',
}

const ESTADO_LABEL_SIGUIENTE = {
  borrador: 'Abrir inscripciones',
  inscripciones: 'Iniciar torneo',
  en_curso: 'Finalizar torneo',
}

const NAV_ITEMS = [
  { label: 'Tatamis',      key: 'tatamis',      icon: SquaresFour,  exact: true,  primary: true },
  { label: 'Dojos',        key: 'dojos',        icon: Buildings,    exact: false },
  { label: 'Competidores', key: 'competidores', icon: UsersThree,   exact: false },
  { label: 'Categorías',    key: 'categorias',    icon: Tag,         exact: false },
  { label: 'Inscripciones', key: 'inscripciones', icon: LinkSimple,  exact: false },
]

export default function TorneoLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [torneo, setTorneo] = useState(null)
  const [avanzando, setAvanzando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const { profile, signOut } = useAuthStore()

  const urlPublica = `${window.location.origin}/torneo/${id}/publico`

  async function handleCopiarLink() {
    await navigator.clipboard.writeText(urlPublica)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleAvanzarEstado() {
    if (!torneo) return
    const siguiente = ESTADO_SIGUIENTE[torneo.estado]
    if (!siguiente) return
    setAvanzando(true)
    try {
      const actualizado = await cambiarEstadoTorneo(id, siguiente)
      setTorneo(actualizado)
    } finally {
      setAvanzando(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    fetchTorneoById(id).then(setTorneo).catch(() => navigate('/'))
  }, [id, navigate])

  function navPath(item) {
    return item.key === 'tatamis' ? `/torneo/${id}` : `/torneo/${id}/${item.key}`
  }

  function isActive(item) {
    const path = navPath(item)
    return item.exact ? location.pathname === path : location.pathname.startsWith(path)
  }

  return (
    <div className="bg-zinc-950 md:flex md:h-screen md:overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 p-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-100 text-sm leading-tight truncate">
            {torneo?.nombre || '...'}
          </p>
          {torneo?.lugar && (
            <p className="text-xs text-zinc-600 truncate">{torneo.lugar}</p>
          )}
        </div>
        {torneo?.estado && <EstadoBadge estado={torneo.estado} />}
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={urlPublica}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
            title="Vista pública"
          >
            <Eye size={16} />
          </a>
          <button
            onClick={handleCopiarLink}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
            title="Copiar link público"
          >
            {copiado ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-zinc-950 border-r border-zinc-900 h-screen shrink-0">
        <div className="p-4 border-b border-zinc-900">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 mb-4 transition-colors">
            <ArrowLeft size={12} />
            Mis torneos
          </button>
          <div className="flex items-start gap-2.5">
            {torneo?.logo_url ? (
              <img src={torneo.logo_url} alt=""
                className="w-9 h-9 rounded-lg object-cover shrink-0 ring-1 ring-zinc-800" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 flex items-center justify-center shrink-0 shadow-md shadow-rose-950/40">
                <span className="text-white text-xs font-black tracking-tight">
                  {torneo?.nombre?.slice(0, 2).toUpperCase() || 'K'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100 text-sm leading-snug">
                {torneo?.nombre || '...'}
              </p>
              {torneo?.lugar && (
                <p className="text-[11px] text-zinc-600 truncate mt-0.5">{torneo.lugar}</p>
              )}
            </div>
          </div>
          {torneo?.estado && (
            <div className="mt-3 space-y-2">
              <EstadoBadge estado={torneo.estado} />
              {ESTADO_SIGUIENTE[torneo.estado] && (
                <button
                  onClick={handleAvanzarEstado}
                  disabled={avanzando}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors disabled:opacity-50"
                >
                  <ArrowRight size={11} />
                  {avanzando ? '...' : ESTADO_LABEL_SIGUIENTE[torneo.estado]}
                </button>
              )}
              <div className="flex gap-1.5">
                <a
                  href={urlPublica}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  <Eye size={11} />
                  Vista pública
                </a>
                <button
                  onClick={handleCopiarLink}
                  title="Copiar link"
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                >
                  {copiado ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 pt-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const activo = isActive(item)
            return (
              <button key={item.key}
                onClick={() => navigate(navPath(item))}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  activo
                    ? 'bg-rose-950/30 text-rose-400 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                {activo && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-rose-500" />
                )}
                <Icon size={16} weight={activo ? 'fill' : 'regular'}
                  className={activo ? 'text-rose-500' : 'text-zinc-600'} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer sidebar — usuario + logout */}
        <div className="p-3 border-t border-zinc-900 space-y-2">
          {profile?.role === 'admin' && (
            <button onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
              <ShieldCheck size={13} />
              Panel de admin
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-zinc-400 uppercase">
                {(profile?.nombre || profile?.email || '?').slice(0, 1)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-400 truncate">{profile?.nombre}</p>
              <p className="text-[11px] text-zinc-600 truncate">{profile?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Cerrar sesión"
              className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
              <SignOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet context={{ torneo, torneoId: id }} />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 flex z-20 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const activo = isActive(item)
          return (
            <button key={item.key}
              onClick={() => navigate(navPath(item))}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                activo ? 'text-rose-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <Icon size={20} weight={activo ? 'fill' : 'regular'} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
