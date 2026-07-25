import { useState } from 'react'

export default function TatamiForm({ onSubmit, onCancel, loading }) {
  const [nombre, setNombre] = useState('')
  const [arbitro, setArbitro] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setError(null)
    onSubmit({ nombre: nombre.trim(), arbitro: arbitro.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
      <p className="text-sm font-semibold text-zinc-200 mb-3">Nuevo tatami</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <input type="text" value={nombre}
            onChange={(e) => { setNombre(e.target.value); setError(null) }}
            placeholder="Nombre (ej: Tatami A)"
            className="w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600" />
          {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
        </div>
        <input type="text" value={arbitro}
          onChange={(e) => setArbitro(e.target.value)}
          placeholder="Árbitro (opcional)"
          className="w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors disabled:opacity-50 active:scale-95">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-zinc-400 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
