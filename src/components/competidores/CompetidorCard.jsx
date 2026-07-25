import { useState } from 'react'
import { calcularEdad } from '../../lib/competidores'
import useCompetidorStore from '../../stores/useCompetidorStore'
import { useParams } from 'react-router-dom'

const MODALIDAD_BADGE = {
  kumite_individual: 'bg-amber-950/50 text-amber-400 border border-amber-900/50',
  kumite_equipo: 'bg-orange-950/50 text-orange-400 border border-orange-900/50',
  kata_individual: 'bg-sky-950/50 text-sky-400 border border-sky-900/50',
  kata_equipo: 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50',
}

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Ind.',
  kumite_equipo: 'Kumite Eq.',
  kata_individual: 'Kata Ind.',
  kata_equipo: 'Kata Eq.',
}

export default function CompetidorCard({ competidor, torneoEstado, categorias = [] }) {
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [mostrarAgregarCat, setMostrarAgregarCat] = useState(false)
  const [guardandoCat, setGuardandoCat] = useState(false)

  const { id: torneoId } = useParams()
  const { removeCompetidor, inscribirEnCategoria, quitarDeCategoria } = useCompetidorStore()

  const puedeEliminar = torneoEstado === 'borrador' || torneoEstado === 'inscripciones'
  const puedeEditarCats = torneoEstado === 'borrador' || torneoEstado === 'inscripciones'
  const edad = calcularEdad(competidor.fecha_nacimiento)

  const inscripcionIds = new Set(competidor.inscripciones?.map((i) => i.categoria_id) ?? [])
  const disponibles = categorias.filter((c) => !inscripcionIds.has(c.id) && c.estado === 'abierta')

  async function handleAgregarCategoria(catId) {
    setGuardandoCat(true)
    try {
      await inscribirEnCategoria(competidor.id, catId, torneoId)
      setMostrarAgregarCat(false)
    } catch { /* error en store */ }
    finally { setGuardandoCat(false) }
  }

  async function handleQuitarCategoria(catId) {
    try { await quitarDeCategoria(competidor.id, catId) } catch { /* error en store */ }
  }

  async function handleEliminar() {
    try { await removeCompetidor(competidor.id) } catch { /* error en store */ }
    setConfirmarEliminar(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="font-semibold text-zinc-100 text-sm">
              {competidor.nombre} {competidor.apellido}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODALIDAD_BADGE[competidor.modalidad] || 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
              {MODALIDAD_LABEL[competidor.modalidad] || competidor.modalidad}
            </span>
            {competidor.inscripcion_manual && (
              <span className="text-xs bg-rose-950/50 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded-full font-medium">
                Manual
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-500">
            {competidor.dojo?.nombre || 'Sin dojo'}
            {competidor.pais ? ` · ${competidor.pais}` : ''}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5 tabular-nums">
            {edad !== null ? `${edad} años` : 'Edad no registrada'}
            {competidor.peso ? ` · ${competidor.peso} kg` : ''}
            {competidor.cinturon ? ` · ${competidor.cinturon}` : ''}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
            {competidor.inscripciones?.map((i) => (
              <span key={i.categoria_id} className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-rose-400/80 border border-zinc-700 px-2 py-0.5 rounded-full font-medium">
                {i.categoria?.nombre ?? '—'}
                {puedeEditarCats && (
                  <button
                    onClick={() => handleQuitarCategoria(i.categoria_id)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors leading-none"
                    title="Quitar categoría"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {puedeEditarCats && disponibles.length > 0 && !mostrarAgregarCat && (
              <button
                onClick={() => setMostrarAgregarCat(true)}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                + categoría
              </button>
            )}
          </div>

          {mostrarAgregarCat && (
            <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
              <div className="max-h-40 overflow-y-auto">
                {disponibles.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleAgregarCategoria(cat.id)}
                    disabled={guardandoCat}
                    className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors disabled:opacity-50 border-b border-zinc-700/50 last:border-0"
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMostrarAgregarCat(false)}
                className="w-full text-xs text-zinc-600 hover:text-zinc-400 py-1.5 transition-colors border-t border-zinc-700"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {puedeEliminar && (
          <button onClick={() => setConfirmarEliminar(true)}
            className="text-xs text-zinc-600 hover:text-rose-400 font-medium shrink-0 transition-colors">
            Eliminar
          </button>
        )}
      </div>

      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar inscripción</h3>
            <p className="text-zinc-400 text-sm mb-5">
              ¿Eliminás a <strong className="text-zinc-200">{competidor.nombre} {competidor.apellido}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarEliminar(false)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
