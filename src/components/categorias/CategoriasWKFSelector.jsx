import { useState } from 'react'
import { X, CheckSquare, Square } from '@phosphor-icons/react'
import { CATEGORIAS_WKF, GRUPOS_WKF } from '../../lib/categoriasWKF'

const MODALIDAD_COLOR = {
  kumite_individual: 'text-amber-400',
  kumite_equipo:     'text-orange-400',
  kata_individual:   'text-sky-400',
  kata_equipo:       'text-cyan-400',
}

export default function CategoriasWKFSelector({ torneoId, categoriasExistentes = [], onImportar, onCancel, loading }) {
  const nombresExistentes = new Set(categoriasExistentes.map((c) => c.nombre))

  const [seleccionadas, setSeleccionadas] = useState(new Set())

  function toggleCategoria(nombre) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  function toggleGrupo(modalidad) {
    const grupo = CATEGORIAS_WKF.filter(
      (c) => c.modalidad === modalidad && !nombresExistentes.has(c.nombre)
    )
    const todosSeleccionados = grupo.every((c) => seleccionadas.has(c.nombre))
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      grupo.forEach((c) =>
        todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre)
      )
      return next
    })
  }

  function seleccionarTodas() {
    const disponibles = CATEGORIAS_WKF
      .filter((c) => !nombresExistentes.has(c.nombre))
      .map((c) => c.nombre)
    setSeleccionadas(new Set(disponibles))
  }

  function limpiarSeleccion() {
    setSeleccionadas(new Set())
  }

  function handleImportar() {
    const cats = CATEGORIAS_WKF.filter((c) => seleccionadas.has(c.nombre))
    onImportar(cats)
  }

  const disponiblesTotal = CATEGORIAS_WKF.filter((c) => !nombresExistentes.has(c.nombre)).length

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100 text-base">Categorías WKF 2026</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {seleccionadas.size > 0
                ? `${seleccionadas.size} seleccionada${seleccionadas.size !== 1 ? 's' : ''}`
                : `${disponiblesTotal} disponibles`}
            </p>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60">
          <button
            onClick={seleccionarTodas}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            Seleccionar todas
          </button>
          <span className="text-zinc-700">·</span>
          <button
            onClick={limpiarSeleccion}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Limpiar selección
          </button>
        </div>

        {/* Lista por modalidad */}
        <div className="px-5 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {GRUPOS_WKF.map((grupo) => {
            const cats = CATEGORIAS_WKF.filter((c) => c.modalidad === grupo.modalidad)
            const disponibles = cats.filter((c) => !nombresExistentes.has(c.nombre))
            const seleccionadasGrupo = disponibles.filter((c) => seleccionadas.has(c.nombre))
            const todosSeleccionados = disponibles.length > 0 && seleccionadasGrupo.length === disponibles.length

            return (
              <div key={grupo.modalidad}>
                {/* Encabezado de grupo */}
                <button
                  onClick={() => toggleGrupo(grupo.modalidad)}
                  className="flex items-center gap-2 w-full mb-3 group"
                  disabled={disponibles.length === 0}
                >
                  <span className={`text-xs font-bold uppercase tracking-widest ${MODALIDAD_COLOR[grupo.modalidad]}`}>
                    {grupo.label}
                  </span>
                  <span className="text-xs text-zinc-600 ml-1">
                    {seleccionadasGrupo.length}/{disponibles.length}
                  </span>
                  {disponibles.length > 0 && (
                    <span className={`ml-auto text-xs transition-colors ${todosSeleccionados ? 'text-rose-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                      {todosSeleccionados ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </span>
                  )}
                </button>

                {/* Categorías */}
                <div className="space-y-1">
                  {cats.map((cat) => {
                    const yaExiste = nombresExistentes.has(cat.nombre)
                    const estaSeleccionada = seleccionadas.has(cat.nombre)

                    return (
                      <button
                        key={cat.nombre}
                        onClick={() => !yaExiste && toggleCategoria(cat.nombre)}
                        disabled={yaExiste}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          yaExiste
                            ? 'opacity-40 cursor-not-allowed'
                            : estaSeleccionada
                              ? 'bg-rose-950/40 border border-rose-900/50'
                              : 'hover:bg-zinc-800 border border-transparent'
                        }`}
                      >
                        {yaExiste ? (
                          <CheckSquare size={15} className="text-zinc-600 shrink-0" />
                        ) : estaSeleccionada ? (
                          <CheckSquare size={15} className="text-rose-400 shrink-0" />
                        ) : (
                          <Square size={15} className="text-zinc-600 shrink-0" />
                        )}
                        <span className={`text-sm ${yaExiste ? 'text-zinc-500' : 'text-zinc-200'}`}>
                          {cat.nombre}
                        </span>
                        {yaExiste && (
                          <span className="ml-auto text-xs text-zinc-600">Ya existe</span>
                        )}
                        {!yaExiste && cat.peso_max && (
                          <span className="ml-auto text-xs text-zinc-600 shrink-0">
                            {cat.edad_min}{cat.edad_max ? `–${cat.edad_max}` : '+'} años
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
            onClick={handleImportar}
            disabled={seleccionadas.size === 0 || loading}
            className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors disabled:opacity-40"
          >
            {loading
              ? 'Creando...'
              : `Crear ${seleccionadas.size} categoría${seleccionadas.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
