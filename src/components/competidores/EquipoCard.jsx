import { useState } from 'react'
import useCompetidorStore from '../../stores/useCompetidorStore'

export default function EquipoCard({ equipo, competidores = [] }) {
  const [confirmar, setConfirmar] = useState(false)
  const removeEquipo = useCompetidorStore((s) => s.removeEquipo)

  // Resolver miembros client-side por ID
  function buscar(id) {
    return competidores.find((c) => c.id === id)
  }

  const miembros = [equipo.miembro_1_id, equipo.miembro_2_id, equipo.miembro_3_id]
    .map(buscar)
    .filter(Boolean)

  async function handleEliminar() {
    try { await removeEquipo(equipo.id) } catch { /* error en store */ }
    setConfirmar(false)
  }

  return (
    <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-zinc-100 text-sm">{equipo.nombre}</p>
          {equipo.club && equipo.club !== equipo.nombre && (
            <p className="text-xs text-zinc-500 mt-0.5">{equipo.club}</p>
          )}
        </div>
        <button onClick={() => setConfirmar(true)}
          className="text-xs text-zinc-600 hover:text-rose-400 font-medium shrink-0 transition-colors">
          Eliminar
        </button>
      </div>

      <div className="space-y-1.5">
        {miembros.length > 0 ? miembros.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-400 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-zinc-200">{m.nombre} {m.apellido}</span>
            {m.dojo?.nombre && <span className="text-xs text-zinc-500">{m.dojo.nombre}</span>}
          </div>
        )) : (
          <p className="text-xs text-zinc-600">Miembros: {equipo.miembro_1_id?.slice(0, 8)}...</p>
        )}
      </div>

      {confirmar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar {equipo.nombre}</h3>
            <p className="text-zinc-400 text-sm mb-5">Esta acción es irreversible.</p>
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
