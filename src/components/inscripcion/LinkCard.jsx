import { useState } from 'react'
import { Copy, Check, LinkBreak } from '@phosphor-icons/react'
import useLinkStore from '../../stores/useLinkStore'

function EstadoBadge({ estado }) {
  if (estado === 'activo') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-900/50">
      Activo
    </span>
  )
  if (estado === 'inactivo') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">
      Inactivo
    </span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-800/50 text-zinc-600 border border-zinc-700/50">
      Sin link
    </span>
  )
}

export default function LinkCard({ link, dojo, torneoId, onGenerar }) {
  const [copiado, setCopiado] = useState(false)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [loadingGen, setLoadingGen] = useState(false)

  const { desactivarLink, loading } = useLinkStore()

  const urlLink = link ? `${window.location.origin}/inscripcion/${link.token}` : null
  const count = link?._count ?? 0
  const estado = link?.estado ?? null
  const tieneLink = !!link

  async function handleGenerar() {
    setLoadingGen(true)
    try {
      await onGenerar(dojo.id)
    } finally {
      setLoadingGen(false)
    }
  }

  async function handleCopiar() {
    if (!urlLink) return
    await navigator.clipboard.writeText(urlLink)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function handleDesactivar() {
    await desactivarLink(link.id)
    setConfirmarDesactivar(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-zinc-100 text-sm">{dojo.nombre}</p>
          {tieneLink && estado === 'activo' && (
            <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
              {count} atleta{count !== 1 ? 's' : ''} inscrito{count !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <EstadoBadge estado={estado} />
      </div>

      {/* Link activo — acciones */}
      {tieneLink && estado === 'activo' && (
        <div className="flex gap-2">
          <button
            onClick={handleCopiar}
            className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {copiado ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copiado ? 'Copiado' : 'Copiar link'}
          </button>
          <button
            onClick={() => setConfirmarDesactivar(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 border border-zinc-800 transition-colors"
          >
            <LinkBreak size={13} />
            Desactivar
          </button>
        </div>
      )}

      {/* Link inactivo — generar nuevo */}
      {(!tieneLink || estado === 'inactivo') && (
        <button
          onClick={handleGenerar}
          disabled={loadingGen}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
        >
          {loadingGen ? '...' : 'Generar link'}
        </button>
      )}

      {/* URL preview */}
      {tieneLink && estado === 'activo' && (
        <p className="text-xs text-zinc-600 mt-2 truncate font-mono">{urlLink}</p>
      )}

      {/* Modal confirmar desactivar */}
      {confirmarDesactivar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Desactivar link de {dojo.nombre}</h3>
            <p className="text-zinc-400 text-sm mb-5">
              El entrenador ya no podrá inscribir atletas. Los atletas ya inscritos no se eliminan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarDesactivar(false)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesactivar}
                disabled={loading}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
