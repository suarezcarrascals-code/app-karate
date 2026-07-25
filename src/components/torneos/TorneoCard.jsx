import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarBlank, MapPin } from '@phosphor-icons/react'
import EstadoBadge from './EstadoBadge'
import useTorneoStore from '../../stores/useTorneoStore'
import { fetchTatamis } from '../../lib/tatamis'

function formatFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function TorneoCard({ torneo }) {
  const [modal, setModal] = useState(null)
  const [errorEliminar, setErrorEliminar] = useState(null)
  const { activarTorneo, removeTorneo } = useTorneoStore()

  async function handleActivar() {
    const tatamis = await fetchTatamis(torneo.id)
    if (tatamis.length === 0) { setModal('activar-bloqueado'); return }
    await activarTorneo(torneo.id)
  }

  async function handleEliminarConfirmar() {
    try {
      setErrorEliminar(null)
      await removeTorneo(torneo.id)
      setModal(null)
    } catch (err) {
      setErrorEliminar(err.message)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {torneo.logo_url ? (
            <img src={torneo.logo_url} alt={torneo.nombre}
              className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-zinc-700" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-rose-950/60 to-rose-950/30 border border-rose-900/40 flex items-center justify-center shrink-0">
              <span className="text-rose-400 font-black text-sm tracking-tight">
                {torneo.nombre?.slice(0, 2).toUpperCase() || 'KT'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <Link to={`/torneo/${torneo.id}`}>
              <h3 className="font-semibold text-zinc-100 text-base truncate group-hover:text-rose-400 transition-colors leading-tight">
                {torneo.nombre}
              </h3>
            </Link>
            {torneo.lugar && (
              <p className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                <MapPin size={12} className="text-zinc-600 shrink-0" />
                <span className="truncate">{torneo.lugar}</span>
              </p>
            )}
          </div>
        </div>
        <EstadoBadge estado={torneo.estado} />
      </div>

      <p className="mt-3.5 flex items-center gap-1.5 text-xs text-zinc-600 tabular-nums">
        <CalendarBlank size={12} className="shrink-0" />
        {formatFecha(torneo.fecha_inicio)}
        {torneo.fecha_fin && torneo.fecha_fin !== torneo.fecha_inicio && (
          <span> al {formatFecha(torneo.fecha_fin)}</span>
        )}
      </p>

      {torneo.estado === 'borrador' && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center gap-4">
          <button onClick={handleActivar}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors">
            Activar torneo →
          </button>
          <button onClick={() => setModal('eliminar')}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Eliminar
          </button>
        </div>
      )}

      {modal === 'activar-bloqueado' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-modal-in">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Para activar el torneo</h3>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              Primero configurá al menos un <strong className="text-zinc-200 font-medium">tatami</strong>. Accedé al torneo para agregar tatamis.
            </p>
            <button onClick={() => setModal(null)}
              className="w-full bg-zinc-800 text-zinc-200 py-2.5 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}

      {modal === 'eliminar' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-modal-in">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar torneo</h3>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              ¿Confirmás que querés eliminar <strong className="text-zinc-200 font-medium">{torneo.nombre}</strong>? Esta acción es irreversible.
            </p>
            {errorEliminar && <p className="text-rose-400 text-xs mb-3">{errorEliminar}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminarConfirmar}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-medium hover:bg-rose-500 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
