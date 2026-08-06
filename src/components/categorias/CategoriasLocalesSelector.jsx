import { useState } from 'react'
import { X, CheckSquare, Square } from '@phosphor-icons/react'
import { CATEGORIAS_LOCALES, GRUPOS_LOCALES } from '../../lib/categoriasLocales'

const NIVEL_STYLE = {
  principiante: { text: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-900/40' },
  intermedio:   { text: 'text-amber-400',   dot: 'bg-amber-500',   border: 'border-amber-900/40'   },
  avanzado:     { text: 'text-rose-400',    dot: 'bg-rose-500',    border: 'border-rose-900/40'    },
}

const MODALIDAD_LABEL = {
  kata_individual:   'Kata Individual',
  kumite_individual: 'Kumite Individual',
}

export default function CategoriasLocalesSelector({ categoriasExistentes = [], onImportar, onCancel, loading }) {
  const nombresExistentes = new Set(categoriasExistentes.map((c) => c.nombre))
  const [seleccionadas, setSeleccionadas] = useState(new Set())

  function toggleCategoria(nombre) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  function toggleNivel(nivel) {
    const grupo = CATEGORIAS_LOCALES.filter(
      (c) => c.nivel === nivel && !nombresExistentes.has(c.nombre)
    )
    const todosSeleccionados = grupo.every((c) => seleccionadas.has(c.nombre))
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      grupo.forEach((c) => (todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre)))
      return next
    })
  }

  function toggleNivelModalidad(nivel, modalidad) {
    const grupo = CATEGORIAS_LOCALES.filter(
      (c) => c.nivel === nivel && c.modalidad === modalidad && !nombresExistentes.has(c.nombre)
    )
    const todosSeleccionados = grupo.every((c) => seleccionadas.has(c.nombre))
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      grupo.forEach((c) => (todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre)))
      return next
    })
  }

  function seleccionarTodas() {
    const disponibles = CATEGORIAS_LOCALES
      .filter((c) => !nombresExistentes.has(c.nombre))
      .map((c) => c.nombre)
    setSeleccionadas(new Set(disponibles))
  }

  function limpiarSeleccion() {
    setSeleccionadas(new Set())
  }

  function handleImportar() {
    const cats = CATEGORIAS_LOCALES.filter((c) => seleccionadas.has(c.nombre))
    onImportar(cats)
  }

  const disponiblesTotal = CATEGORIAS_LOCALES.filter((c) => !nombresExistentes.has(c.nombre)).length

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100 text-base">Categorías Locales</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {seleccionadas.size > 0
                ? `${seleccionadas.size} seleccionada${seleccionadas.size !== 1 ? 's' : ''}`
                : `${disponiblesTotal} disponibles — organizadas por nivel de cinturón`}
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

        {/* Lista por nivel → modalidad */}
        <div className="px-5 py-4 space-y-8 max-h-[60vh] overflow-y-auto">
          {GRUPOS_LOCALES.map((grupo) => {
            const style = NIVEL_STYLE[grupo.nivel]
            const disponiblesNivel = CATEGORIAS_LOCALES.filter(
              (c) => c.nivel === grupo.nivel && !nombresExistentes.has(c.nombre)
            )
            const selNivel = disponiblesNivel.filter((c) => seleccionadas.has(c.nombre))
            const todosNivel = disponiblesNivel.length > 0 && selNivel.length === disponiblesNivel.length

            const modalidades = [...new Set(
              CATEGORIAS_LOCALES.filter((c) => c.nivel === grupo.nivel).map((c) => c.modalidad)
            )]

            return (
              <div key={grupo.nivel}>
                {/* Encabezado de nivel */}
                <button
                  onClick={() => toggleNivel(grupo.nivel)}
                  className={`flex items-center gap-2 w-full mb-4 pb-2 border-b ${style.border} group`}
                  disabled={disponiblesNivel.length === 0}
                >
                  <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${style.text}`}>
                    {grupo.label}
                  </span>
                  <span className="text-xs text-zinc-600 ml-1">{grupo.sub}</span>
                  <span className="text-xs text-zinc-600 ml-2">
                    {selNivel.length}/{disponiblesNivel.length}
                  </span>
                  {disponiblesNivel.length > 0 && (
                    <span className={`ml-auto text-xs transition-colors ${todosNivel ? style.text : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                      {todosNivel ? 'Deseleccionar todas' : 'Seleccionar todas'}
                    </span>
                  )}
                </button>

                {/* Sub-grupos por modalidad */}
                <div className="space-y-4">
                  {modalidades.map((modalidad) => {
                    const cats = CATEGORIAS_LOCALES.filter(
                      (c) => c.nivel === grupo.nivel && c.modalidad === modalidad
                    )
                    const disponiblesM = cats.filter((c) => !nombresExistentes.has(c.nombre))
                    const selM = disponiblesM.filter((c) => seleccionadas.has(c.nombre))
                    const todosM = disponiblesM.length > 0 && selM.length === disponiblesM.length

                    return (
                      <div key={modalidad}>
                        <button
                          onClick={() => toggleNivelModalidad(grupo.nivel, modalidad)}
                          className="flex items-center gap-2 w-full mb-2 group"
                          disabled={disponiblesM.length === 0}
                        >
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            {MODALIDAD_LABEL[modalidad] || modalidad}
                          </span>
                          <span className="text-xs text-zinc-700">
                            {selM.length}/{disponiblesM.length}
                          </span>
                          {disponiblesM.length > 0 && (
                            <span className={`ml-auto text-[11px] transition-colors ${todosM ? 'text-zinc-400' : 'text-zinc-700 group-hover:text-zinc-500'}`}>
                              {todosM ? 'Quitar' : 'Todas'}
                            </span>
                          )}
                        </button>

                        <div className="space-y-0.5">
                          {cats.map((cat) => {
                            const yaExiste = nombresExistentes.has(cat.nombre)
                            const estaSeleccionada = seleccionadas.has(cat.nombre)
                            return (
                              <button
                                key={cat.nombre}
                                onClick={() => !yaExiste && toggleCategoria(cat.nombre)}
                                disabled={yaExiste}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-colors ${
                                  yaExiste
                                    ? 'opacity-40 cursor-not-allowed'
                                    : estaSeleccionada
                                      ? 'bg-rose-950/40 border border-rose-900/50'
                                      : 'hover:bg-zinc-800 border border-transparent'
                                }`}
                              >
                                {yaExiste ? (
                                  <CheckSquare size={14} className="text-zinc-600 shrink-0" />
                                ) : estaSeleccionada ? (
                                  <CheckSquare size={14} className="text-rose-400 shrink-0" />
                                ) : (
                                  <Square size={14} className="text-zinc-600 shrink-0" />
                                )}
                                <span className={`text-sm ${yaExiste ? 'text-zinc-500' : 'text-zinc-200'}`}>
                                  {cat.nombre}
                                </span>
                                {yaExiste && (
                                  <span className="ml-auto text-xs text-zinc-600">Ya existe</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
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
