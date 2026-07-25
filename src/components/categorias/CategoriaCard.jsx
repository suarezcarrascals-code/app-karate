import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UsersThree, Trash, UserPlus } from '@phosphor-icons/react'
import useTatamiStore from '../../stores/useTatamiStore'
import useCategoriaStore from '../../stores/useCategoriaStore'
import useCompetidorStore from '../../stores/useCompetidorStore'
import useCombateStore from '../../stores/useCombateStore'
import AsignarTatamiForm from './AsignarTatamiForm'
import HistorialMovimientos from './HistorialMovimientos'
import EquipoForm from '../competidores/EquipoForm'
import EquipoCard from '../competidores/EquipoCard'
import AkaAoPanel from '../competidores/AkaAoPanel'

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Ind.',
  kumite_equipo: 'Kumite Eq.',
  kata_individual: 'Kata Ind.',
  kata_equipo: 'Kata Eq.',
}

const MODALIDAD_BADGE = {
  kumite_individual: 'bg-amber-950/50 text-amber-400 border border-amber-900/50',
  kumite_equipo: 'bg-orange-950/50 text-orange-400 border border-orange-900/50',
  kata_individual: 'bg-sky-950/50 text-sky-400 border border-sky-900/50',
  kata_equipo: 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50',
}

const ESTADO_BADGE = {
  abierta: 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50',
  cerrada: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
  en_curso: 'bg-orange-950/50 text-orange-400 border border-orange-900/50',
  finalizada: 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/50',
}

const NIVEL_BADGE = {
  principiante: 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/40',
  intermedio: 'bg-yellow-950/40 text-yellow-500 border border-yellow-900/40',
  avanzado: 'bg-rose-950/40 text-rose-400 border border-rose-900/40',
}

const NIVEL_LABEL = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }
const ESTADO_LABEL = { abierta: 'Abierta', cerrada: 'Cerrada', en_curso: 'En curso', finalizada: 'Finalizada' }

export default function CategoriaCard({ categoria, competidoresTorneo = [], seleccionada = false, onToggleSeleccion = null }) {
  const [mostrarAsignar, setMostrarAsignar]     = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [mostrarEquipos, setMostrarEquipos]     = useState(false)
  const [modoEquipos, setModoEquipos]           = useState('manual') // 'manual' | 'aleatorio' | 'akaao'
  const [mostrarFormEquipo, setMostrarFormEquipo] = useState(false)
  const [infoAleatorio, setInfoAleatorio]       = useState(null)
  const [modalCerrar, setModalCerrar]           = useState(false)
  const [modalEliminar, setModalEliminar]       = useState(false)
  const [modalAgregar, setModalAgregar]         = useState(false)
  const [busquedaAgregar, setBusquedaAgregar]   = useState('')
  const [eliminando, setEliminando]             = useState(false)
  const [generando, setGenerando]               = useState(false)
  const [agregando, setAgregando]               = useState(false)
  const [errorBracket, setErrorBracket]         = useState(null)

  const navigate = useNavigate()
  const { id: torneoId } = useParams()

  const tatamis = useTatamiStore((s) => s.tatamis)
  const { asignarTatami, loading, cerrarInscripciones, removeCategoria } = useCategoriaStore()
  const { generarBracket: generarBracketStore } = useCombateStore()
  const {
    equipos, loading: loadingEq, error: errorEq,
    fetchEquipos, addEquipo, addEquiposAleatorios, removeEquipo,
    asignarLadosAleatorio, limpiarLados, inscribirEnCategoria,
  } = useCompetidorStore()

  const tatamiActual = tatamis.find((t) => t.id === categoria.tatami_id)
  const esMover      = !!categoria.tatami_id
  const esEquipo     = categoria.modalidad?.includes('_equipo')
  const esKumiteEq   = categoria.modalidad === 'kumite_equipo'

  const competidoresCat = competidoresTorneo.filter((c) =>
    c.inscripciones?.some((i) => i.categoria_id === categoria.id)
  )
  const equiposCat      = equipos.filter((e) => e.categoria_id === categoria.id)

  useEffect(() => {
    if (mostrarEquipos && esEquipo) fetchEquipos(categoria.id)
  }, [mostrarEquipos, esEquipo, categoria.id, fetchEquipos])

  async function handleCerrarYGenerar() {
    setGenerando(true)
    setErrorBracket(null)
    try {
      await cerrarInscripciones(categoria.id)
      await generarBracketStore(categoria.id, categoria.tatami_id, competidoresCat)
      setModalCerrar(false)
      navigate(`/torneo/${torneoId}/categoria/${categoria.id}/bracket`)
    } catch (err) {
      setErrorBracket(err?.message || 'Error desconocido')
    } finally {
      setGenerando(false)
    }
  }

  async function handleAgregarExistente(competidorId) {
    setAgregando(true)
    try {
      await inscribirEnCategoria(competidorId, categoria.id, torneoId)
      setModalAgregar(false)
      setBusquedaAgregar('')
    } catch { /* error en store */ }
    finally { setAgregando(false) }
  }

  async function handleEliminar() {
    setEliminando(true)
    try {
      await removeCategoria(categoria.id)
    } catch {
      setModalEliminar(false)
    } finally {
      setEliminando(false)
    }
  }

  async function handleAsignar({ tatamiId, orden, tatamiAnteriorId, motivo }) {
    try {
      await asignarTatami(categoria.id, tatamiId, orden, tatamiAnteriorId, motivo)
      setMostrarAsignar(false)
    } catch { /* error en store */ }
  }

  async function handleCrearEquipo(datos) {
    try {
      await addEquipo(datos)
      setMostrarFormEquipo(false)
    } catch { /* error visible en banner */ }
  }

  async function handleDistribuirAleatorio() {
    setInfoAleatorio(null)
    try {
      const result = await addEquiposAleatorios(competidoresCat, equiposCat, categoria.id)
      setInfoAleatorio(result)
    } catch { /* error visible en banner */ }
  }

  async function handleAsignarLados() {
    try { await asignarLadosAleatorio(competidoresCat) } catch { /* error visible en banner */ }
  }

  async function handleLimpiarLados() {
    try { await limpiarLados(categoria.id, competidoresCat) } catch { /* error visible en banner */ }
  }

  function handleToggleEquipos() {
    setMostrarEquipos((v) => !v)
    setMostrarFormEquipo(false)
    setInfoAleatorio(null)
  }

  const MODOS = [
    { key: 'manual',   label: 'Manual' },
    { key: 'aleatorio', label: 'Aleatorio' },
    ...(esKumiteEq ? [{ key: 'akaao', label: 'Aka / Ao' }] : []),
  ]

  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 hover:border-zinc-700 transition-colors ${seleccionada ? 'border-rose-600/60 bg-rose-950/5' : 'border-zinc-800'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {onToggleSeleccion && (
          <button
            type="button"
            onClick={() => onToggleSeleccion(categoria.id)}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              seleccionada ? 'border-rose-500 bg-rose-500' : 'border-zinc-600 hover:border-zinc-400'
            }`}
          >
            {seleccionada && <div className="w-2 h-2 bg-white rounded-full" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100 text-sm leading-snug mb-2">{categoria.nombre}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODALIDAD_BADGE[categoria.modalidad] || 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
              {MODALIDAD_LABEL[categoria.modalidad] || categoria.modalidad}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[categoria.estado] || 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
              {ESTADO_LABEL[categoria.estado] || categoria.estado}
            </span>
            {categoria.nivel && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NIVEL_BADGE[categoria.nivel] || 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                {NIVEL_LABEL[categoria.nivel]}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {categoria.genero ? categoria.genero.charAt(0).toUpperCase() + categoria.genero.slice(1) : ''}
            {categoria.edad_min != null && categoria.edad_max != null && ` · ${categoria.edad_min}–${categoria.edad_max} años`}
            {categoria.peso_max != null && ` · hasta ${categoria.peso_max} kg`}
          </p>
          <p className="text-xs mt-1 font-medium">
            {tatamiActual
              ? <span className="text-rose-400/80">{tatamiActual.nombre} · Orden {categoria.orden_en_tatami}</span>
              : <span className="text-zinc-600">Sin tatami asignado</span>}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {categoria.estado === 'abierta' && competidoresCat.length >= 2 && (
            <button onClick={() => setModalCerrar(true)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Cerrar y generar bracket
            </button>
          )}
          {categoria.estado === 'abierta' && (
            <button
              onClick={() => setModalAgregar(true)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <UserPlus size={12} />
              Inscribir existente
            </button>
          )}
          {(categoria.estado === 'cerrada' || categoria.estado === 'en_curso') && (
            <button onClick={() => navigate(`/torneo/${torneoId}/categoria/${categoria.id}/bracket`)}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors">
              Ver bracket →
            </button>
          )}
          <button onClick={() => setMostrarAsignar(true)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
            {esMover ? 'Mover tatami' : 'Asignar tatami'}
          </button>
          {esEquipo && (
            <button onClick={handleToggleEquipos}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <UsersThree size={12} />
              Equipos {equiposCat.length > 0 && `(${equiposCat.length})`}
            </button>
          )}
          <button onClick={() => setMostrarHistorial((v) => !v)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            {mostrarHistorial ? 'Ocultar historial' : 'Historial'}
          </button>
          {categoria.estado === 'abierta' && (
            <button
              onClick={() => setModalEliminar(true)}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-rose-400 transition-colors mt-1"
            >
              <Trash size={12} />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {mostrarHistorial && <HistorialMovimientos categoriaId={categoria.id} />}

      {/* Sección equipos */}
      {mostrarEquipos && esEquipo && (
        <div className="mt-4 border-t border-zinc-800 pt-4">

          {/* Roster de competidores */}
          {competidoresCat.length > 0 && (() => {
            const enEquipo = new Set(
              equiposCat.flatMap((e) => [e.miembro_1_id, e.miembro_2_id, e.miembro_3_id])
            )
            return (
              <div className="mb-4">
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  Competidores ({competidoresCat.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {competidoresCat.map((c) => {
                    const asignado = enEquipo.has(c.id)
                    return (
                      <span key={c.id} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        asignado
                          ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {c.nombre} {c.apellido}
                      </span>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
                    Libre ({competidoresCat.filter((c) => !enEquipo.has(c.id)).length})
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <span className="w-2 h-2 rounded-full bg-rose-700 shrink-0" />
                    En equipo ({competidoresCat.filter((c) => enEquipo.has(c.id)).length})
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Selector de modo */}
          <div className="flex items-center gap-1 mb-4 bg-zinc-800/60 rounded-lg p-1 w-fit">
            {MODOS.map((m) => (
              <button key={m.key} onClick={() => { setModoEquipos(m.key); setMostrarFormEquipo(false); setInfoAleatorio(null) }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  modoEquipos === m.key
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {errorEq && (
            <p className="text-rose-400 text-xs mb-3 bg-rose-950/30 border border-rose-900/50 px-3 py-2 rounded-lg">
              Error: {errorEq}
            </p>
          )}

          {/* ── MODO MANUAL ── */}
          {modoEquipos === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500">
                  {equiposCat.length} equipo{equiposCat.length !== 1 ? 's' : ''} · {competidoresCat.length} competidores
                </p>
                {!mostrarFormEquipo && (
                  <button onClick={() => setMostrarFormEquipo(true)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">
                    + Crear equipo
                  </button>
                )}
              </div>

              {mostrarFormEquipo && (
                <EquipoForm
                  categoriaId={categoria.id}
                  competidores={competidoresCat}
                  equipos={equiposCat}
                  onSubmit={handleCrearEquipo}
                  onCancel={() => setMostrarFormEquipo(false)}
                  loading={loadingEq}
                />
              )}

              {loadingEq && !mostrarFormEquipo && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingEq && equiposCat.length === 0 && !mostrarFormEquipo && (
                <p className="text-xs text-zinc-600 text-center py-4">
                  No hay equipos. Seleccioná un club y elegí 3 miembros.
                </p>
              )}

              {equiposCat.length > 0 && (
                <div className="space-y-2">
                  {equiposCat.map((eq) => (
                    <EquipoCard key={eq.id} equipo={eq} competidores={competidoresCat} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MODO ALEATORIO ── */}
          {modoEquipos === 'aleatorio' && (
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <button
                  onClick={handleDistribuirAleatorio}
                  disabled={loadingEq || competidoresCat.length < 3}
                  className="bg-rose-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-500 transition-colors disabled:opacity-50 active:scale-95">
                  {loadingEq ? 'Distribuyendo...' : 'Distribuir en equipos de 3'}
                </button>
                <span className="text-xs text-zinc-600">
                  {competidoresCat.length} competidores disponibles
                </span>
              </div>

              {infoAleatorio && (
                <p className="text-xs text-emerald-400 mb-3">
                  {infoAleatorio.creados} equipo{infoAleatorio.creados !== 1 ? 's' : ''} creado{infoAleatorio.creados !== 1 ? 's' : ''}
                  {infoAleatorio.excluidos > 0 && ` · ${infoAleatorio.excluidos} competidor${infoAleatorio.excluidos !== 1 ? 'es' : ''} sin equipo (no múltiplo de 3)`}
                </p>
              )}

              {competidoresCat.length < 3 && (
                <p className="text-xs text-amber-400/80 mb-3">
                  Necesitás al menos 3 competidores en esta categoría.
                </p>
              )}

              {equiposCat.length === 0 && !infoAleatorio && (
                <p className="text-xs text-zinc-600 text-center py-4">
                  Presioná el botón para formar equipos aleatorios de 3.
                </p>
              )}

              {equiposCat.length > 0 && (
                <div className="space-y-2">
                  {equiposCat.map((eq) => (
                    <EquipoCard key={eq.id} equipo={eq} competidores={competidoresCat} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MODO AKA / AO (solo kumite_equipo) ── */}
          {modoEquipos === 'akaao' && (
            <AkaAoPanel
              competidores={competidoresCat}
              onAsignar={handleAsignarLados}
              onLimpiar={handleLimpiarLados}
              loading={loadingEq}
            />
          )}
        </div>
      )}

      {/* Modal inscribir competidor existente */}
      {modalAgregar && (() => {
        const disponibles = competidoresTorneo.filter(
          (c) => !c.inscripciones?.some((i) => i.categoria_id === categoria.id)
        )
        const filtrados = disponibles.filter((c) =>
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(busquedaAgregar.toLowerCase())
        )
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-semibold text-zinc-100 text-base mb-1">Inscribir en {categoria.nombre}</h3>
              <p className="text-xs text-zinc-500 mb-3">
                Seleccioná un competidor ya registrado en el torneo para añadirlo a esta categoría.
              </p>
              <input
                value={busquedaAgregar}
                onChange={(e) => setBusquedaAgregar(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 mb-3 outline-none focus:border-zinc-500"
              />
              <div className="max-h-52 overflow-y-auto space-y-1.5 mb-4">
                {filtrados.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center py-4">
                    {busquedaAgregar
                      ? 'No se encontraron competidores'
                      : disponibles.length === 0
                      ? 'Todos los competidores del torneo ya están en esta categoría'
                      : 'Sin resultados'}
                  </p>
                )}
                {filtrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAgregarExistente(c.id)}
                    disabled={agregando}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 group"
                  >
                    <span className="text-sm font-medium text-zinc-100 group-hover:text-white">
                      {c.nombre} {c.apellido}
                    </span>
                    {c.inscripciones?.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {c.inscripciones.map((i) => i.categoria?.nombre).filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setModalAgregar(false); setBusquedaAgregar('') }}
                disabled={agregando}
                className="w-full bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )
      })()}

      {/* Modal cerrar inscripciones */}
      {modalCerrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Cerrar inscripciones</h3>
            <p className="text-zinc-400 text-sm mb-1">
              Se generará el bracket de eliminación directa con{' '}
              <strong className="text-zinc-200">{competidoresCat.length} competidores</strong>.
            </p>
            <p className="text-xs text-zinc-600 mb-4">
              Esta acción es irreversible. No se podrán inscribir más competidores.
            </p>
            {errorBracket && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 px-3 py-2 rounded-lg mb-4">
                Error: {errorBracket}
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalCerrar(false)} disabled={generando}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleCerrarYGenerar} disabled={generando}
                className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {generando ? 'Generando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar categoría */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar categoría</h3>
            <p className="text-zinc-400 text-sm mb-1">
              ¿Eliminar <strong className="text-zinc-200">{categoria.nombre}</strong>?
            </p>
            {competidoresCat.length > 0 && (
              <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900/50 px-3 py-2 rounded-lg mb-3">
                Esta categoría tiene {competidoresCat.length} competidor{competidoresCat.length !== 1 ? 'es' : ''} inscrito{competidoresCat.length !== 1 ? 's' : ''}. También serán eliminados.
              </p>
            )}
            <p className="text-xs text-zinc-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(false)}
                disabled={eliminando}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="flex-1 bg-rose-700 text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarAsignar && (
        <AsignarTatamiForm
          categoria={categoria}
          tatamis={tatamis}
          onSubmit={handleAsignar}
          onCancel={() => setMostrarAsignar(false)}
          loading={loading}
        />
      )}
    </div>
  )
}
