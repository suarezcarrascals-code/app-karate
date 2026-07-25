import { useState } from 'react'
import { Copy, ArrowClockwise, Link, CheckCircle, Warning } from '@phosphor-icons/react'

export default function MesaTecnicaLinkCard({ tatami, link, torneoId, onGenerar, onRegenerar }) {
  const [copiado, setCopiado] = useState(false)
  const [modalConfirm, setModalConfirm] = useState(false)
  const [procesando, setProcesando] = useState(false)

  const linkUrl = link
    ? `${window.location.origin}/marcador/${link.token}`
    : null

  async function handleGenerar() {
    setProcesando(true)
    try {
      await onGenerar(torneoId, tatami.id)
    } finally {
      setProcesando(false)
    }
  }

  async function handleRegenerar() {
    setProcesando(true)
    setModalConfirm(false)
    try {
      await onRegenerar(torneoId, tatami.id)
    } finally {
      setProcesando(false)
    }
  }

  async function handleCopiar() {
    if (!linkUrl) return
    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // fallback para navegadores sin permisos de clipboard
      const input = document.createElement('input')
      input.value = linkUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Link size={13} className="text-zinc-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{tatami.nombre}</p>
            {link ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle size={11} weight="fill" />
                Activo
              </span>
            ) : (
              <span className="text-xs text-zinc-600">Sin generar</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!link && (
            <button
              onClick={handleGenerar}
              disabled={procesando}
              className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              {procesando ? '...' : 'Generar link'}
            </button>
          )}

          {link && (
            <>
              <button
                onClick={handleCopiar}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  copiado
                    ? 'bg-emerald-700/40 text-emerald-400 border border-emerald-800/50'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                {copiado ? (
                  <><CheckCircle size={12} weight="fill" /> ¡Copiado!</>
                ) : (
                  <><Copy size={12} /> Copiar</>
                )}
              </button>

              <button
                onClick={() => setModalConfirm(true)}
                disabled={procesando}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowClockwise size={12} />
                Regenerar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación regenerar */}
      {modalConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <Warning size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm mb-1">¿Regenerar link?</h3>
                <p className="text-zinc-400 text-sm">
                  El link actual de <strong className="text-zinc-200">{tatami.nombre}</strong> dejará de funcionar inmediatamente.
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  Si hay alguien usando ese link, verá un mensaje para pedirte el nuevo.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfirm(false)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegenerar}
                className="flex-1 bg-amber-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Sí, regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
