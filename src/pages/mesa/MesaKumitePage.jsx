import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TelevisionSimple } from '@phosphor-icons/react'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias } from '../../lib/categorias'
import { sincronizarMarcador, avanzarGanador } from '../../lib/combates'
import { fetchCompetidores } from '../../lib/competidores'
import { supabase } from '../../lib/supabase'

const DURACION_DEFAULT = 180

function fmtTime(seg) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function calcularDuracion(categoria) {
  if (!categoria) return DURACION_DEFAULT
  const maxEdad = categoria.edad_max
  if (maxEdad != null && maxEdad <= 13) return 90
  if (maxEdad != null && maxEdad <= 17) return 120
  return 180
}

const MARCADOR_INICIAL = {
  puntosRojo: 0, yukoRojo: 0, wazaAriRojo: 0, ipponRojo: 0,
  puntosAzul: 0, yukoAzul: 0, wazaAriAzul: 0, ipponAzul: 0,
  c1Rojo: 0, c2Rojo: 0,
  c1Azul: 0, c2Azul: 0,
  senshu: null,
}

// Niveles: 0=none, 1=W(Chui), 2=K(Keikoku), 3=HC(Hansoku-chui), 4=H(Hansoku)
const PENAL_NIVELES = [
  { nivel: 1, label: 'W' },
  { nivel: 2, label: 'K' },
  { nivel: 3, label: 'HC' },
  { nivel: 4, label: 'H' },
]

const PENAL_LABEL = ['—', 'W', 'K', 'HC', 'H']
const PENAL_TITLE = ['—', 'Chui', 'Keikoku (+1 rival)', 'Hansoku-chui', 'Hansoku (DQ)']

function PenalRows({ lado, c1, c2, descalificado, onSet }) {
  const activeClass = lado === 'azul' ? 'bg-sky-600 text-white' : 'bg-rose-600 text-white'

  return (
    <div className="space-y-1.5">
      {[{ fila: 'c1', nivel: c1 }, { fila: 'c2', nivel: c2 }].map(({ fila, nivel }) => (
        <div key={fila} className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-zinc-600 w-5 shrink-0 text-center">
            {fila.toUpperCase()}
          </span>
          {PENAL_NIVELES.map(({ nivel: n, label }) => {
            const esActivo = nivel === n
            const esPasado = nivel > n
            const bloqueado = descalificado || n <= nivel
            return (
              <button
                key={n}
                disabled={bloqueado}
                onClick={() => onSet(lado, fila, n)}
                className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors ${
                  esActivo
                    ? activeClass
                    : esPasado
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 disabled:cursor-not-allowed'
                }`}
              >
                {esPasado ? '·' : label}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function MesaKumitePage() {
  const { token, catId, combateId } = useParams()
  const navigate = useNavigate()

  const [link, setLink] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [rojo, setRojo] = useState(null)
  const [azul, setAzul] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sinCombates, setSinCombates] = useState(false)

  const [marcador, setMarcador] = useState(MARCADOR_INICIAL)
  const [historial, setHistorial] = useState([])
  const [timerSeg, setTimerSeg] = useState(DURACION_DEFAULT)
  const [timerActivo, setTimerActivo] = useState(false)
  const [atoShibaraku, setAtoShibaraku] = useState(false)

  const [modalFin, setModalFin] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmPenalizacion, setConfirmPenalizacion] = useState(null) // { lado, fila, nivel }
  const [confirmReset, setConfirmReset] = useState(false)

  const duracion = calcularDuracion(categoria)
  const syncRef = useRef(null)

  const descalificadoRojo = marcador.c1Rojo >= 4 || marcador.c2Rojo >= 4
  const descalificadoAzul = marcador.c1Azul >= 4 || marcador.c2Azul >= 4

  // Carga inicial — usa combateId del URL
  useEffect(() => {
    async function cargar() {
      const linkData = await fetchLinkMesaByToken(token)
      if (!linkData) { navigate('/'); return }
      setLink(linkData)

      const { data: combateData, error } = await supabase
        .from('combate')
        .select('*')
        .eq('id', combateId)
        .single()

      if (error || !combateData) { navigate(`/mesa/${token}/categoria/${catId}`); return }
      if (!combateData.competidor_rojo_id || !combateData.competidor_azul_id) {
        setSinCombates(true); setLoading(false); return
      }

      const [cats, comps] = await Promise.all([
        fetchCategorias(linkData.torneo_id),
        fetchCompetidores(linkData.torneo_id),
      ])
      const cat = cats.find((c) => c.id === catId)
      if (!cat) { navigate(`/mesa/${token}`); return }
      setCategoria(cat)
      setTimerSeg(calcularDuracion(cat))

      setCombate(combateData)
      setRojo(comps.find((c) => c.id === combateData.competidor_rojo_id) ?? null)
      setAzul(comps.find((c) => c.id === combateData.competidor_azul_id) ?? null)
      setLoading(false)
    }
    cargar()
  }, [token, catId, combateId, navigate])

  // Timer
  useEffect(() => {
    if (!timerActivo) return
    const id = setInterval(() => {
      setTimerSeg((prev) => {
        if (prev <= 1) { setTimerActivo(false); clearInterval(id); return 0 }
        if (prev === 16) setAtoShibaraku(true)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActivo])

  // Sync al DB (debounced 800ms) — resiliente: si c1/c2 no existen aún, sincroniza igual sin ellos
  useEffect(() => {
    if (!combate) return
    if (syncRef.current) clearTimeout(syncRef.current)
    syncRef.current = setTimeout(async () => {
      const base = {
        puntos_rojo: marcador.puntosRojo,
        puntos_azul: marcador.puntosAzul,
        yuko_rojo: marcador.yukoRojo, waza_ari_rojo: marcador.wazaAriRojo, ippon_rojo: marcador.ipponRojo,
        yuko_azul: marcador.yukoAzul, waza_ari_azul: marcador.wazaAriAzul, ippon_azul: marcador.ipponAzul,
        senshu: marcador.senshu,
        estado: 'en_curso',
      }
      const { error } = await supabase.from('combate').update({
        ...base,
        c1_rojo: marcador.c1Rojo, c2_rojo: marcador.c2Rojo,
        c1_azul: marcador.c1Azul, c2_azul: marcador.c2Azul,
      }).eq('id', combate.id)
      if (error) {
        // Fallback: columnas c1/c2 no existen todavía — sincroniza al menos los scores
        await supabase.from('combate').update(base).eq('id', combate.id).catch(() => {})
      }
    }, 800)
    return () => { if (syncRef.current) clearTimeout(syncRef.current) }
  }, [marcador, combate])

  // ── Puntuación ──────────────────────────────────────────────────────────────

  const puntuar = useCallback((lado, tipo) => {
    setHistorial((h) => [...h, { ...marcador }])
    const pts = tipo === 'yuko' ? 1 : tipo === 'waza_ari' ? 2 : 3
    const tipoKey = tipo === 'waza_ari' ? 'wazaAri' : tipo
    setMarcador((prev) => {
      const next = lado === 'rojo'
        ? { ...prev, puntosRojo: prev.puntosRojo + pts, [`${tipoKey}Rojo`]: (prev[`${tipoKey}Rojo`] || 0) + 1 }
        : { ...prev, puntosAzul: prev.puntosAzul + pts, [`${tipoKey}Azul`]: (prev[`${tipoKey}Azul`] || 0) + 1 }
      if (Math.abs(next.puntosRojo - next.puntosAzul) >= 8) {
        const ganador = next.puntosRojo > next.puntosAzul ? 'rojo' : 'azul'
        setTimeout(() => setModalFin({ ganador, porPuntos: true, autowin: true }), 100)
      }
      return next
    })
  }, [marcador])

  const deshacerUltimo = useCallback(() => {
    if (historial.length === 0) return
    setMarcador(historial[historial.length - 1])
    setHistorial((h) => h.slice(0, -1))
  }, [historial])

  function aplicarPenalizacion(lado, fila, nivel) {
    const sufijo = lado === 'rojo' ? 'Rojo' : 'Azul'
    const clave = `${fila}${sufijo}`
    const prevNivel = marcador[clave]

    if (nivel <= prevNivel) { setConfirmPenalizacion(null); return }

    // K (nivel 2) alcanzado por primera vez → rival recibe +1 (YUKO)
    const darYukoARival = prevNivel < 2 && nivel >= 2

    setHistorial((h) => [...h, { ...marcador }])
    setMarcador((prev) => {
      const next = { ...prev, [clave]: nivel }
      if (darYukoARival) {
        if (lado === 'rojo') {
          next.puntosAzul = prev.puntosAzul + 1
          next.yukoAzul = (prev.yukoAzul || 0) + 1
        } else {
          next.puntosRojo = prev.puntosRojo + 1
          next.yukoRojo = (prev.yukoRojo || 0) + 1
        }
      }
      return next
    })

    // H (nivel 4) → rival gana el bout
    if (nivel >= 4) {
      const ganador = lado === 'rojo' ? 'azul' : 'rojo'
      setTimeout(() => setModalFin({ ganador, porPuntos: false, hansoku: true }), 150)
    }

    setConfirmPenalizacion(null)
  }

  function toggleSenshu(lado) {
    setMarcador((prev) => ({ ...prev, senshu: prev.senshu === lado ? null : lado }))
  }

  function handleReset() {
    const dur = calcularDuracion(categoria)
    setMarcador({ ...MARCADOR_INICIAL })
    setHistorial([])
    setTimerSeg(dur)
    setTimerActivo(false)
    setAtoShibaraku(false)
    setModalFin(null)
    setConfirmReset(false)
    if (combate) {
      supabase.from('combate').update({
        puntos_rojo: 0, puntos_azul: 0,
        yuko_rojo: 0, waza_ari_rojo: 0, ippon_rojo: 0,
        yuko_azul: 0, waza_ari_azul: 0, ippon_azul: 0,
        c1_rojo: 0, c2_rojo: 0, c1_azul: 0, c2_azul: 0,
        senshu: null,
        timer_activo: false, timer_seg_restantes: dur, timer_inicio_ts: null,
      }).eq('id', combate.id).then(() => {})
    }
  }

  // ── Finalizar ────────────────────────────────────────────────────────────────

  function handleFinalizarManual() {
    const { puntosRojo, puntosAzul, senshu, ipponRojo, ipponAzul, wazaAriRojo, wazaAriAzul } = marcador
    let ganador = null
    if (puntosRojo > puntosAzul) ganador = 'rojo'
    else if (puntosAzul > puntosRojo) ganador = 'azul'
    else if (senshu) ganador = senshu
    else if (ipponRojo > ipponAzul) ganador = 'rojo'
    else if (ipponAzul > ipponRojo) ganador = 'azul'
    else if (wazaAriRojo > wazaAriAzul) ganador = 'rojo'
    else if (wazaAriAzul > wazaAriRojo) ganador = 'azul'
    setModalFin({ ganador, porPuntos: puntosRojo !== puntosAzul })
  }

  async function confirmarGanador(ganador) {
    if (!combate || !ganador) return
    setGuardando(true)
    const ganadorId = ganador === 'rojo' ? combate.competidor_rojo_id : combate.competidor_azul_id
    try {
      await avanzarGanador(combate.id, ganadorId, catId)
      navigate(`/mesa/${token}/categoria/${catId}`)
    } catch {
      // silencioso — puede reintentar
    } finally {
      setGuardando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sinCombates) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-zinc-300 font-semibold">No hay combates disponibles aún</p>
        <p className="text-zinc-600 text-sm">Esperá a que se completen los slots del bracket.</p>
        <button onClick={() => navigate(`/mesa/${token}`)}
          className="mt-2 text-sm text-zinc-500 hover:text-zinc-300 underline">
          Volver al tatami
        </button>
      </div>
    )
  }

  const nombreRonda = (() => {
    if (!combate) return ''
    if (combate.orden_en_ronda === 0) return '3er Puesto'
    return `Ronda ${combate.ronda}`
  })()

  const INPUT_BTN = 'flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-30'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <button onClick={() => navigate(`/mesa/${token}/categoria/${catId}`)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <ArrowLeft size={13} />
          Bracket
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-300 truncate max-w-[200px]">{categoria?.nombre}</p>
          <p className="text-[11px] text-zinc-600">{nombreRonda}</p>
        </div>
        <button
          onClick={() => window.open(`/mesa/${token}/categoria/${catId}/combate/${combate?.id}/tv`, '_blank')}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <TelevisionSimple size={13} />
          TV
        </button>
      </div>

      {/* Panel — Ao (azul) izquierda · Aka (rojo) derecha */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800">

        {/* AO — izquierda */}
        <div className="flex flex-col p-4 gap-3">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-sky-500 mx-auto mb-1" />
            <p className="font-bold text-zinc-100 text-sm leading-snug truncate">{azul?.nombre} {azul?.apellido}</p>
            <p className="text-xs text-zinc-600 truncate">{azul?.dojo?.nombre}</p>
          </div>

          <div className={`text-center text-6xl font-black tabular-nums ${
            descalificadoAzul ? 'line-through text-zinc-700' : 'text-sky-400'
          }`}>
            {marcador.puntosAzul}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => puntuar('azul', 'yuko')} disabled={descalificadoAzul}
              className={`${INPUT_BTN} bg-sky-950/40 border border-sky-800/40 text-sky-300 hover:bg-sky-900/40`}>
              YUKO +1
            </button>
            <button onClick={() => puntuar('azul', 'waza_ari')} disabled={descalificadoAzul}
              className={`${INPUT_BTN} bg-sky-950/60 border border-sky-700/50 text-sky-200 hover:bg-sky-900/60`}>
              WAZA-ARI +2
            </button>
            <button onClick={() => puntuar('azul', 'ippon')} disabled={descalificadoAzul}
              className={`${INPUT_BTN} bg-sky-700/70 border border-sky-600/60 text-white hover:bg-sky-600/70`}>
              IPPON +3
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 text-center space-x-2 min-h-[16px]">
            {marcador.yukoAzul > 0 && <span>Y×{marcador.yukoAzul}</span>}
            {marcador.wazaAriAzul > 0 && <span>WA×{marcador.wazaAriAzul}</span>}
            {marcador.ipponAzul > 0 && <span>IP×{marcador.ipponAzul}</span>}
          </div>

          <PenalRows
            lado="azul"
            c1={marcador.c1Azul}
            c2={marcador.c2Azul}
            descalificado={descalificadoAzul}
            onSet={(lado, fila, nivel) => setConfirmPenalizacion({ lado, fila, nivel })}
          />

          <button
            onClick={() => toggleSenshu('azul')}
            className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-colors ${
              marcador.senshu === 'azul'
                ? 'bg-sky-900/60 border-sky-700 text-sky-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SENSHU {marcador.senshu === 'azul' ? '★' : ''}
          </button>
        </div>

        {/* AKA — derecha */}
        <div className="flex flex-col p-4 gap-3">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto mb-1" />
            <p className="font-bold text-zinc-100 text-sm leading-snug truncate">{rojo?.nombre} {rojo?.apellido}</p>
            <p className="text-xs text-zinc-600 truncate">{rojo?.dojo?.nombre}</p>
          </div>

          <div className={`text-center text-6xl font-black tabular-nums ${
            descalificadoRojo ? 'line-through text-zinc-700' : 'text-rose-400'
          }`}>
            {marcador.puntosRojo}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => puntuar('rojo', 'yuko')} disabled={descalificadoRojo}
              className={`${INPUT_BTN} bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40`}>
              YUKO +1
            </button>
            <button onClick={() => puntuar('rojo', 'waza_ari')} disabled={descalificadoRojo}
              className={`${INPUT_BTN} bg-rose-950/60 border border-rose-700/50 text-rose-200 hover:bg-rose-900/60`}>
              WAZA-ARI +2
            </button>
            <button onClick={() => puntuar('rojo', 'ippon')} disabled={descalificadoRojo}
              className={`${INPUT_BTN} bg-rose-700/70 border border-rose-600/60 text-white hover:bg-rose-600/70`}>
              IPPON +3
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 text-center space-x-2 min-h-[16px]">
            {marcador.yukoRojo > 0 && <span>Y×{marcador.yukoRojo}</span>}
            {marcador.wazaAriRojo > 0 && <span>WA×{marcador.wazaAriRojo}</span>}
            {marcador.ipponRojo > 0 && <span>IP×{marcador.ipponRojo}</span>}
          </div>

          <PenalRows
            lado="rojo"
            c1={marcador.c1Rojo}
            c2={marcador.c2Rojo}
            descalificado={descalificadoRojo}
            onSet={(lado, fila, nivel) => setConfirmPenalizacion({ lado, fila, nivel })}
          />

          <button
            onClick={() => toggleSenshu('rojo')}
            className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-colors ${
              marcador.senshu === 'rojo'
                ? 'bg-rose-900/60 border-rose-700 text-rose-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SENSHU {marcador.senshu === 'rojo' ? '★' : ''}
          </button>
        </div>
      </div>

      {/* Cronómetro */}
      <div className={`border-t border-zinc-900 px-4 py-4 flex flex-col items-center gap-3 ${
        atoShibaraku ? 'bg-amber-950/20' : ''
      }`}>
        {atoShibaraku && (
          <p className="text-amber-400 text-xs font-bold tracking-widest uppercase animate-pulse">
            ⚠ ATO SHIBARAKU
          </p>
        )}
        <div className={`text-5xl font-black tabular-nums tracking-tight ${
          timerSeg <= 15 && timerSeg > 0 ? 'text-amber-400' : timerSeg === 0 ? 'text-red-500' : 'text-zinc-100'
        }`}>
          {fmtTime(timerSeg)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const nextActivo = !timerActivo
              setTimerActivo(nextActivo)
              if (combate) {
                supabase.from('combate').update({
                  timer_activo: nextActivo,
                  timer_seg_restantes: timerSeg,
                  timer_inicio_ts: nextActivo ? new Date().toISOString() : null,
                }).eq('id', combate.id).then(() => {})
              }
            }}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
              timerActivo ? 'bg-amber-700 hover:bg-amber-600 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {timerActivo ? 'YAME' : 'HAJIME'}
          </button>
          <button
            onClick={() => {
              setTimerSeg(duracion)
              setTimerActivo(false)
              setAtoShibaraku(false)
              if (combate) {
                supabase.from('combate').update({
                  timer_activo: false,
                  timer_seg_restantes: duracion,
                  timer_inicio_ts: null,
                }).eq('id', combate.id).then(() => {})
              }
            }}
            className="px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 transition-colors"
          >
            ↺ Tiempo
          </button>
        </div>
      </div>

      {/* Acciones de combate */}
      <div className="border-t border-zinc-900 px-4 py-3 flex gap-2 items-center">
        <button
          onClick={deshacerUltimo}
          disabled={historial.length === 0}
          className="text-xs text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-lg"
        >
          ↩ Deshacer
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          className="text-xs text-zinc-600 hover:text-rose-400 transition-colors py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-lg"
        >
          Reset
        </button>
        <button
          onClick={handleFinalizarManual}
          className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-sm transition-colors"
        >
          Finalizar combate
        </button>
      </div>

      {/* Modal confirmación penalización */}
      {confirmPenalizacion && (() => {
        const { lado, fila, nivel } = confirmPenalizacion
        const sufijo = lado === 'rojo' ? 'Rojo' : 'Azul'
        const clave = `${fila}${sufijo}`
        const prevNivel = marcador[clave]
        const nombre = lado === 'rojo'
          ? `${rojo?.nombre ?? ''} ${rojo?.apellido ?? ''}`.trim()
          : `${azul?.nombre ?? ''} ${azul?.apellido ?? ''}`.trim()
        const darYuko = prevNivel < 2 && nivel >= 2
        const esHansoku = nivel >= 4

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-xs w-full shadow-2xl">
              <p className="font-bold text-zinc-100 mb-0.5 text-sm">
                {fila.toUpperCase()} → <span className="uppercase tracking-wide">{PENAL_LABEL[nivel]}</span>
              </p>
              <p className="text-xs text-zinc-500 mb-3">{PENAL_TITLE[nivel]}</p>
              <p className="text-sm text-zinc-400 mb-3">
                Aplicar a{' '}
                <span className={`font-bold ${lado === 'rojo' ? 'text-rose-400' : 'text-sky-400'}`}>
                  {nombre}
                </span>
              </p>
              {darYuko && (
                <div className="text-xs bg-amber-950/40 border border-amber-800/50 text-amber-400 px-3 py-2 rounded-lg mb-3">
                  +1 punto para el rival (K automático)
                </div>
              )}
              {esHansoku && (
                <div className="text-xs bg-red-950/50 border border-red-800/50 text-red-400 px-3 py-2 rounded-lg mb-3 font-semibold">
                  HANSOKU — el rival gana el combate
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setConfirmPenalizacion(null)}
                  className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => aplicarPenalizacion(lado, fila, nivel)}
                  className="flex-1 bg-rose-700 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal confirmación reset */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-xs w-full shadow-2xl">
            <p className="font-bold text-zinc-100 mb-2">¿Reiniciar el combate?</p>
            <p className="text-sm text-zinc-400 mb-5">
              Borra todos los puntos, penalizaciones y el tiempo. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-rose-700 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal fin de combate */}
      {modalFin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center">
            {modalFin.ganador ? (
              <>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                  {modalFin.autowin ? 'Victoria por 8 puntos' : modalFin.hansoku ? 'HANSOKU' : 'Fin del tiempo'}
                </p>
                <div className={`text-4xl font-black mb-1 ${modalFin.ganador === 'rojo' ? 'text-rose-400' : 'text-sky-400'}`}>
                  {modalFin.ganador === 'rojo'
                    ? `${rojo?.nombre} ${rojo?.apellido}`
                    : `${azul?.nombre} ${azul?.apellido}`}
                </div>
                <p className="text-zinc-500 text-sm mb-6">gana el combate</p>
                <div className="flex gap-2">
                  <button onClick={() => setModalFin(null)}
                    className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => confirmarGanador(modalFin.ganador)} disabled={guardando}
                    className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-rose-500 transition-colors disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-zinc-300 font-semibold mb-1">Empate total</p>
                <p className="text-zinc-500 text-sm mb-5">Se requiere HANTEI — voto de los jueces.</p>
                <p className="text-xs text-zinc-600 mb-4">¿Quién ganó el voto?</p>
                <div className="flex gap-2">
                  <button onClick={() => confirmarGanador('rojo')} disabled={guardando}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-50">
                    {rojo?.nombre}
                  </button>
                  <button onClick={() => confirmarGanador('azul')} disabled={guardando}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-sky-700 text-white hover:bg-sky-600 transition-colors disabled:opacity-50">
                    {azul?.nombre}
                  </button>
                </div>
                <button onClick={() => setModalFin(null)}
                  className="w-full mt-2 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
