import { useState, useEffect } from 'react'

const MODALIDADES = [
  { value: 'kumite_individual', label: 'Kumite Individual' },
  { value: 'kumite_equipo', label: 'Kumite Equipo' },
  { value: 'kata_individual', label: 'Kata Individual' },
  { value: 'kata_equipo', label: 'Kata Equipo' },
]

const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'mixto', label: 'Mixto' },
]

const NIVELES = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const INICIAL = {
  nombre: '', modalidad: '', genero: '', nivel: '',
  edad_min: '', edad_max: '',
  peso_min: '', peso_max: '',
  cinturon_min: '', cinturon_max: '',
}

function generarNombre(c) {
  const partes = []
  if (c.modalidad) partes.push(MODALIDADES.find((m) => m.value === c.modalidad)?.label || '')
  if (c.genero) partes.push(c.genero.charAt(0).toUpperCase() + c.genero.slice(1))
  if (c.nivel) partes.push(NIVELES.find((n) => n.value === c.nivel)?.label || '')
  if (c.edad_min && c.edad_max) partes.push(`${c.edad_min}-${c.edad_max} años`)
  else if (c.edad_max) partes.push(`hasta ${c.edad_max} años`)
  if (c.modalidad.startsWith('kumite')) {
    if (c.peso_min && c.peso_max) partes.push(`${c.peso_min}-${c.peso_max}kg`)
    else if (c.peso_max) partes.push(`-${c.peso_max}kg`)
  }
  return partes.join(' ')
}

const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

export default function CategoriaForm({ onSubmit, onCancel, loading }) {
  const [campos, setCampos] = useState(INICIAL)
  const [errores, setErrores] = useState({})
  const [nombreManual, setNombreManual] = useState(false)

  const esKumite = campos.modalidad.startsWith('kumite')

  useEffect(() => {
    if (nombreManual) return
    const nombre = generarNombre(campos)
    setCampos((prev) => ({ ...prev, nombre }))
  }, [campos.modalidad, campos.genero, campos.nivel, campos.edad_min, campos.edad_max, campos.peso_min, campos.peso_max, nombreManual])

  function handleChange(e) {
    const { name, value } = e.target
    setCampos((prev) => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }))
  }

  function handleNombreChange(e) {
    setNombreManual(true)
    handleChange(e)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!campos.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!campos.modalidad) errs.modalidad = 'La modalidad es obligatoria'
    if (!campos.genero) errs.genero = 'El género es obligatorio'
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    onSubmit({
      nombre: campos.nombre.trim(),
      modalidad: campos.modalidad,
      genero: campos.genero,
      nivel: campos.nivel || null,
      edad_min: campos.edad_min ? parseInt(campos.edad_min) : null,
      edad_max: campos.edad_max ? parseInt(campos.edad_max) : null,
      peso_min: esKumite && campos.peso_min ? parseFloat(campos.peso_min) : null,
      peso_max: esKumite && campos.peso_max ? parseFloat(campos.peso_max) : null,
      cinturon_min: campos.cinturon_min || null,
      cinturon_max: campos.cinturon_max || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Nueva categoría</p>

      <div>
        <div className="relative">
          <input type="text" name="nombre" value={campos.nombre} onChange={handleNombreChange}
            placeholder="Se completa automáticamente..."
            className={INPUT + ' pr-16'} />
          {nombreManual && (
            <button type="button" onClick={() => setNombreManual(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-rose-400 hover:text-rose-300 font-medium">
              ↺ auto
            </button>
          )}
        </div>
        {errores.nombre && <p className="text-rose-400 text-xs mt-1">{errores.nombre}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <select name="modalidad" value={campos.modalidad} onChange={handleChange} className={INPUT}>
            <option value="">Modalidad *</option>
            {MODALIDADES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {errores.modalidad && <p className="text-rose-400 text-xs mt-1">{errores.modalidad}</p>}
        </div>
        <div>
          <select name="genero" value={campos.genero} onChange={handleChange} className={INPUT}>
            <option value="">Género *</option>
            {GENEROS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          {errores.genero && <p className="text-rose-400 text-xs mt-1">{errores.genero}</p>}
        </div>
      </div>

      <select name="nivel" value={campos.nivel} onChange={handleChange} className={INPUT}>
        <option value="">Nivel (opcional)</option>
        {NIVELES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input type="number" name="edad_min" value={campos.edad_min} onChange={handleChange}
          placeholder="Edad mínima" min="0" className={INPUT} />
        <input type="number" name="edad_max" value={campos.edad_max} onChange={handleChange}
          placeholder="Edad máxima" min="0" className={INPUT} />
      </div>

      {esKumite && (
        <div className="grid grid-cols-2 gap-3">
          <input type="number" name="peso_min" value={campos.peso_min} onChange={handleChange}
            placeholder="Peso mínimo (kg)" step="0.5" className={INPUT} />
          <input type="number" name="peso_max" value={campos.peso_max} onChange={handleChange}
            placeholder="Peso máximo (kg)" step="0.5" className={INPUT} />
        </div>
      )}

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
