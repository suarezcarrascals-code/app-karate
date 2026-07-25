import { useState } from 'react'
import useDojoStore from '../../stores/useDojoStore'

export default function DojoCard({ dojo }) {
  const [confirmar, setConfirmar] = useState(false)
  const removeDojo = useDojoStore((s) => s.removeDojo)

  async function handleEliminar() {
    try { await removeDojo(dojo.id) } catch { /* error en store */ }
    setConfirmar(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
      <div>
        <p className="font-medium text-zinc-100 text-sm">{dojo.nombre}</p>
        {(dojo.ciudad || dojo.pais) && (
          <p className="text-xs text-zinc-500 mt-0.5">
            {[dojo.ciudad, dojo.pais].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
      <button onClick={() => setConfirmar(true)}
        className="text-xs text-zinc-600 hover:text-rose-400 font-medium shrink-0 transition-colors">
        Eliminar
      </button>

      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar {dojo.nombre}</h3>
            <p className="text-zinc-400 text-sm mb-5">
              Los competidores asociados quedarán sin dojo asignado.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmar(false)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
