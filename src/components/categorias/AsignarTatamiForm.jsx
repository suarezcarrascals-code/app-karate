import { useEffect, useState } from 'react'
import { calcularOrdenesOcupados } from '../../lib/categorias'

const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

export default function AsignarTatamiForm({ categoria, tatamis, onSubmit, onCancel, loading }) {
  const [tatamiId, setTatamiId] = useState('')
  const [orden, setOrden] = useState('')
  const [motivo, setMotivo] = useState('')
  const [ordenesOcupados, setOrdenesOcupados] = useState([])
  const [confirmarEnCurso, setConfirmarEnCurso] = useState(false)
  const [errores, setErrores] = useState({})

  const esMover = !!categoria.tatami_id
  const estaEnCurso = categoria.estado === 'en_curso'

  useEffect(() => {
    if (tatamiId) {
      calcularOrdenesOcupados(tatamiId).then(setOrdenesOcupados)
    } else {
      setOrdenesOcupados([])
    }
  }, [tatamiId])

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!tatamiId) errs.tatami = 'Elegí un tatami'
    if (!orden) errs.orden = 'El orden es obligatorio'
    if (ordenesOcupados.includes(parseInt(orden))) errs.orden = `El orden ${orden} ya está ocupado`
    if (Object.keys(errs).length > 0) { setErrores(errs); return }
    if (estaEnCurso && !confirmarEnCurso) { setConfirmarEnCurso(true); return }

    onSubmit({
      tatamiId,
      orden: parseInt(orden),
      tatamiAnteriorId: categoria.tatami_id || null,
      motivo: motivo.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="font-semibold text-zinc-100 text-base mb-0.5">
          {esMover ? 'Mover categoría de tatami' : 'Asignar tatami'}
        </h3>
        <p className="text-sm text-zinc-500 mb-4">{categoria.nombre}</p>

        {confirmarEnCurso && (
          <div className="bg-orange-950/40 border border-orange-900/60 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-300 font-medium">
              Esta categoría está en competencia activa. Confirmas el movimiento?
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tatami</label>
            <select value={tatamiId}
              onChange={(e) => { setTatamiId(e.target.value); setOrden('') }}
              className={INPUT}>
              <option value="">Seleccioná un tatami</option>
              {tatamis.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            {errores.tatami && <p className="text-rose-400 text-xs mt-1">{errores.tatami}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Orden en el día
              {ordenesOcupados.length > 0 && (
                <span className="text-zinc-600 ml-2">(ocupados: {ordenesOcupados.join(', ')})</span>
              )}
            </label>
            <input type="number" value={orden}
              onChange={(e) => { setOrden(e.target.value); setErrores((p) => ({ ...p, orden: null })) }}
              min="1" placeholder="Ej: 1" className={INPUT} />
            {errores.orden && <p className="text-rose-400 text-xs mt-1">{errores.orden}</p>}
          </div>

          {esMover && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Motivo (opcional)</label>
              <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Tatami A con problema técnico" className={INPUT} />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : confirmarEnCurso ? 'Confirmar' : esMover ? 'Mover' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
