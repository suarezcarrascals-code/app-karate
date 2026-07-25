import { useEffect, useState } from 'react'
import { fetchHistorialMovimientos } from '../../lib/categorias'

function formatFechaHora(ts) {
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function HistorialMovimientos({ categoriaId }) {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistorialMovimientos(categoriaId)
      .then(setMovimientos)
      .finally(() => setLoading(false))
  }, [categoriaId])

  if (loading) return <p className="text-xs text-zinc-600 py-2">Cargando historial...</p>
  if (movimientos.length === 0) return <p className="text-xs text-zinc-600 py-2">Sin movimientos registrados.</p>

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3 space-y-2">
      <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Historial</p>
      {movimientos.map((m) => (
        <div key={m.id} className="text-xs text-zinc-500 flex gap-2">
          <span className="text-zinc-700 shrink-0 tabular-nums">{formatFechaHora(m.created_at)}</span>
          <span>
            {m.tatami_anterior ? m.tatami_anterior.nombre : 'Sin asignar'} -{'>'}
            {' '}{m.tatami_nuevo ? m.tatami_nuevo.nombre : 'Sin asignar'}
            {m.motivo && <span className="text-zinc-700"> · {m.motivo}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
