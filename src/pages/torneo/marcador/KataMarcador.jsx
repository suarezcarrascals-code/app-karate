import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowSquareOut } from '@phosphor-icons/react'
import { fetchCategorias } from '../../../lib/categorias'
import { fetchCompetidores } from '../../../lib/competidores'
import useCombateStore from '../../../stores/useCombateStore'
import { calcularVotoJuez, determinarGanadorKataBout, validarKataPermitido } from '../../../lib/scoring'

const NUM_JUECES = 5 // default; Round-robin usa 7

function PuntajeJuez({ juezIdx, lado, valor, onChange, confirmado, onConfirmar, onEditar }) {
  const color = lado === 'aka' ? 'rose' : 'sky'

  if (confirmado) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-zinc-500">J{juezIdx + 1}</span>
        <div
          onClick={onEditar}
          className={`w-14 h-10 rounded-lg flex items-center justify-center font-bold tabular-nums cursor-pointer
            ${lado === 'aka' ? 'bg-rose-900/60 text-rose-200' : 'bg-sky-900/60 text-sky-200'}
            hover:brightness-125 transition-all text-sm`}
        >
          {valor !== null ? valor.toFixed(1) : '—'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-zinc-500">J{juezIdx + 1}</span>
      <input
        type="number"
        min="5.0"
        max="10.0"
        step="0.1"
        value={valor !== null ? valor : ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-16 h-10 rounded-lg text-center font-bold text-sm tabular-nums bg-zinc-800 border
          ${lado === 'aka' ? 'border-rose-700 text-rose-200 focus:ring-rose-500' : 'border-sky-700 text-sky-200 focus:ring-sky-500'}
          focus:outline-none focus:ring-2`}
        placeholder="—"
      />
      <button
        onClick={onConfirmar}
        disabled={valor === null || isNaN(valor)}
        className={`text-xs px-2 py-0.5 rounded font-medium transition-colors disabled:opacity-30
          ${lado === 'aka' ? 'bg-rose-700 hover:bg-rose-600 text-white' : 'bg-sky-700 hover:bg-sky-600 text-white'}`}
      >
        OK
      </button>
    </div>
  )
}

function PanelKata({ lado, nombre, club, puntajes, confirmados, onChangePuntaje, onConfirmarPuntaje, onEditarPuntaje, onDQ, onKiken, numJueces }) {
  const bgCard = lado === 'aka' ? 'bg-rose-950/20 border-rose-900/40' : 'bg-sky-950/20 border-sky-900/40'

  return (
    <div className={`flex-1 rounded-2xl border p-4 flex flex-col gap-4 ${bgCard}`}>
      <div>
        <p className="font-bold text-zinc-100 text-base leading-tight">{nombre}</p>
        <p className="text-xs text-zinc-500">{club}</p>
      </div>

      {/* Puntajes por juez */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Puntajes</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: numJueces }, (_, i) => (
            <PuntajeJuez
              key={i}
              juezIdx={i}
              lado={lado}
              valor={puntajes[i]}
              onChange={(v) => onChangePuntaje(i, v)}
              confirmado={confirmados[i]}
              onConfirmar={() => onConfirmarPuntaje(i)}
              onEditar={() => onEditarPuntaje(i)}
            />
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onKiken}
          className="flex-1 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
        >
          KIKEN
        </button>
        <button
          onClick={onDQ}
          className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-900/50 transition-colors"
        >
          DQ (0.0)
        </button>
      </div>
    </div>
  )
}

function ConfirmModal({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-zinc-100 font-semibold text-base mb-4">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 bg-zinc-800 text-zinc-200 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-500 transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KataMarcador ─────────────────────────────────────────────────────────────

export default function KataMarcador() {
  const { id: torneoId, catId, combateId } = useParams()
  const navigate = useNavigate()

  const [loadingCtx, setLoadingCtx] = useState(true)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [confirm, setConfirm] = useState(null)

  // Puntajes: array de N floats, null = sin ingresar
  const [puntajesAka, setPuntajesAka] = useState(Array(NUM_JUECES).fill(null))
  const [puntajesAo, setPuntajesAo] = useState(Array(NUM_JUECES).fill(null))
  const [confirmadosAka, setConfirmadosAka] = useState(Array(NUM_JUECES).fill(false))
  const [confirmadosAo, setConfirmadosAo] = useState(Array(NUM_JUECES).fill(false))

  const [ganador, setGanador] = useState(null)
  const [votosAka, setVotosAka] = useState(0)
  const [votosAo, setVotosAo] = useState(0)

  const { combates, fetchCombates } = useCombateStore()

  useEffect(() => {
    async function cargar() {
      try {
        const [cats] = await Promise.all([fetchCategorias(torneoId)])
        await fetchCombates(catId)
        const cat = cats.find((c) => c.id === catId)
        setCategoria(cat)
      } catch {
        navigate('/')
      } finally {
        setLoadingCtx(false)
      }
    }
    cargar()
  }, [torneoId, catId, navigate, fetchCombates])

  useEffect(() => {
    if (!combates.length) return
    const c = combates.find((cb) => cb.id === combateId)
    if (c) setCombate(c)
  }, [combates, combateId])

  // Calcular resultado cuando todos los puntajes estén confirmados
  useEffect(() => {
    const todoAka = confirmadosAka.every(Boolean) && puntajesAka.every((v) => v !== null)
    const todoAo = confirmadosAo.every(Boolean) && puntajesAo.every((v) => v !== null)
    if (!todoAka || !todoAo) { setGanador(null); return }

    try {
      const votos = puntajesAka.map((vAka, i) => calcularVotoJuez({ aka: vAka, ao: puntajesAo[i] }))
      const vAka = votos.filter((v) => v === 'aka').length
      const vAo = votos.filter((v) => v === 'ao').length
      setVotosAka(vAka)
      setVotosAo(vAo)
      setGanador(determinarGanadorKataBout(votos))
    } catch {
      setGanador(null)
    }
  }, [confirmadosAka, confirmadosAo, puntajesAka, puntajesAo])

  function handleChangePuntaje(lado, i, valor) {
    const set = lado === 'aka' ? setPuntajesAka : setPuntajesAo
    set((prev) => prev.map((v, idx) => idx === i ? valor : v))
  }

  function handleConfirmarPuntaje(lado, i) {
    const setConf = lado === 'aka' ? setConfirmadosAka : setConfirmadosAo
    setConf((prev) => prev.map((v, idx) => idx === i ? true : v))
  }

  function handleEditarPuntaje(lado, i) {
    const setConf = lado === 'aka' ? setConfirmadosAka : setConfirmadosAo
    setConf((prev) => prev.map((v, idx) => idx === i ? false : v))
  }

  function handleDQ(lado) {
    setConfirm({
      mensaje: `¿Confirmar descalificación (DQ — 0.0) para ${lado.toUpperCase()}?`,
      onConfirmar: () => {
        const set = lado === 'aka' ? setPuntajesAka : setPuntajesAo
        const setConf = lado === 'aka' ? setConfirmadosAka : setConfirmadosAo
        set(Array(NUM_JUECES).fill(0))
        setConf(Array(NUM_JUECES).fill(true))
        setConfirm(null)
      },
    })
  }

  function handleKiken(lado) {
    setConfirm({
      mensaje: `¿KIKEN para ${lado.toUpperCase()}? El rival avanza automáticamente.`,
      onConfirmar: () => {
        // Rival gana — asignar 4 votos al rival (estándar round-robin)
        const rival = lado === 'aka' ? 'ao' : 'aka'
        setGanador(rival)
        setVotosAka(lado === 'ao' ? 4 : 0)
        setVotosAo(lado === 'aka' ? 4 : 0)
        setConfirm(null)
      },
    })
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
          <p className="text-xs text-zinc-600">Kata</p>
        </div>
        <button onClick={abrirTV}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1.5">
          <ArrowSquareOut size={13} />
          Abrir TV
        </button>
      </div>

      {/* Paneles AKA y AO */}
      <div className="flex gap-4 flex-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">AKA</span>
          <PanelKata
            lado="aka"
            nombre="AKA"
            club={combate?.competidor_rojo_id?.slice(0, 8) || '—'}
            puntajes={puntajesAka}
            confirmados={confirmadosAka}
            onChangePuntaje={(i, v) => handleChangePuntaje('aka', i, v)}
            onConfirmarPuntaje={(i) => handleConfirmarPuntaje('aka', i)}
            onEditarPuntaje={(i) => handleEditarPuntaje('aka', i)}
            onDQ={() => handleDQ('aka')}
            onKiken={() => handleKiken('aka')}
            numJueces={NUM_JUECES}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">AO</span>
          <PanelKata
            lado="ao"
            nombre="AO"
            club={combate?.competidor_azul_id?.slice(0, 8) || '—'}
            puntajes={puntajesAo}
            confirmados={confirmadosAo}
            onChangePuntaje={(i, v) => handleChangePuntaje('ao', i, v)}
            onConfirmarPuntaje={(i) => handleConfirmarPuntaje('ao', i)}
            onEditarPuntaje={(i) => handleEditarPuntaje('ao', i)}
            onDQ={() => handleDQ('ao')}
            onKiken={() => handleKiken('ao')}
            numJueces={NUM_JUECES}
          />
        </div>
      </div>

      {/* Resultado */}
      {ganador && (
        <div className={`rounded-2xl p-4 text-center border ${
          ganador === 'aka'
            ? 'bg-rose-950/60 border-rose-700'
            : 'bg-sky-950/60 border-sky-700'
        }`}>
          <p className={`font-black text-xl ${ganador === 'aka' ? 'text-rose-300' : 'text-sky-300'}`}>
            GANADOR: {ganador.toUpperCase()}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Votos: AKA {votosAka} — AO {votosAo}
          </p>
          <button
            onClick={() => navigate(`/torneo/${torneoId}/categoria/${catId}/bracket`)}
            className="mt-3 bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
          >
            Confirmar y volver al bracket →
          </button>
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
