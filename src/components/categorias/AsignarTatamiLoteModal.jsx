import { useState, useEffect } from 'react'
import { X, Warning } from '@phosphor-icons/react'
import { calcularOrdenesOcupados } from '../../lib/categorias'

export default function AsignarTatamiLoteModal({ categorias, tatamis, onConfirmar, onCancel, loading }) {
  const [tatamiId, setTatamiId] = useState('')
  const [ordenes, setOrdenes] = useState({})
  const [ordenesOcupados, setOrdenesOcupados] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!tatamiId) { setOrdenesOcupados([]); setOrdenes({}); return }
    setCargando(true)
    calcularOrdenesOcupados(tatamiId).then((ocupados) => {
      setOrdenesOcupados(ocupados)
      const base = ocupados.length > 0 ? Math.max(...ocupados) : 0
      const nuevos = {}
      categorias.forEach((cat, idx) => { nuevos[cat.id] = base + idx + 1 })
      setOrdenes(nuevos)
      setCargando(false)
    })
  }, [tatamiId]) // eslint-disable-line

  const valoresUsados = Object.values(ordenes).map(Number).filter(Boolean)
  const hayDuplicados = valoresUsados.length !== new Set(valoresUsados).size
  const hayOcupados = Object.values(ordenes).some((v) => ordenesOcupados.includes(Number(v)))
  const todosValidos = categorias.every((c) => ordenes[c.id] && !isNaN(Number(ordenes[c.id])))
  const puedeConfirmar = tatamiId && todosValidos && !hayDuplicados && !hayOcupados

  function handleConfirmar() {
    const items = categorias.map((cat) => ({
      id: cat.id,
      tatami_id: cat.tatami_id,
      orden: parseInt(ordenes[cat.id]),
    }))
    onConfirmar(tatamiId, items)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100 text-base">Asignar tatami</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} seleccionada{categorias.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Selector de tatami */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tatami</label>
            <select
              value={tatamiId}
              onChange={(e) => setTatamiId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-600 transition-colors"
            >
              <option value="">Seleccioná un tatami</option>
              {tatamis.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          {/* Lista de categorías con orden */}
          {tatamiId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Orden en el día
                </label>
                {ordenesOcupados.length > 0 && (
                  <span className="text-xs text-zinc-600">
                    Ocupados: {ordenesOcupados.sort((a, b) => a - b).join(', ')}
                  </span>
                )}
              </div>

              {cargando ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {categorias.map((cat) => {
                    const v = ordenes[cat.id] ?? ''
                    const duplicado = valoresUsados.filter((x) => x === Number(v)).length > 1
                    const ocupado = ordenesOcupados.includes(Number(v))
                    const error = duplicado || ocupado
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-3 bg-zinc-800/60 border rounded-lg px-3 py-2 ${error ? 'border-rose-900/60' : 'border-zinc-700/50'}`}
                      >
                        <span className="flex-1 text-sm text-zinc-200 truncate min-w-0">{cat.nombre}</span>
                        <input
                          type="number"
                          min="1"
                          value={v}
                          onChange={(e) => setOrdenes((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                          className={`w-16 shrink-0 bg-zinc-700 border rounded-lg px-2 py-1 text-sm text-center text-zinc-100 focus:outline-none focus:ring-1 ${error ? 'border-rose-500/60 focus:ring-rose-500' : 'border-zinc-600 focus:ring-rose-500'}`}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {(hayDuplicados || hayOcupados) && (
                <div className="flex items-start gap-2 mt-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/40 px-3 py-2 rounded-lg">
                  <Warning size={13} className="shrink-0 mt-0.5" />
                  <span>
                    {hayDuplicados && 'Hay órdenes duplicados entre las categorías. '}
                    {hayOcupados && 'Algunos órdenes ya están ocupados en este tatami.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!puedeConfirmar || loading || cargando}
            className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors disabled:opacity-40"
          >
            {loading ? 'Asignando...' : `Asignar ${categorias.length}`}
          </button>
        </div>
      </div>
    </div>
  )
}
