import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TelevisionSimple } from '@phosphor-icons/react'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias } from '../../lib/categorias'
import { sincronizarMarcador, avanzarGanador } from '../../lib/combates'
import { fetchCompetidores } from '../../lib/competidores'
import { supabase } from '../../lib/supabase'

const DURACION_DEFAULT = 180 // 3 minutos en segundos

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
  chiuRojo: 0, chiuAzul: 0,
  hansokuChuiRojo: false, hansokuChuiAzul: false,
  descalificadoRojo: false, descalificadoAzul: false,
  senshu: null,
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

  const [modalFin, setModalFin] = useState(null) // { ganador: 'rojo'|'azul'|null, porPuntos: bool }
  const [guardando, setGuardando] = useState(false)
  const [confirmPenalizacion, setConfirmPenalizacion] = useState(null) // { lado, tipo }

  const duracion = calcularDuracion(categoria)
  const syncRef = useRef(null)

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
        if (prev <= 1) {
          setTimerActivo(false)
          clearInterval(id)
          return 0
        }
        if (prev === 16) setAtoShibaraku(true)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActivo])

  // Sync al Supabase (para TV) cada vez que el marcador cambia — debounced 800ms
  useEffect(() => {
    if (!combate) return
    if (syncRef.current) clearTimeout(syncRef.current)
    syncRef.current = setTimeout(() => {
      sincronizarMarcador(combate.id, {
        puntos_rojo: marcador.puntosRojo,
        puntos_azul: marcador.puntosAzul,
        yuko_rojo: marcador.yukoRojo, waza_ari_rojo: marcador.wazaAriRojo, ippon_rojo: marcador.ipponRojo,
        yuko_azul: marcador.yukoAzul, waza_ari_azul: marcador.wazaAriAzul, ippon_azul: marcador.ipponAzul,
        chui_rojo: marcador.chiuRojo, chui_azul: marcador.chiuAzul,
        hansoku_chui_rojo: marcador.hansokuChuiRojo, hansoku_chui_azul: marcador.hansokuChuiAzul,
        senshu: marcador.senshu,
      }).catch(() => {})
    }, 800)
    return () => clearTimeout(syncRef.current)
  }, [marcador, combate])

  // ── Acciones de puntuación ──────────────────────────────────────────────────

  const puntuar = useCallback((lado, tipo) => {
    setHistorial((h) => [...h, { ...marcador }])
    const pts = tipo === 'yuko' ? 1 : tipo === 'waza_ari' ? 2 : 3
    const tipoKey = tipo === 'waza_ari' ? 'wazaAri' : tipo
    setMarcador((prev) => {
      const next = lado === 'rojo'
        ? { ...prev, puntosRojo: prev.puntosRojo + pts, [`${tipoKey}Rojo`]: (prev[`${tipoKey}Rojo`] || 0) + 1 }
        : { ...prev, puntosAzul: prev.puntosAzul + pts, [`${tipoKey}Azul`]: (prev[`${tipoKey}Azul`] || 0) + 1 }
      const diff = Math.abs(next.puntosRojo - next.puntosAzul)
      if (diff >= 8) {
        const ganador = next.puntosRojo > next.puntosAzul ? 'rojo' : 'azul'
        setTimeout(() => setModalFin({ ganador, porPuntos: true, autowin: true }), 100)
      }
      return next
    })
  }, [marcador])

  const deshacerUltimo = useCallback(() => {
    if (historial.length === 0) return
    const prev = historial[historial.length - 1]
    setMarcador(prev)
    setHistorial((h) => h.slice(0, -1))
  }, [historial])

  function aplicarPenalizacion(lado, tipo) {
    setHistorial((h) => [...h, { ...marcador }])
    setMarcador((prev) => {
      const next = { ...prev }
      if (tipo === 'chui') {
        const clave = lado === 'rojo' ? 'chiuRojo' : 'chiuAzul'
        const chiuActual = next[clave]
        if (chiuActual >= 3) {
          // escala a hansoku_chui
          const hcClave = lado === 'rojo' ? 'hansokuChuiRojo' : 'hansokuChuiAzul'
          next[hcClave] = true
        } else {
          next[clave] = chiuActual + 1
        }
      } else if (tipo === 'hansoku_chui') {
        const hcClave = lado === 'rojo' ? 'hansokuChuiRojo' : 'hansokuChuiAzul'
        next[hcClave] = true
      } else if (tipo === 'hansoku') {
        next[lado === 'rojo' ? 'descalificadoRojo' : 'descalificadoAzul'] = true
        setTimeout(() => setModalFin({ ganador: lado === 'rojo' ? 'azul' : 'rojo', porPuntos: false, hansoku: true }), 100)
      } else if (tipo === 'shikkaku') {
        next[lado === 'rojo' ? 'descalificadoRojo' : 'descalificadoAzul'] = true
        setTimeout(() => setModalFin({ ganador: lado === 'rojo' ? 'azul' : 'rojo', porPuntos: false, shikkaku: true }), 100)
      }
      return next
    })
    setConfirmPenalizacion(null)
  }

  function toggleSenshu(lado) {
    setMarcador((prev) => ({ ...prev, senshu: prev.senshu === lado ? null : lado }))
  }

  // ── Finalizar combate ───────────────────────────────────────────────────────

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
      // error silencioso — puede reintentar
    } finally {
      setGuardando(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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

  const INPUT_BTN = 'flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95'

  function PenalRow({ lado }) {
    const chiuCount = lado === 'rojo' ? marcador.chiuRojo : marcador.chiuAzul
    const hc = lado === 'rojo' ? marcador.hansokuChuiRojo : marcador.hansokuChuiAzul
    const chiuMaxed = chiuCount >= 3

    return (
      <div className="flex gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => setConfirmPenalizacion({ lado, tipo: 'chui' })}
          className="text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold transition-colors bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700"
        >
          CHUI {chiuCount > 0 && `(${chiuCount})`}
        </button>
        <button
          onClick={() => setConfirmPenalizacion({ lado, tipo: 'hansoku_chui' })}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold transition-colors ${
            hc ? 'bg-orange-950/60 border-orange-700 text-orange-300' : 'bg-zinc-800 border-zinc-700 text-orange-400 hover:bg-zinc-700'
          }`}
        >
          H.CHUI{hc ? ' ✓' : ''}
        </button>
        <button
          onClick={() => setConfirmPenalizacion({ lado, tipo: 'hansoku' })}
          className="text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold bg-zinc-800 border-zinc-700 text-rose-400 hover:bg-zinc-700 transition-colors"
        >
          HANSOKU
        </button>
        <button
          onClick={() => setConfirmPenalizacion({ lado, tipo: 'shikkaku' })}
          className="text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold bg-zinc-800 border-zinc-700 text-red-600 hover:bg-zinc-700 transition-colors"
        >
          SHIKK.
        </button>
      </div>
    )
  }

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

      {/* Panel principal — 2 columnas */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-zinc-800">
        {/* AKA (rojo) */}
        <div className="flex flex-col p-4 gap-3">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto mb-1" />
            <p className="font-bold text-zinc-100 text-sm leading-snug truncate">{rojo?.nombre} {rojo?.apellido}</p>
            <p className="text-xs text-zinc-600 truncate">{rojo?.dojo?.nombre}</p>
          </div>

          <div className={`text-center text-6xl font-black tabular-nums ${marcador.descalificadoRojo ? 'line-through text-zinc-700' : 'text-rose-400'}`}>
            {marcador.puntosRojo}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => puntuar('rojo', 'yuko')}
              className={`${INPUT_BTN} bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40`}>
              YUKO +1
            </button>
            <button onClick={() => puntuar('rojo', 'waza_ari')}
              className={`${INPUT_BTN} bg-rose-950/60 border border-rose-700/50 text-rose-200 hover:bg-rose-900/60`}>
              WAZA-ARI +2
            </button>
            <button onClick={() => puntuar('rojo', 'ippon')}
              className={`${INPUT_BTN} bg-rose-700/70 border border-rose-600/60 text-white hover:bg-rose-600/70`}>
              IPPON +3
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 text-center space-x-3">
            {marcador.yukoRojo > 0 && <span>YUKO ×{marcador.yukoRojo}</span>}
            {marcador.wazaAriRojo > 0 && <span>WA ×{marcador.wazaAriRojo}</span>}
            {marcador.ipponRojo > 0 && <span>IPPON ×{marcador.ipponRojo}</span>}
          </div>

          <PenalRow lado="rojo" />

          <button
            onClick={() => toggleSenshu('rojo')}
            className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-colors ${
              marcador.senshu === 'rojo'
                ? 'bg-rose-900/60 border-rose-700 text-rose-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SENSHU {marcador.senshu === 'rojo' ? '✓' : ''}
          </button>

          <button onClick={deshacerUltimo} disabled={historial.length === 0}
            className="text-xs text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors py-1">
            ↩ Deshacer
          </button>
        </div>

        {/* AO (azul) */}
        <div className="flex flex-col p-4 gap-3">
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-sky-500 mx-auto mb-1" />
            <p className="font-bold text-zinc-100 text-sm leading-snug truncate">{azul?.nombre} {azul?.apellido}</p>
            <p className="text-xs text-zinc-600 truncate">{azul?.dojo?.nombre}</p>
          </div>

          <div className={`text-center text-6xl font-black tabular-nums ${marcador.descalificadoAzul ? 'line-through text-zinc-700' : 'text-sky-400'}`}>
            {marcador.puntosAzul}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => puntuar('azul', 'yuko')}
              className={`${INPUT_BTN} bg-sky-950/40 border border-sky-800/40 text-sky-300 hover:bg-sky-900/40`}>
              YUKO +1
            </button>
            <button onClick={() => puntuar('azul', 'waza_ari')}
              className={`${INPUT_BTN} bg-sky-950/60 border border-sky-700/50 text-sky-200 hover:bg-sky-900/60`}>
              WAZA-ARI +2
            </button>
            <button onClick={() => puntuar('azul', 'ippon')}
              className={`${INPUT_BTN} bg-sky-700/70 border border-sky-600/60 text-white hover:bg-sky-600/70`}>
              IPPON +3
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 text-center space-x-3">
            {marcador.yukoAzul > 0 && <span>YUKO ×{marcador.yukoAzul}</span>}
            {marcador.wazaAriAzul > 0 && <span>WA ×{marcador.wazaAriAzul}</span>}
            {marcador.ipponAzul > 0 && <span>IPPON ×{marcador.ipponAzul}</span>}
          </div>

          <PenalRow lado="azul" />

          <button
            onClick={() => toggleSenshu('azul')}
            className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-colors ${
              marcador.senshu === 'azul'
                ? 'bg-sky-900/60 border-sky-700 text-sky-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SENSHU {marcador.senshu === 'azul' ? '✓' : ''}
          </button>

          <button onClick={deshacerUltimo} disabled={historial.length === 0}
            className="text-xs text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors py-1">
            ↩ Deshacer
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
              timerActivo
                ? 'bg-amber-700 hover:bg-amber-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
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
            Reiniciar
          </button>
        </div>
      </div>

      {/* Finalizar */}
      <div className="border-t border-zinc-900 px-4 py-3">
        <button
          onClick={handleFinalizarManual}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-sm transition-colors"
        >
          Finalizar combate
        </button>
      </div>

      {/* Modal de penalización — confirmación */}
      {confirmPenalizacion && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-xs w-full shadow-2xl">
            <p className="font-semibold text-zinc-100 mb-1">
              {confirmPenalizacion.tipo.replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-sm text-zinc-400 mb-5">
              Aplicar a <span className={confirmPenalizacion.lado === 'rojo' ? 'text-rose-400 font-bold' : 'text-sky-400 font-bold'}>
                {confirmPenalizacion.lado === 'rojo' ? (rojo?.nombre) : (azul?.nombre)}
              </span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmPenalizacion(null)}
                className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => aplicarPenalizacion(confirmPenalizacion.lado, confirmPenalizacion.tipo)}
                className="flex-1 bg-rose-700 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fin de combate */}
      {modalFin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center">
            {modalFin.ganador ? (
              <>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                  {modalFin.autowin ? 'Victoria por 8 puntos' : modalFin.hansoku ? 'HANSOKU' : modalFin.shikkaku ? 'SHIKKAKU' : 'Fin del tiempo'}
                </p>
                <div className={`text-4xl font-black mb-1 ${modalFin.ganador === 'rojo' ? 'text-rose-400' : 'text-sky-400'}`}>
                  {modalFin.ganador === 'rojo' ? (rojo?.nombre) : (azul?.nombre)}
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
                <p className="text-xs text-zinc-600 mb-5">¿Quién ganó el voto?</p>
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
