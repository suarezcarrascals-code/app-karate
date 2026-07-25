import { useState, useMemo } from 'react'
import { calcularEdad, encontrarCategoriasCompatibles } from '../../lib/competidores'

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Ind.',
  kumite_equipo: 'Kumite Eq.',
  kata_individual: 'Kata Ind.',
  kata_equipo: 'Kata Eq.',
}

const INICIAL = {
  nombre: '', apellido: '', dojo_id: '', pais: '',
  fecha_nacimiento: '', peso: '', cinturon: '', genero: '',
}

const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

export default function CompetidorForm({ onSubmit, onCancel, loading, categorias = [], dojos = [] }) {
  const [campos, setCampos] = useState(INICIAL)
  const [seleccionadas, setSeleccionadas] = useState([])
  const [errores, setErrores] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setCampos((prev) => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }))
  }

  function toggleCategoria(catId) {
    setSeleccionadas((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
    if (errores.categorias) setErrores((prev) => ({ ...prev, categorias: null }))
  }

  const compatibles = useMemo(() => {
    if (!campos.genero) return {}
    const competidorParcial = {
      genero: campos.genero,
      fecha_nacimiento: campos.fecha_nacimiento || null,
      peso: campos.peso ? parseFloat(campos.peso) : null,
    }
    return categorias.reduce((acc, cat) => {
      const matches = encontrarCategoriasCompatibles({ ...competidorParcial, modalidad: cat.modalidad }, [cat])
      acc[cat.id] = matches.length > 0
      return acc
    }, {})
  }, [campos.genero, campos.fecha_nacimiento, campos.peso, categorias])

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!campos.nombre.trim()) errs.nombre = 'Obligatorio'
    if (!campos.apellido.trim()) errs.apellido = 'Obligatorio'
    if (!campos.genero) errs.genero = 'Obligatorio'
    if (seleccionadas.length === 0) errs.categorias = 'Seleccioná al menos una categoría'
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const categoriasSeleccionadas = categorias.filter((c) => seleccionadas.includes(c.id))
    const fueraDeRango = categoriasSeleccionadas.filter((c) => compatibles[c.id] === false)

    onSubmit({
      datosBase: {
        nombre: campos.nombre.trim(),
        apellido: campos.apellido.trim(),
        dojo_id: campos.dojo_id || null,
        pais: campos.pais.trim() || null,
        fecha_nacimiento: campos.fecha_nacimiento || null,
        peso: campos.peso ? parseFloat(campos.peso) : null,
        cinturon: campos.cinturon.trim() || null,
        genero: campos.genero,
      },
      categoriasSeleccionadas,
      fueraDeRango,
    })
  }

  const categoriasAbiertas = categorias.filter((c) => c.estado === 'abierta')

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Nuevo competidor</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <input type="text" name="nombre" value={campos.nombre} onChange={handleChange}
            placeholder="Nombre *" className={INPUT} />
          {errores.nombre && <p className="text-rose-400 text-xs mt-1">{errores.nombre}</p>}
        </div>
        <div>
          <input type="text" name="apellido" value={campos.apellido} onChange={handleChange}
            placeholder="Apellido *" className={INPUT} />
          {errores.apellido && <p className="text-rose-400 text-xs mt-1">{errores.apellido}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <select name="dojo_id" value={campos.dojo_id} onChange={handleChange} className={INPUT}>
            <option value="">Dojo (opcional)</option>
            {dojos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          {dojos.length === 0 && <p className="text-xs text-zinc-600 mt-1">No hay dojos creados.</p>}
        </div>
        <input type="text" name="pais" value={campos.pais} onChange={handleChange}
          placeholder="País" className={INPUT} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <select name="genero" value={campos.genero} onChange={handleChange} className={INPUT}>
            <option value="">Género *</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
          {errores.genero && <p className="text-rose-400 text-xs mt-1">{errores.genero}</p>}
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={campos.fecha_nacimiento} onChange={handleChange}
            className={INPUT} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input type="number" name="peso" value={campos.peso} onChange={handleChange}
          placeholder="Peso (kg)" step="0.1" min="0" className={INPUT} />
        <input type="text" name="cinturon" value={campos.cinturon} onChange={handleChange}
          placeholder="Cinturón" className={INPUT} />
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-400 mb-2">Categorías *</p>
        {categoriasAbiertas.length === 0 ? (
          <p className="text-xs text-zinc-600">No hay categorías abiertas en este torneo.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categoriasAbiertas.map((cat) => {
              const esSel = seleccionadas.includes(cat.id)
              const esCompatible = compatibles[cat.id]
              const tieneInfo = campos.genero || campos.fecha_nacimiento || campos.peso

              return (
                <label key={cat.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    esSel
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-zinc-700/60 bg-zinc-800/40 hover:border-zinc-600'
                  }`}
                >
                  <input type="checkbox" checked={esSel} onChange={() => toggleCategoria(cat.id)}
                    className="mt-0.5 rounded border-zinc-600 bg-zinc-800 text-rose-600 focus:ring-rose-500/40" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-200">{cat.nombre}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded">
                        {MODALIDAD_LABEL[cat.modalidad] || cat.modalidad}
                      </span>
                      {tieneInfo && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          esCompatible
                            ? 'bg-emerald-950/40 text-emerald-500'
                            : 'bg-orange-950/40 text-orange-400'
                        }`}>
                          {esCompatible ? 'Compatible' : 'Fuera de rango'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {cat.genero && `${cat.genero.charAt(0).toUpperCase() + cat.genero.slice(1)}`}
                      {cat.edad_min != null && cat.edad_max != null && ` · ${cat.edad_min}–${cat.edad_max} años`}
                      {cat.peso_max != null && ` · hasta ${cat.peso_max} kg`}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
        {errores.categorias && <p className="text-rose-400 text-xs mt-1">{errores.categorias}</p>}
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
