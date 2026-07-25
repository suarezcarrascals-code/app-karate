import { useState } from 'react'

const INICIAL = { nombre: '', ciudad: '', pais: '' }
const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

export default function DojoForm({ onSubmit, onCancel, loading }) {
  const [campos, setCampos] = useState(INICIAL)
  const [errorNombre, setErrorNombre] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setCampos((prev) => ({ ...prev, [name]: value }))
    if (name === 'nombre') setErrorNombre(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!campos.nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return }
    onSubmit({
      nombre: campos.nombre.trim(),
      ciudad: campos.ciudad.trim() || null,
      pais: campos.pais.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Nuevo dojo</p>
      <div>
        <input type="text" name="nombre" value={campos.nombre} onChange={handleChange}
          placeholder="Nombre del dojo *" className={INPUT} />
        {errorNombre && <p className="text-rose-400 text-xs mt-1">{errorNombre}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="text" name="ciudad" value={campos.ciudad} onChange={handleChange}
          placeholder="Ciudad" className={INPUT} />
        <input type="text" name="pais" value={campos.pais} onChange={handleChange}
          placeholder="País" className={INPUT} />
      </div>
      <div className="flex gap-2 pt-1">
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
