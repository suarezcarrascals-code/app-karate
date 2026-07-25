import { useState, useEffect } from 'react'
import { encontrarCategoriasCompatibles, edadAFechaNacimiento } from '../../lib/competidores'

const GRUPOS_MODALIDAD = [
  { key: 'kumite_individual', label: 'Kumite Individual' },
  { key: 'kumite_equipo',     label: 'Kumite Equipo' },
  { key: 'kata_individual',   label: 'Kata Individual' },
  { key: 'kata_equipo',       label: 'Kata Equipo' },
]

const INPUT = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-600 transition-colors'
const LABEL = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

export default function AtletaForm({ categorias, onAgregar, loading }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [genero, setGenero] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [errores, setErrores] = useState({})
  const [sugeridas, setSugeridas] = useState([])

  useEffect(() => {
    if (!edad || !genero || !categorias?.length) {
      setSugeridas([])
      return
    }
    const compatibles = encontrarCategoriasCompatibles(
      { edad: parseInt(edad), peso: peso ? parseFloat(peso) : null, genero },
      categorias
    )
    setSugeridas(compatibles.map((c) => c.id))
    if (compatibles.length === 1 && !categoriaId) setCategoriaId(compatibles[0].id)
  }, [edad, peso, genero, categorias]) // eslint-disable-line

  function validar() {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'Requerido'
    if (!apellido.trim()) errs.apellido = 'Requerido'
    if (!edad || isNaN(parseInt(edad)) || parseInt(edad) < 3 || parseInt(edad) > 100) errs.edad = 'Ingresá una edad válida'
    if (!genero) errs.genero = 'Seleccioná el sexo'
    if (!categoriaId) errs.categoriaId = 'Seleccioná una categoría'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    onAgregar({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fecha_nacimiento: edadAFechaNacimiento(parseInt(edad)),
      peso: peso ? parseFloat(peso) : null,
      genero,
      categoria_id: categoriaId,
    })

    setNombre(''); setApellido(''); setEdad('')
    setPeso(''); setGenero(''); setCategoriaId('')
    setErrores({}); setSugeridas([])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Nombre y apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: null })) }}
            placeholder="Nombre"
            autoCapitalize="words"
            className={INPUT}
          />
          {errores.nombre && <p className="text-rose-400 text-xs mt-1.5">{errores.nombre}</p>}
        </div>
        <div>
          <label className={LABEL}>Apellido</label>
          <input
            value={apellido}
            onChange={(e) => { setApellido(e.target.value); setErrores((p) => ({ ...p, apellido: null })) }}
            placeholder="Apellido"
            autoCapitalize="words"
            className={INPUT}
          />
          {errores.apellido && <p className="text-rose-400 text-xs mt-1.5">{errores.apellido}</p>}
        </div>
      </div>

      {/* Sexo — botones */}
      <div>
        <label className={LABEL}>Sexo</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { valor: 'masculino', label: 'Masculino' },
            { valor: 'femenino',  label: 'Femenino' },
          ].map(({ valor, label }) => (
            <button
              key={valor}
              type="button"
              onClick={() => { setGenero(valor); setErrores((p) => ({ ...p, genero: null })) }}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                genero === valor
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {errores.genero && <p className="text-rose-400 text-xs mt-1.5">{errores.genero}</p>}
      </div>

      {/* Edad y peso */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Edad</label>
          <div className="relative">
            <input
              type="number"
              min="3"
              max="100"
              value={edad}
              onChange={(e) => { setEdad(e.target.value); setErrores((p) => ({ ...p, edad: null })) }}
              placeholder="0"
              className={`${INPUT} pr-14`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium pointer-events-none">
              años
            </span>
          </div>
          {errores.edad && <p className="text-rose-400 text-xs mt-1.5">{errores.edad}</p>}
        </div>
        <div>
          <label className={LABEL}>Peso (kg)</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="1"
              max="200"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="0.0"
              className={`${INPUT} pr-10`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium pointer-events-none">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className={LABEL}>Categoría</label>
        <select
          value={categoriaId}
          onChange={(e) => { setCategoriaId(e.target.value); setErrores((p) => ({ ...p, categoriaId: null })) }}
          className={`${INPUT} cursor-pointer`}
        >
          <option value="">Seleccioná una categoría</option>
          {GRUPOS_MODALIDAD.map(({ key, label }) => {
            const items = categorias?.filter((c) => c.modalidad === key) ?? []
            if (items.length === 0) return null
            return (
              <optgroup key={key} label={label}>
                {items.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {sugeridas.includes(cat.id) ? '★ ' : ''}{cat.nombre}
                  </option>
                ))}
              </optgroup>
            )
          })}
          {/* Categorías con modalidad no estándar */}
          {(() => {
            const conocidas = new Set(GRUPOS_MODALIDAD.map((g) => g.key))
            const otras = categorias?.filter((c) => !conocidas.has(c.modalidad)) ?? []
            if (otras.length === 0) return null
            return (
              <optgroup label="Otras">
                {otras.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {sugeridas.includes(cat.id) ? '★ ' : ''}{cat.nombre}
                  </option>
                ))}
              </optgroup>
            )
          })()}
        </select>
        {sugeridas.length > 0 && !errores.categoriaId && (
          <p className="text-xs text-emerald-400/80 mt-1.5">
            ★ Categoría sugerida según los datos del atleta
          </p>
        )}
        {errores.categoriaId && <p className="text-rose-400 text-xs mt-1.5">{errores.categoriaId}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-2"
      >
        {loading ? 'Guardando...' : 'Agregar atleta'}
      </button>
    </form>
  )
}
