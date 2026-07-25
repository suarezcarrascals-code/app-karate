import { useState } from 'react'
import { validarFormularioTorneo } from '../../lib/validaciones'

const CAMPOS_INICIALES = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  lugar: '',
  logo: null,
}

const inputClass =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent'

const labelClass = 'block text-sm font-medium text-zinc-400 mb-1'

export default function TorneoForm({ onSubmit, loading }) {
  const [campos, setCampos] = useState(CAMPOS_INICIALES)
  const [errores, setErrores] = useState({})

  function handleChange(e) {
    const { name, value, files } = e.target
    setCampos((prev) => ({ ...prev, [name]: files ? files[0] : value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }))
    if (name === 'fecha_inicio' || name === 'fecha_fin') {
      setErrores((prev) => ({ ...prev, fechas: null }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { valido, errores: nuevosErrores } = validarFormularioTorneo(campos)
    if (!valido) {
      setErrores(nuevosErrores)
      return
    }
    onSubmit(campos)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Nombre del torneo *</label>
        <input
          type="text"
          name="nombre"
          value={campos.nombre}
          onChange={handleChange}
          placeholder="Ej: Torneo Nacional de Karate 2026"
          className={inputClass}
        />
        {errores.nombre && <p className="text-rose-400 text-xs mt-1">{errores.nombre}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Fecha de inicio *</label>
          <input
            type="date"
            name="fecha_inicio"
            value={campos.fecha_inicio}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Fecha de fin *</label>
          <input
            type="date"
            name="fecha_fin"
            value={campos.fecha_fin}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>
      {errores.fechas && <p className="text-rose-400 text-xs -mt-3">{errores.fechas}</p>}

      <div>
        <label className={labelClass}>Lugar *</label>
        <input
          type="text"
          name="lugar"
          value={campos.lugar}
          onChange={handleChange}
          placeholder="Ej: Gimnasio Municipal de Bucaramanga"
          className={inputClass}
        />
        {errores.lugar && <p className="text-rose-400 text-xs mt-1">{errores.lugar}</p>}
      </div>

      <div>
        <label className={labelClass}>Logo (opcional)</label>
        <input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleChange}
          className="w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-700 file:text-zinc-200 hover:file:bg-zinc-600 cursor-pointer"
        />
        <p className="text-xs text-zinc-600 mt-1">Máximo 2 MB. PNG, JPG o SVG.</p>
        {errores.logo && <p className="text-rose-400 text-xs mt-1">{errores.logo}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Guardando...' : 'Crear torneo'}
      </button>
    </form>
  )
}
