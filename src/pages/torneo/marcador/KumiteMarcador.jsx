import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react'
import { fetchTorneoById } from '../../../lib/torneos'
import { fetchCategorias } from '../../../lib/categorias'
import { fetchCompetidores } from '../../../lib/competidores'
import useCombateStore from '../../../stores/useCombateStore'
import useMarcadorStore from '../../../stores/useMarcadorStore'
import { penalizacionDisponible } from '../../../lib/scoring'

const DURACION_POR_CATEGORIA = {
  senior: 180,
  u21: 180,
  junior: 120,
  cadet: 90,
  u14: 90,
}

function duracionSegs(categoria) {
  const nombre = (categoria?.nombre || '').toLowerCase()
  if (nombre.includes('senior')) return DURACION_POR_CATEGORIA.senior
  if (nombre.includes('u21')) return DURACION_POR_CATEGORIA.u21
  if (nombre.includes('junior')) return DURACION_POR_CATEGORIA.junior
  if (nombre.includes('cadet')) return DURACION_POR_CATEGORIA.cadet
  if (nombre.includes('u14')) return DURACION_POR_CATEGORIA.u14
  return 120 // default 2 min
}

function formatTiempo(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0')
  const s = (seg % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Panel de puntuación de un atleta ────────────────────────────────────────

function AtletaPanel({ lado, nombre, club, scoring, onPunto, onDeshacerPunto, onPenalizar, esAkaAo }) {
  const puntos = scoring[`puntos_${lado}`]
  const chui = scoring[`chui_${lado}`]
  const hansokuChui = scoring[`hansoku_chui_${lado}`]
  const proxPenalizacion = penalizacionDisponible(scoring, lado)
  const color = lado === 'aka' ? 'rose' : 'sky'
  const bgScore = lado === 'aka' ? 'bg-rose-600' : 'bg-sky-600'
  const bgCard = lado === 'aka' ? 'bg-rose-950/20 border-rose-900/40' : 'bg-sky-950/20 border-sky-900/40'
  const textAccent = lado === 'aka' ? 'text-rose-400' : 'text-sky-400'

  const BTN = `flex-1 py-4 rounded-xl font-bold text-lg tracking-wide transition-all active:scale-95 select-none`
  const BTN_PUNTO = `${BTN} bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700`
  const BTN_PEN = `${BTN} text-sm py-3`

  return (
    <div className={`flex-1 rounded-2xl border p-4 flex flex-col gap-3 ${bgCard}`}>
      {/* Nombre y score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-100 text-base leading-tight truncate">{nombre}</p>
          <p className="text-xs text-zinc-500 truncate">{club}</p>
          <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
            <span>CHUI: <span className={chui > 0 ? 'text-amber-400 font-bold' : ''}>{chui}</span>/3</span>
            {hansokuChui > 0 && <span className="text-orange-400 font-bold">HC: {hansokuChui}</span>}
          </div>
        </div>
        <div className={`${bgScore} rounded-xl w-20 h-20 flex items-center justify-center shrink-0`}>
          <span className="text-5xl font-black text-white tabular-nums">{puntos}</span>
        </div>
      </div>

      {/* Botones de punto */}
      <div className="flex gap-2">
        <button onClick={() => onPunto(lado, 'yuko')} className={BTN_PUNTO}>
          YUKO<br /><span className="text-sm font-normal text-zinc-400">+1</span>
        </button>
        <button onClick={() => onPunto(lado, 'waza_ari')} className={BTN_PUNTO}>
          WAZA-ARI<br /><span className="text-sm font-normal text-zinc-400">+2</span>
        </button>
        <button onClick={() => onPunto(lado, 'ippon')} className={`${BTN} bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600`}>
          IPPON<br /><span className="text-sm font-normal text-zinc-300">+3</span>
        </button>
      </div>

      {/* Deshacer */}
      <button
        onClick={() => onDeshacerPunto(lado)}
        className="w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
      >
        ↩ Deshacer último punto
      </button>

      {/* Penalizaciones */}
      <div className="border-t border-zinc-800/60 pt-3">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Penalizaciones</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onPenalizar(lado, 'chui')}
            disabled={proxPenalizacion !== 'chui'}
            className={`${BTN_PEN} bg-amber-950/60 text-amber-300 border border-amber-900/50 hover:bg-amber-900/60 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            CHUI<br /><span className="text-xs font-normal">{chui}/3</span>
          </button>
          <button
            onClick={() => onPenalizar(lado, 'jogai')}
            disabled={proxPenalizacion !== 'chui'}
            className={`${BTN_PEN} bg-amber-950/40 text-amber-400/70 border border-amber-900/30 hover:bg-amber-900/40 disabled:opacity-30 disabled:cursor-not-allowed text-xs`}
          >
            JOGAI<br /><span className="text-xs font-normal opacity-70">=CHUI</span>
          </button>
          <button
            onClick={() => onPenalizar(lado, 'mubobi')}
            disabled={proxPenalizacion !== 'chui'}
            className={`${BTN_PEN} bg-amber-950/40 text-amber-400/70 border border-amber-900/30 hover:bg-amber-900/40 disabled:opacity-30 disabled:cursor-not-allowed text-xs`}
          >
            MUBOBI<br /><span className="text-xs font-normal opacity-70">=CHUI</span>
          </button>
          <button
            onClick={() => onPenalizar(lado, 'hansoku_chui')}
            disabled={proxPenalizacion !== 'hansoku_chui'}
            className={`${BTN_PEN} bg-orange-950/60 text-orange-300 border border-orange-900/50 hover:bg-orange-900/60 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            HANSOKU<br />CHUI
          </button>
          <button
            onClick={() => onPenalizar(lado, 'hansoku')}
            disabled={proxPenalizacion !== 'hansoku'}
            className={`${BTN_PEN} bg-rose-950/60 text-rose-300 border border-rose-900/50 hover:bg-rose-900/60 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            HANSOKU
          </button>
          <button
            onClick={() => onPenalizar(lado, 'shikkaku')}
            className={`${BTN_PEN} bg-red-950/80 text-red-300 border border-red-900/60 hover:bg-red-900/70`}
          >
            SHIKKAKU
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de confirmación para acciones irreversibles ────────────────────────

function ConfirmModal({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-zinc-100 font-semibold text-base mb-4">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 bg-zinc-800 text-zinc-200 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-500 transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KumiteMarcador ───────────────────────────────────────────────────────────

export default function KumiteMarcador() {
  const { id: torneoId, catId, combateId } = useParams()
  const navigate = useNavigate()

  const [loadingCtx, setLoadingCtx] = useState(true)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [competidorAka, setCompetidorAka] = useState(null)
  const [competidorAo, setCompetidorAo] = useState(null)
  const [confirm, setConfirm] = useState(null) // { mensaje, onConfirmar }

  const {
    scoring, tiempoSegundos, corriendo, boutFinalizado, ganador, loading, error,
    iniciar, marcarPunto, deshacerPunto, penalizar,
    setSenshu, anularSenshu,
    iniciarCronometro, pausarCronometro, resetearCronometro,
    confirmarResultado,
  } = useMarcadorStore()

  const { combates, fetchCombates } = useCombateStore()

  useEffect(() => {
    async function cargar() {
      try {
        const [cats, comps] = await Promise.all([
          fetchCategorias(torneoId),
          fetchCompetidores(torneoId),
        ])
        await fetchCombates(catId)
        const cat = cats.find((c) => c.id === catId)
        setCategoria(cat)
        // combate se obtiene del store después de fetch
      } catch {
        navigate('/')
      } finally {
        setLoadingCtx(false)
      }
    }
    cargar()
  }, [torneoId, catId, combateId, navigate, fetchCombates])

  // Resolver combate y competidores cuando estén disponibles
  useEffect(() => {
    if (!combates.length) return
    const c = combates.find((cb) => cb.id === combateId)
    if (!c) return
    setCombate(c)
  }, [combates, combateId])

  useEffect(() => {
    if (!combate || !categoria) return
    // Los competidores vienen del store de combates con join
    const duracion = duracionSegs(categoria)
    iniciar(combate, categoria, null, null, duracion)
    resetearCronometro(duracion)
  }, [combate, categoria]) // eslint-disable-line

  // Señal ATO SHIBARAKU a 15 segundos
  const atoShibaraku = tiempoSegundos === 15 && corriendo

  function handlePenalizar(lado, tipo) {
    if (tipo === 'shikkaku') {
      setConfirm({
        mensaje: `¿Confirmar SHIKKAKU para ${lado.toUpperCase()}? El atleta queda descalificado del torneo completo.`,
        onConfirmar: () => { penalizar(lado, tipo); setConfirm(null) },
      })
      return
    }
    if (tipo === 'hansoku') {
      setConfirm({
        mensaje: `¿Confirmar HANSOKU para ${lado.toUpperCase()}? El atleta pierde el bout.`,
        onConfirmar: () => { penalizar(lado, tipo); setConfirm(null) },
      })
      return
    }
    penalizar(lado, tipo)
  }

  async function handleFinalizarBout() {
    await confirmarResultado()
    navigate(`/torneo/${torneoId}/categoria/${catId}/bracket`)
  }

  function abrirTV() {
    window.open(`/torneo/${torneoId}/marcador/${combateId}/tv`, '_blank', 'noopener')
  }

  if (loadingCtx) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/torneo/${torneoId}/categoria/${catId}/bracket`)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <ArrowLeft size={13} /> Bracket
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{categoria?.nombre}</p>
          <p className="text-xs text-zinc-600">Kumite Individual</p>
        </div>
        <button onClick={abrirTV}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1.5">
          <ArrowSquareOut size={13} />
          Abrir TV
        </button>
      </div>

      {/* ATO SHIBARAKU banner */}
      {atoShibaraku && (
        <div className="bg-amber-500 text-black font-black text-center py-2 rounded-xl text-lg animate-pulse tracking-widest">
          ATO SHIBARAKU — 15 SEGUNDOS
        </div>
      )}

      {/* Cronómetro */}
      <div className="flex items-center justify-center gap-4">
        <span className={`font-black tabular-nums text-5xl tracking-widest ${
          tiempoSegundos <= 15 && tiempoSegundos > 0 ? 'text-amber-400' : 'text-zinc-100'
        } ${tiempoSegundos === 0 ? 'text-rose-500' : ''}`}>
          {formatTiempo(tiempoSegundos)}
        </span>
        <div className="flex gap-2">
          {corriendo ? (
            <button onClick={pausarCronometro}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
              YAME
            </button>
          ) : (
            <button onClick={iniciarCronometro} disabled={boutFinalizado}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-40">
              HAJIME
            </button>
          )}
          <button onClick={() => resetearCronometro(duracionSegs(categoria))} disabled={corriendo}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-sm transition-colors disabled:opacity-40">
            Reset
          </button>
        </div>
      </div>

      {/* Paneles AKA y AO */}
      <div className="flex gap-4 flex-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">AKA</span>
          <AtletaPanel
            lado="aka"
            nombre={competidorAka ? `${competidorAka.nombre} ${competidorAka.apellido}` : 'AKA'}
            club={competidorAka?.dojo?.nombre || combate?.competidor_rojo_id?.slice(0, 8) || '—'}
            scoring={scoring}
            onPunto={marcarPunto}
            onDeshacerPunto={deshacerPunto}
            onPenalizar={handlePenalizar}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">AO</span>
          <AtletaPanel
            lado="ao"
            nombre={competidorAo ? `${competidorAo.nombre} ${competidorAo.apellido}` : 'AO'}
            club={competidorAo?.dojo?.nombre || combate?.competidor_azul_id?.slice(0, 8) || '—'}
            scoring={scoring}
            onPunto={marcarPunto}
            onDeshacerPunto={deshacerPunto}
            onPenalizar={handlePenalizar}
          />
        </div>
      </div>

      {/* SENSHU */}
      <div className="flex items-center gap-3 justify-center border-t border-zinc-800/60 pt-3">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">SENSHU</span>
        <button onClick={() => setSenshu('aka')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            scoring.senshu === 'aka' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}>
          AKA
        </button>
        <button onClick={() => setSenshu('ao')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            scoring.senshu === 'ao' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}>
          AO
        </button>
        {scoring.senshu && (
          <button onClick={anularSenshu}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            TORIMASEN
          </button>
        )}
      </div>

      {/* Control del bout */}
      <div className="flex gap-2 flex-wrap justify-center border-t border-zinc-800/60 pt-3">
        <button className="px-3 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          MOTO NO ICHI
        </button>
        <button className="px-3 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          HANTEI
        </button>
        <button className="px-3 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          HIKIWAKE
        </button>
        {boutFinalizado && (
          <button onClick={handleFinalizarBout} disabled={loading}
            className="px-4 py-2 rounded-xl text-sm bg-emerald-700 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Confirmar resultado →'}
          </button>
        )}
      </div>

      {/* Ganador banner */}
      {boutFinalizado && ganador && (
        <div className={`rounded-2xl p-4 text-center font-black text-xl border ${
          ganador === 'aka'
            ? 'bg-rose-950/60 border-rose-700 text-rose-300'
            : 'bg-sky-950/60 border-sky-700 text-sky-300'
        }`}>
          GANADOR: {ganador.toUpperCase()}
          {scoring.puntos_aka !== scoring.puntos_ao && (
            <span className="block text-sm font-normal mt-1 opacity-70">
              {scoring.puntos_aka} – {scoring.puntos_ao}
            </span>
          )}
        </div>
      )}

      {boutFinalizado && !ganador && (
        <div className="rounded-2xl p-4 text-center font-bold text-zinc-300 border border-zinc-700 bg-zinc-800/60">
          EMPATE — Se requiere HANTEI
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          mensaje={confirm.mensaje}
          onConfirmar={confirm.onConfirmar}
          onCancelar={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
