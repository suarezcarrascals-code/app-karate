import { useState } from 'react'
import { edadAFechaNacimiento } from '../../lib/competidores'
import { CINTURONES, NIVEL_LABEL, NIVEL_COLOR, clasificarCinturon } from '../../lib/cinturones'

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Individual',
  kumite_equipo:     'Kumite Equipo',
  kata_individual:   'Kata Individual',
  kata_equipo:       'Kata Equipo',
}

const INPUT = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-600 transition-colors'
const LABEL = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

export default function AtletaForm({ categorias, onAgregar, loading }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [edad, setEdad] = useState('')
  const [peso, setPeso] = useState('')
  const [genero, setGenero] = useState('')
  const [cinturon, setCinturon] = useState('')
  const [categoriasIds, setCategoriasIds] = useState(new Set())
  const [errores, setErrores] = useState({})
  const [busqueda, setBusqueda] = useState('')

  function toggleCategoria(id) {
    setCategoriasIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setErrores((p) => ({ ...p, categorias: null }))
  }

  function validar() {
    const errs = {}
    if (!nombre.trim()) errs.nombre = 'Requerido'
    if (!apellido.trim()) errs.apellido = 'Requerido'
    if (!edad || isNaN(parseInt(edad)) || parseInt(edad) < 3 || parseInt(edad) > 100) errs.edad = 'Ingresá una edad válida'
    if (!genero) errs.genero = 'Seleccioná el sexo'
    if (categoriasIds.size === 0) errs.categorias = 'Seleccioná al menos una categoría'
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
      cinturon: cinturon || null,
      categoria_ids: [...categoriasIds],
    })

    setNombre(''); setApellido(''); setEdad('')
    setPeso(''); setGenero(''); setCinturon('')
    setCategoriasIds(new Set()); setErrores({}); setBusqueda('')
  }

  const termino = busqueda.trim().toLowerCase()
  const categoriasFiltradas = (categorias ?? []).filter((c) => {
    if (!termino) return true
    const modalidadLabel = (MODALIDAD_LABEL[c.modalidad] ?? c.modalidad ?? '').toLowerCase()
    return c.nombre.toLowerCase().includes(termino) || modalidadLabel.includes(termino)
  })

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

      {/* Sexo */}
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

      {/* Cinturón */}
      <div>
        <label className={LABEL}>Cinturón</label>
        <select
          value={cinturon}
          onChange={(e) => setCinturon(e.target.value)}
          className={INPUT}
        >
          <option value="">Sin especificar</option>
          {CINTURONES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        {cinturon && (() => {
          const nivel = clasificarCinturon(cinturon)
          return nivel ? (
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${NIVEL_COLOR[nivel]}`}>
              {NIVEL_LABEL[nivel]}
            </span>
          ) : null
        })()}
      </div>

      {/* Categorías — buscador */}
      <div>
        <label className={LABEL}>
          Categorías
          {categoriasIds.size > 0 && (
            <span className="ml-2 normal-case font-normal text-zinc-500">
              ({categoriasIds.size} seleccionada{categoriasIds.size !== 1 ? 's' : ''})
            </span>
          )}
        </label>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o modalidad (ej: kumite, mayor, -84kg)..."
          className={`${INPUT} mb-2`}
        />

        <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-700/60 p-2 space-y-1">
          {categoriasFiltradas.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">Sin resultados para "{busqueda}"</p>
          )}
          {categoriasFiltradas.map((cat) => {
            const checked = categoriasIds.has(cat.id)
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  checked
                    ? 'bg-rose-950/30 border-rose-700/50 text-zinc-100'
                    : 'bg-zinc-800/50 border-transparent text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategoria(cat.id)}
                  className="w-4 h-4 accent-rose-600 shrink-0"
                />
                <span className="text-sm flex-1 leading-snug">{cat.nombre}</span>
              </label>
            )
          })}
        </div>

        {errores.categorias && <p className="text-rose-400 text-xs mt-2">{errores.categorias}</p>}
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
