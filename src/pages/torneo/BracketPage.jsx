import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowsClockwise, UserPlus, X } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../lib/torneos'
import { fetchCategorias } from '../../lib/categorias'
import { fetchCompetidores, insertCompetidor } from '../../lib/competidores'
import { insertInscripcion } from '../../lib/inscripciones'
import useCombateStore from '../../stores/useCombateStore'
import BracketView from '../../components/brackets/BracketView'

const FORM_INICIAL = { nombre: '', apellido: '', fecha_nacimiento: '', peso: '', genero: '' }

export default function BracketPage() {
  const { id: torneoId, catId } = useParams()
  const navigate = useNavigate()

  const [torneo, setTorneo] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [competidores, setCompetidores] = useState([])
  const [loadingCtx, setLoadingCtx] = useState(true)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [mostrarFormAgregar, setMostrarFormAgregar] = useState(false)
  const [modoAgregar, setModoAgregar] = useState('nuevo') // 'nuevo' | 'existente'
  const [formAgregar, setFormAgregar] = useState(FORM_INICIAL)
  const [erroresAgregar, setErroresAgregar] = useState({})
  const [competidoresTorneo, setCompetidoresTorneo] = useState([])
  const [loadingTorneo, setLoadingTorneo] = useState(false)
  const [busquedaExistente, setBusquedaExistente] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [advertenciaRegen, setAdvertenciaRegen] = useState(null) // { fn: () => Promise }
  const [loadingAgregar, setLoadingAgregar] = useState(false)

  const { combates, loading, error, fetchCombates, resetBracket, generarBracket, declararGanador } = useCombateStore()

  useEffect(() => {
    async function cargar() {
      try {
        const [t, cats, comps] = await Promise.all([
          fetchTorneoById(torneoId),
          fetchCategorias(torneoId),
          fetchCompetidores(torneoId),
        ])
        setTorneo(t)
        const cat = cats.find((c) => c.id === catId)
        if (!cat) { navigate(`/torneo/${torneoId}/categorias`); return }
        setCategoria(cat)
        setCompetidores(comps.filter((c) => c.inscripciones?.some((i) => i.categoria_id === catId)))
      } catch {
        navigate('/')
      } finally {
        setLoadingCtx(false)
      }
    }
    cargar()
    fetchCombates(catId)
  }, [torneoId, catId, fetchCombates, navigate])

  if (loadingCtx) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pendientes = combates.filter((c) => c.estado === 'pendiente').length
  const finalizados = combates.filter((c) => c.estado === 'finalizado').length
  const total = combates.filter((c) => c.estado !== 'bye').length

  async function handleRegenerarBracket() {
    try {
      await resetBracket(catId)
      await generarBracket(catId, categoria.tatami_id, competidores)
      setConfirmRegen(false)
    } catch {
      setConfirmRegen(false)
    }
  }

  function cerrarFormAgregar() {
    setMostrarFormAgregar(false)
    setModoAgregar('nuevo')
    setFormAgregar(FORM_INICIAL)
    setErroresAgregar({})
    setSeleccionado(null)
    setBusquedaExistente('')
  }

  async function cargarCompetidoresTorneo() {
    if (competidoresTorneo.length > 0) return
    setLoadingTorneo(true)
    try {
      const todos = await fetchCompetidores(torneoId)
      setCompetidoresTorneo(todos)
    } finally {
      setLoadingTorneo(false)
    }
  }

  function handleCambiarModo(modo) {
    setModoAgregar(modo)
    setSeleccionado(null)
    setBusquedaExistente('')
    if (modo === 'existente') cargarCompetidoresTorneo()
  }

  function handleCambioFormAgregar(e) {
    const { name, value } = e.target
    setFormAgregar((prev) => ({ ...prev, [name]: value }))
    if (erroresAgregar[name]) setErroresAgregar((prev) => ({ ...prev, [name]: null }))
  }

  function handleSubmitAgregar(e) {
    e.preventDefault()
    if (modoAgregar === 'existente') {
      if (!seleccionado) return
      const fn = () => ejecutarInscribirExistente(seleccionado)
      if (finalizados > 0) { setAdvertenciaRegen({ fn }); return }
      fn()
      return
    }
    const errs = {}
    if (!formAgregar.nombre.trim()) errs.nombre = 'Requerido'
    if (!formAgregar.apellido.trim()) errs.apellido = 'Requerido'
    if (!formAgregar.genero) errs.genero = 'Requerido'
    if (Object.keys(errs).length > 0) { setErroresAgregar(errs); return }
    const fn = () => ejecutarAgregarNuevo({ ...formAgregar })
    if (finalizados > 0) { setAdvertenciaRegen({ fn }); return }
    fn()
  }

  async function regenerarConLista(lista) {
    await resetBracket(catId)
    await generarBracket(catId, categoria.tatami_id, lista)
  }

  async function ejecutarAgregarNuevo(datos) {
    setLoadingAgregar(true)
    try {
      await insertCompetidor({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        fecha_nacimiento: datos.fecha_nacimiento || null,
        peso: datos.peso ? parseFloat(datos.peso) : null,
        genero: datos.genero,
        modalidad: categoria.modalidad,
        torneo_id: torneoId,
        categoria_id: catId,
      })
      const comps = await fetchCompetidores(torneoId)
      const actualizados = comps.filter((c) => c.inscripciones?.some((i) => i.categoria_id === catId))
      setCompetidores(actualizados)
      await regenerarConLista(actualizados)
      cerrarFormAgregar()
      setAdvertenciaRegen(null)
    } catch {
      // error visible en el store
    } finally {
      setLoadingAgregar(false)
    }
  }

  async function ejecutarInscribirExistente(comp) {
    setLoadingAgregar(true)
    try {
      await insertInscripcion(comp.id, catId, torneoId)
      const comps = await fetchCompetidores(torneoId)
      const actualizados = comps.filter((c) => c.inscripciones?.some((i) => i.categoria_id === catId))
      setCompetidores(actualizados)
      await regenerarConLista(actualizados)
      cerrarFormAgregar()
      setAdvertenciaRegen(null)
    } catch {
      // error visible en el store
    } finally {
      setLoadingAgregar(false)
    }
  }

  return (
    <div className="max-w-full px-4 py-6">
      <button
        onClick={() => navigate(`/torneo/${torneoId}/categorias`)}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 mb-5 transition-colors"
      >
        <ArrowLeft size={13} />
        {torneo?.nombre} / Categorías
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight leading-tight">
            {categoria?.nombre}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Bracket · {competidores.length} competidores
            {total > 0 && ` · ${finalizados}/${total} combates finalizados`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!confirmRegen && !mostrarFormAgregar && (
            <button
              onClick={() => setMostrarFormAgregar(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserPlus size={12} />
              Agregar
            </button>
          )}
          {combates.length === 0 && categoria?.estado === 'cerrada' && categoria?.tatami_id && !mostrarFormAgregar && (
            <button
              onClick={() => generarBracket(catId, categoria.tatami_id, competidores)}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-white bg-rose-700 hover:bg-rose-600 border border-rose-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowsClockwise size={12} />
              Generar bracket
            </button>
          )}
          {combates.length > 0 && !confirmRegen && !mostrarFormAgregar && (
            <button
              onClick={() => setConfirmRegen(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowsClockwise size={12} />
              Regenerar
            </button>
          )}
          {confirmRegen && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400">¿Borrar y regenerar bracket?</span>
              <button
                onClick={handleRegenerarBracket}
                disabled={loading}
                className="text-xs bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmRegen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
            categoria?.estado === 'cerrada'
              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
              : categoria?.estado === 'en_curso'
              ? 'bg-orange-950/50 text-orange-400 border-orange-900/50'
              : 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50'
          }`}>
            {categoria?.estado}
          </span>
        </div>
      </div>

      {mostrarFormAgregar && (() => {
        const yaEnCategoria = new Set(competidores.map((c) => c.id))
        const disponibles = competidoresTorneo.filter((c) =>
          !yaEnCategoria.has(c.id) &&
          (busquedaExistente === '' ||
            `${c.nombre} ${c.apellido}`.toLowerCase().includes(busquedaExistente.toLowerCase()))
        )
        const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

        return (
          <div className="mb-5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-zinc-200">Agregar competidor al bracket</p>
              <button onClick={cerrarFormAgregar} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-zinc-800/60 p-1 rounded-lg w-fit">
              {['nuevo', 'existente'].map((modo) => (
                <button
                  key={modo}
                  type="button"
                  onClick={() => handleCambiarModo(modo)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    modoAgregar === modo
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {modo === 'nuevo' ? 'Nuevo competidor' : 'Atleta existente'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitAgregar} className="space-y-3">
              {modoAgregar === 'nuevo' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input type="text" name="nombre" value={formAgregar.nombre}
                        onChange={handleCambioFormAgregar} placeholder="Nombre *" className={INPUT} />
                      {erroresAgregar.nombre && <p className="text-rose-400 text-xs mt-1">{erroresAgregar.nombre}</p>}
                    </div>
                    <div>
                      <input type="text" name="apellido" value={formAgregar.apellido}
                        onChange={handleCambioFormAgregar} placeholder="Apellido *" className={INPUT} />
                      {erroresAgregar.apellido && <p className="text-rose-400 text-xs mt-1">{erroresAgregar.apellido}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <select name="genero" value={formAgregar.genero}
                        onChange={handleCambioFormAgregar} className={INPUT}>
                        <option value="">Género *</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                      {erroresAgregar.genero && <p className="text-rose-400 text-xs mt-1">{erroresAgregar.genero}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Nacimiento</label>
                      <input type="date" name="fecha_nacimiento" value={formAgregar.fecha_nacimiento}
                        onChange={handleCambioFormAgregar} className={INPUT} />
                    </div>
                    <input type="number" name="peso" value={formAgregar.peso}
                      onChange={handleCambioFormAgregar} placeholder="Peso (kg)"
                      step="0.1" min="0" className={INPUT} />
                  </div>
                </>
              )}

              {modoAgregar === 'existente' && (
                <div>
                  <input
                    type="text" value={busquedaExistente}
                    onChange={(e) => { setBusquedaExistente(e.target.value); setSeleccionado(null) }}
                    placeholder="Buscar por nombre..."
                    className={INPUT}
                  />
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800">
                    {loadingTorneo && (
                      <p className="text-xs text-zinc-500 px-3 py-3">Cargando...</p>
                    )}
                    {!loadingTorneo && disponibles.length === 0 && (
                      <p className="text-xs text-zinc-600 px-3 py-3">
                        {competidoresTorneo.length === 0
                          ? 'No hay competidores en este torneo'
                          : 'Todos los competidores ya están en esta categoría'}
                      </p>
                    )}
                    {disponibles.map((c) => (
                      <button
                        key={c.id} type="button"
                        onClick={() => setSeleccionado(c)}
                        className={`w-full text-left px-3 py-2.5 transition-colors ${
                          seleccionado?.id === c.id
                            ? 'bg-rose-950/40 text-zinc-100'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-sm font-medium">{c.nombre} {c.apellido}</span>
                        {c.dojo?.nombre && (
                          <span className="ml-2 text-xs text-zinc-500">{c.dojo.nombre}</span>
                        )}
                        {seleccionado?.id === c.id && (
                          <span className="float-right text-xs text-rose-400 font-semibold">✓ Seleccionado</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loadingAgregar || (modoAgregar === 'existente' && !seleccionado)}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors disabled:opacity-40"
                >
                  {loadingAgregar ? 'Guardando...' : 'Agregar y regenerar bracket'}
                </button>
                <button type="button" onClick={cerrarFormAgregar}
                  className="text-zinc-400 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )
      })()}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && combates.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && combates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-400 font-medium mb-1">No hay bracket generado</p>
          <p className="text-zinc-600 text-sm">
            Cerrá las inscripciones desde la página de Categorías para generar el bracket.
          </p>
        </div>
      )}

      {combates.length > 0 && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <BracketView
            combates={combates}
            competidores={competidores}
            onDeclararGanador={(combateId, ganadorId) => declararGanador(combateId, ganadorId, catId)}
          />
        </div>
      )}

      {advertenciaRegen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-sm font-semibold text-zinc-100 mb-2">¿Agregar y regenerar?</p>
            <p className="text-xs text-zinc-400 mb-5">
              Este bracket ya tiene <span className="text-amber-400 font-semibold">{finalizados} combate{finalizados !== 1 ? 's' : ''} jugado{finalizados !== 1 ? 's' : ''}</span>.
              Al agregar el competidor, el bracket se reinicia con la nueva distribución y esos resultados se perderán.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAdvertenciaRegen(null)}
                className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => advertenciaRegen.fn()}
                disabled={loadingAgregar}
                className="flex-1 bg-rose-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {loadingAgregar ? 'Procesando...' : 'Agregar y regenerar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
