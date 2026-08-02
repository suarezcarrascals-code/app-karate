import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { calcularVotoJuez } from '../../lib/scoring'

const JUECES = ['j1', 'j2', 'j3', 'j4', 'j5']

function inferirJuecesActivos(combate) {
  if (!combate || combate.j1_rojo === null || combate.j1_rojo === undefined) return JUECES
  return combate.j4_rojo !== null && combate.j4_rojo !== undefined ? JUECES : JUECES.slice(0, 3)
}

function calcularVotos(combate) {
  if (!combate) return []
  const activos = inferirJuecesActivos(combate)
  return activos.map((j) => {
    const rojo = combate[`${j}_rojo`]
    const azul = combate[`${j}_azul`]
    if (rojo !== null && rojo !== undefined && azul !== null && azul !== undefined) {
      try {
        return calcularVotoJuez({ aka: parseFloat(rojo), ao: parseFloat(azul) }) === 'aka' ? 'rojo' : 'azul'
      } catch {
        return null
      }
    }
    return null
  })
}

export default function MesaKataTVPage() {
  const { token, catId, combateId } = useParams()

  const [torneo, setTorneo] = useState(null)
  const [tatami, setTatami] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [compRojo, setCompRojo] = useState(null)
  const [compAzul, setCompAzul] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [maxRonda, setMaxRonda] = useState(1)

  const intervalRef = useRef(null)
  const compIdsRef = useRef({ rojo: null, azul: null })

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  // Carga inicial: link, categoría, competidores, max ronda
  useEffect(() => {
    async function init() {
      // Resolver token → link → tatami → torneo
      const { data: link } = await supabase
        .from('link_mesa')
        .select('tatami:tatami_id(id, nombre, torneo_id, torneo:torneo_id(id, nombre))')
        .eq('token', token)
        .eq('activo', true)
        .single()

      if (link?.tatami) {
        setTatami(link.tatami)
        setTorneo(link.tatami.torneo)
      }

      const { data: cat } = await supabase
        .from('categoria')
        .select('id, nombre, modalidad')
        .eq('id', catId)
        .single()
      if (cat) setCategoria(cat)

      const { data: todosCombates } = await supabase
        .from('combate')
        .select('ronda')
        .eq('categoria_id', catId)
      if (todosCombates?.length) {
        setMaxRonda(Math.max(...todosCombates.map((x) => x.ronda)))
      }

      // Primera lectura del combate
      await pollCombate()
    }
    init()
  }, [token, catId, combateId]) // eslint-disable-line

  async function pollCombate() {
    const { data: c } = await supabase
      .from('combate')
      .select('*')
      .eq('id', combateId)
      .single()

    if (!c) return
    setCombate(c)

    // Cargar nombres de competidores si cambiaron
    if (c.competidor_rojo_id && c.competidor_rojo_id !== compIdsRef.current.rojo) {
      compIdsRef.current.rojo = c.competidor_rojo_id
      const { data: r } = await supabase
        .from('competidor')
        .select('id, nombre, apellido, dojo:dojo_id(nombre)')
        .eq('id', c.competidor_rojo_id)
        .single()
      if (r) setCompRojo(r)
    }
    if (c.competidor_azul_id && c.competidor_azul_id !== compIdsRef.current.azul) {
      compIdsRef.current.azul = c.competidor_azul_id
      const { data: a } = await supabase
        .from('competidor')
        .select('id, nombre, apellido, dojo:dojo_id(nombre)')
        .eq('id', c.competidor_azul_id)
        .single()
      if (a) setCompAzul(a)
    }
  }

  // Polling cada 500ms
  useEffect(() => {
    intervalRef.current = setInterval(pollCombate, 500)
    return () => clearInterval(intervalRef.current)
  }, [combateId]) // eslint-disable-line

  function nombreComp(comp) {
    if (!comp) return '—'
    return `${comp.nombre} ${comp.apellido}`
  }

  function labelRonda() {
    if (!combate) return ''
    if (combate.orden_en_ronda === 0) return '3er Puesto'
    if (combate.ronda === maxRonda) return 'Final'
    if (combate.ronda === maxRonda - 1 && maxRonda > 1) return 'Semifinal'
    return `Ronda ${combate.ronda}`
  }

  const juecesActivos = inferirJuecesActivos(combate)
  const votos = calcularVotos(combate)
  const votosRojo = votos.filter((v) => v === 'rojo').length
  const votosAzul = votos.filter((v) => v === 'azul').length

  const ganadorRojo = combate?.ganador_id && combate.ganador_id === combate?.competidor_rojo_id
  const ganadorAzul = combate?.ganador_id && combate.ganador_id === combate?.competidor_azul_id

  // Tiene puntajes AKA confirmados
  const tieneRojo = combate && combate.j1_rojo !== null
  // Tiene puntajes AO confirmados
  const tieneAzul = combate && combate.j1_azul !== null

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-zinc-300">{torneo?.nombre ?? '—'}</span>
          <span className="text-xs text-zinc-600">{tatami?.nombre} · {categoria?.nombre}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-400">{labelRonda()}</span>
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Banner ganador */}
      {(ganadorRojo || ganadorAzul) && (
        <div className={`py-3 text-center text-xl font-black tracking-widest uppercase ${
          ganadorRojo ? 'bg-rose-800 text-white' : 'bg-sky-800 text-white'
        }`}>
          {ganadorRojo ? `GANADOR AKA · ${nombreComp(compRojo)}` : `GANADOR AO · ${nombreComp(compAzul)}`}
        </div>
      )}

      {/* Grid principal AO ← → AKA */}
      <div className="flex flex-1 min-h-0">

        {/* AO — izquierda */}
        <div className={`flex-1 flex flex-col p-6 border-r border-zinc-800 ${ganadorAzul ? 'bg-sky-900/30' : 'bg-sky-950/10'}`}>
          {/* Nombre */}
          <div className="mb-4">
            <p className="text-xs font-black text-sky-500 tracking-widest uppercase mb-1">AO</p>
            <p className="text-3xl font-black text-zinc-100 leading-tight break-words">{nombreComp(compAzul)}</p>
            {compAzul?.dojo?.nombre && (
              <p className="text-sm text-zinc-500 mt-1">{compAzul.dojo.nombre}</p>
            )}
            {combate?.kata_anunciado_azul && (
              <p className="text-base text-sky-300 font-semibold mt-2 italic">{combate.kata_anunciado_azul}</p>
            )}
          </div>

          {/* Tabla puntajes AO */}
          <div className="flex-1 flex flex-col gap-3">
            {juecesActivos.map((j, idx) => {
              const score = combate ? combate[`${j}_azul`] : null
              const voto = votos[idx]
              const ganEsteJuez = voto === 'azul'
              return (
                <div key={j} className="flex items-center gap-4">
                  <span className="text-sm text-zinc-600 font-semibold w-8">J{idx + 1}</span>
                  <div className={`flex-1 h-12 rounded-xl flex items-center justify-center text-2xl font-black tabular-nums
                    ${score !== null && score !== undefined
                      ? ganEsteJuez
                        ? 'bg-sky-700 text-white'
                        : 'bg-zinc-800 text-zinc-300'
                      : 'bg-zinc-900 text-zinc-700'
                    }`}>
                    {score !== null && score !== undefined ? parseFloat(score).toFixed(1) : '—'}
                  </div>
                  {voto && (
                    <div className={`w-8 text-center text-xl font-black ${ganEsteJuez ? 'text-sky-400' : 'text-zinc-700'}`}>
                      {ganEsteJuez ? '◀' : '▶'}
                    </div>
                  )}
                  {!voto && <div className="w-8" />}
                </div>
              )
            })}
          </div>

          {/* Total votos AO */}
          {tieneAzul && (
            <div className="mt-4 text-center">
              <span className="text-5xl font-black text-sky-400 tabular-nums">{votosAzul}</span>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mt-1">votos AO</p>
            </div>
          )}
        </div>

        {/* AKA — derecha */}
        <div className={`flex-1 flex flex-col p-6 ${ganadorRojo ? 'bg-rose-900/30' : 'bg-rose-950/10'}`}>
          {/* Nombre */}
          <div className="mb-4">
            <p className="text-xs font-black text-rose-500 tracking-widest uppercase mb-1">AKA</p>
            <p className="text-3xl font-black text-zinc-100 leading-tight break-words">{nombreComp(compRojo)}</p>
            {compRojo?.dojo?.nombre && (
              <p className="text-sm text-zinc-500 mt-1">{compRojo.dojo.nombre}</p>
            )}
            {combate?.kata_anunciado_rojo && (
              <p className="text-base text-rose-300 font-semibold mt-2 italic">{combate.kata_anunciado_rojo}</p>
            )}
          </div>

          {/* Tabla puntajes AKA */}
          <div className="flex-1 flex flex-col gap-3">
            {juecesActivos.map((j, idx) => {
              const score = combate ? combate[`${j}_rojo`] : null
              const voto = votos[idx]
              const ganEsteJuez = voto === 'rojo'
              return (
                <div key={j} className="flex items-center gap-4 flex-row-reverse">
                  <span className="text-sm text-zinc-600 font-semibold w-8 text-right">J{idx + 1}</span>
                  <div className={`flex-1 h-12 rounded-xl flex items-center justify-center text-2xl font-black tabular-nums
                    ${score !== null && score !== undefined
                      ? ganEsteJuez
                        ? 'bg-rose-700 text-white'
                        : 'bg-zinc-800 text-zinc-300'
                      : 'bg-zinc-900 text-zinc-700'
                    }`}>
                    {score !== null && score !== undefined ? parseFloat(score).toFixed(1) : '—'}
                  </div>
                  {voto && (
                    <div className={`w-8 text-center text-xl font-black ${ganEsteJuez ? 'text-rose-400' : 'text-zinc-700'}`}>
                      {ganEsteJuez ? '▶' : '◀'}
                    </div>
                  )}
                  {!voto && <div className="w-8" />}
                </div>
              )
            })}
          </div>

          {/* Total votos AKA */}
          {tieneAzul && (
            <div className="mt-4 text-center">
              <span className="text-5xl font-black text-rose-400 tabular-nums">{votosRojo}</span>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mt-1">votos AKA</p>
            </div>
          )}
        </div>
      </div>

      {/* Estado en curso / en anuncio */}
      {!ganadorRojo && !ganadorAzul && combate && (
        <div className="py-2 text-center border-t border-zinc-800">
          {combate.estado === 'pendiente' && (
            <span className="text-xs text-zinc-600 uppercase tracking-widest">Esperando inicio</span>
          )}
          {combate.estado === 'en_curso' && !tieneAzul && !tieneRojo && (
            <span className="text-xs text-zinc-500 uppercase tracking-widest">En anuncio</span>
          )}
          {combate.estado === 'en_curso' && tieneRojo && !tieneAzul && (
            <span className="text-xs text-amber-500 uppercase tracking-widest">AO actuando…</span>
          )}
          {combate.estado === 'en_curso' && tieneRojo && tieneAzul && (
            <span className="text-xs text-emerald-500 uppercase tracking-widest">Calculando resultado</span>
          )}
        </div>
      )}
    </div>
  )
}
