import { useState } from 'react'
import { X, CheckSquare, Square, Star } from '@phosphor-icons/react'
import { CATEGORIAS_LOCALES, PRESET_SIN_PESO, GRUPOS_LOCALES } from '../../lib/categoriasLocales'

const NIVEL_STYLE = {
  principiante: { text: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-900/40' },
  intermedio:   { text: 'text-amber-400',   dot: 'bg-amber-500',   border: 'border-amber-900/40'   },
  avanzado:     { text: 'text-rose-400',    dot: 'bg-rose-500',    border: 'border-rose-900/40'    },
}

const MODALIDAD_LABEL = {
  kata_individual:   'Kata Individual',
  kumite_individual: 'Kumite Individual',
}

// Pool unificado (sin peso + con peso), deduplicado por nombre
const POOL = [...new Map(
  [...CATEGORIAS_LOCALES, ...PRESET_SIN_PESO].map((c) => [c.nombre, c])
).values()]

const GRUPOS_EDAD_SIN_PESO = [
  { label: 'Sub-8',  edad_min: 6  },
  { label: 'Sub-10', edad_min: 8  },
  { label: 'Sub-12', edad_min: 10 },
  { label: 'Sub-14', edad_min: 12 },
  { label: 'Cadete', edad_min: 14 },
  { label: 'Junior', edad_min: 16 },
  { label: 'Mayor',  edad_min: 18 },
]

export default function CategoriasLocalesSelector({ categoriasExistentes = [], onImportar, onCancel, loading }) {
  const nombresExistentes = new Set(categoriasExistentes.map((c) => c.nombre))
  const [seleccionadas, setSeleccionadas] = useState(new Set())
  const [vista, setVista] = useState('recomendadas') // 'recomendadas' | 'todas'

  function toggleCategoria(nombre) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  function toggleGrupo(cats) {
    const disponibles = cats.filter((c) => !nombresExistentes.has(c.nombre))
    const todosSeleccionados = disponibles.every((c) => seleccionadas.has(c.nombre))
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      disponibles.forEach((c) => todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre))
      return next
    })
  }

  function seleccionarTodasSinPeso() {
    const disponibles = PRESET_SIN_PESO.filter((c) => !nombresExistentes.has(c.nombre))
    setSeleccionadas((prev) => new Set([...prev, ...disponibles.map((c) => c.nombre)]))
  }

  function toggleNivel(nivel) {
    const grupo = CATEGORIAS_LOCALES.filter((c) => c.nivel === nivel && !nombresExistentes.has(c.nombre))
    const todosSeleccionados = grupo.every((c) => seleccionadas.has(c.nombre))
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      grupo.forEach((c) => todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre))
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
      grupo.forEach((c) => todosSeleccionados ? next.delete(c.nombre) : next.add(c.nombre))
      return next
    })
  }

  function seleccionarTodas() {
    const disponibles = CATEGORIAS_LOCALES.filter((c) => !nombresExistentes.has(c.nombre)).map((c) => c.nombre)
    setSeleccionadas(new Set(disponibles))
  }

  function limpiarSeleccion() {
    setSeleccionadas(new Set())
  }

  function handleImportar() {
    const cats = POOL.filter((c) => seleccionadas.has(c.nombre))
    onImportar(cats)
  }

  const disponiblesTotal = CATEGORIAS_LOCALES.filter((c) => !nombresExistentes.has(c.nombre)).length
  const disponiblesSinPeso = PRESET_SIN_PESO.filter((c) => !nombresExistentes.has(c.nombre)).length

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
                : 'Organizadas por nivel de cinturón'}
            </p>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setVista('recomendadas')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              vista === 'recomendadas'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Star size={13} weight={vista === 'recomendadas' ? 'fill' : 'regular'} />
            Recomendadas sin peso
          </button>
          <button
            onClick={() => setVista('todas')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              vista === 'todas'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todas (con peso)
          </button>
        </div>

        {/* Vista: Recomendadas sin peso */}
        {vista === 'recomendadas' && (
          <div className="px-5 py-4">
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-300 mb-0.5">Kumite + Kata sin división de peso</p>
                  <p className="text-xs text-zinc-500">
                    {disponiblesSinPeso} categorías · 7 grupos de edad · 3 niveles · Masculino y Femenino
                  </p>
                </div>
                <button
                  onClick={seleccionarTodasSinPeso}
                  className="shrink-0 text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Seleccionar todas
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-zinc-600">Seleccionar por edad:</span>
            </div>

            <div className="space-y-3 max-h-[52vh] overflow-y-auto">
              {GRUPOS_EDAD_SIN_PESO.map((grupo) => {
                const cats = PRESET_SIN_PESO.filter((c) => c.edad_min === grupo.edad_min)
                const disponibles = cats.filter((c) => !nombresExistentes.has(c.nombre))
                const selCount = disponibles.filter((c) => seleccionadas.has(c.nombre)).length
                const todosSeleccionados = disponibles.length > 0 && selCount === disponibles.length

                return (
                  <div key={grupo.label} className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleGrupo(cats)}
                      disabled={disponibles.length === 0}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                        todosSeleccionados ? 'bg-amber-950/30' : 'bg-zinc-800/40 hover:bg-zinc-800'
                      } disabled:opacity-40`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-200">{grupo.label}</span>
                        <span className="text-xs text-zinc-500">
                          {selCount}/{disponibles.length}
                        </span>
                      </div>
                      <span className={`text-xs font-medium transition-colors ${todosSeleccionados ? 'text-amber-400' : 'text-zinc-600'}`}>
                        {todosSeleccionados ? 'Quitar todas' : 'Seleccionar todas'}
                      </span>
                    </button>

                    <div className="p-2 grid grid-cols-1 gap-0.5">
                      {cats.map((cat) => {
                        const yaExiste = nombresExistentes.has(cat.nombre)
                        const estaSeleccionada = seleccionadas.has(cat.nombre)
                        return (
                          <button
                            key={cat.nombre}
                            onClick={() => !yaExiste && toggleCategoria(cat.nombre)}
                            disabled={yaExiste}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors ${
                              yaExiste
                                ? 'opacity-40 cursor-not-allowed'
                                : estaSeleccionada
                                  ? 'bg-amber-950/30 border border-amber-900/40'
                                  : 'hover:bg-zinc-800 border border-transparent'
                            }`}
                          >
                            {yaExiste ? (
                              <CheckSquare size={13} className="text-zinc-600 shrink-0" />
                            ) : estaSeleccionada ? (
                              <CheckSquare size={13} className="text-amber-400 shrink-0" />
                            ) : (
                              <Square size={13} className="text-zinc-600 shrink-0" />
                            )}
                            <span className={`text-xs ${yaExiste ? 'text-zinc-500' : 'text-zinc-300'}`}>
                              {cat.nombre}
                            </span>
                            {yaExiste && <span className="ml-auto text-xs text-zinc-600">Ya existe</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vista: Todas (con peso) */}
        {vista === 'todas' && (
          <>
            <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60">
              <button onClick={seleccionarTodas} className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">
                Seleccionar todas
              </button>
              <span className="text-zinc-700">·</span>
              <button onClick={limpiarSeleccion} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                Limpiar selección
              </button>
              <span className="text-xs text-zinc-600 ml-auto">{disponiblesTotal} disponibles</span>
            </div>

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
                              <span className="text-xs text-zinc-700">{selM.length}/{disponiblesM.length}</span>
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
                                    {yaExiste && <span className="ml-auto text-xs text-zinc-600">Ya existe</span>}
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
          </>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={limpiarSeleccion}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2"
          >
            Limpiar
          </button>
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
