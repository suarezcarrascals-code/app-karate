import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ArrowSquareOut, Warning } from '@phosphor-icons/react'
import { fetchLinkMesaTecnicaByToken } from '../lib/linksMesaTecnica'
import { supabase } from '../lib/supabase'
import useMarcadorStore from '../stores/useMarcadorStore'
import { penalizacionDisponible } from '../lib/scoring'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Individual',
  kumite_equipo: 'Kumite Equipo',
  kata_individual: 'Kata Individual',
  kata_equipo: 'Kata Equipo',
}

const ESTADO_COMBATE_BADGE = {
  pendiente: 'bg-zinc-800 text-zinc-500',
  en_curso: 'bg-amber-950/60 text-amber-400',
  finalizado: 'bg-zinc-800/50 text-zinc-600',
  bye: 'bg-zinc-800/40 text-zinc-700',
}

function formatTiempo(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0')
  const s = (seg % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function duracionSegs(categoria) {
  const nombre = (categoria?.nombre || '').toLowerCase()
  if (nombre.includes('senior')) return 180
  if (nombre.includes('u21')) return 180
  if (nombre.includes('junior')) return 120
  if (nombre.includes('cadet')) return 90
  if (nombre.includes('u14')) return 90
  return 120
}

// ─── Panel de atleta (reutiliza lógica de KumiteMarcador) ────────────────────

function AtletaPanel({ lado, nombre, club, scoring, onPunto, onDeshacerPunto, onPenalizar }) {
  const puntos = scoring[`puntos_${lado}`]
  const chui = scoring[`chui_${lado}`]
  const hansokuChui = scoring[`hansoku_chui_${lado}`]
  const proxPenalizacion = penalizacionDisponible(scoring, lado)
  const bgScore = lado === 'aka' ? 'bg-rose-600' : 'bg-sky-600'
  const bgCard = lado === 'aka' ? 'bg-rose-950/20 border-rose-900/40' : 'bg-sky-950/20 border-sky-900/40'
  const BTN = 'flex-1 py-4 rounded-xl font-bold text-lg tracking-wide transition-all active:scale-95 select-none'

  return (
    <div className={`flex-1 rounded-2xl border p-4 flex flex-col gap-3 ${bgCard}`}>
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

      <div className="flex gap-2">
        <button onClick={() => onPunto(lado, 'yuko')}
          className={`${BTN} bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700`}>
          YUKO<br /><span className="text-sm font-normal text-zinc-400">+1</span>
        </button>
        <button onClick={() => onPunto(lado, 'waza_ari')}
          className={`${BTN} bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700`}>
          WAZA-ARI<br /><span className="text-sm font-normal text-zinc-400">+2</span>
        </button>
        <button onClick={() => onPunto(lado, 'ippon')}
          className={`${BTN} bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600`}>
          IPPON<br /><span className="text-sm font-normal text-zinc-300">+3</span>
        </button>
      </div>

      <button onClick={() => onDeshacerPunto(lado)}
        className="w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800 transition-colors">
        ↩ Deshacer último punto
      </button>

      <div className="border-t border-zinc-800/60 pt-3">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Penalizaciones</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { tipo: 'chui', label: `CHUI\n${chui}/3`, cls: 'bg-amber-950/60 text-amber-300 border-amber-900/50', cond: 'chui' },
            { tipo: 'jogai', label: 'JOGAI\n=CHUI', cls: 'bg-amber-950/40 text-amber-400/70 border-amber-900/30 text-xs', cond: 'chui' },
            { tipo: 'hansoku_chui', label: 'HANSOKU\nCHUI', cls: 'bg-orange-950/60 text-orange-300 border-orange-900/50', cond: 'hansoku_chui' },
            { tipo: 'hansoku', label: 'HANSOKU', cls: 'bg-rose-950/60 text-rose-300 border-rose-900/50', cond: 'hansoku' },
            { tipo: 'shikkaku', label: 'SHIKKAKU', cls: 'bg-red-950/80 text-red-300 border-red-900/60' },
          ].map(({ tipo, label, cls, cond }) => (
            <button
              key={tipo}
              onClick={() => onPenalizar(lado, tipo)}
              disabled={cond && proxPenalizacion !== cond}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Panel de marcador inline ─────────────────────────────────────────────────

function PanelKumite({ combate, categoria, torneoId, onVolver }) {
  const [confirm, setConfirm] = useState(null)
  const [confirmado, setConfirmado] = useState(false)

  const {
    scoring, tiempoSegundos, corriendo, boutFinalizado, ganador, loading, error,
    iniciar, marcarPunto, deshacerPunto, penalizar,
    iniciarCronometro, pausarCronometro, resetearCronometro,
    confirmarResultado,
  } = useMarcadorStore()

  const nombreAka = combate.competidor_rojo
    ? `${combate.competidor_rojo.nombre} ${combate.competidor_rojo.apellido}`
    : 'AKA'
  const nombreAo = combate.competidor_azul
    ? `${combate.competidor_azul.nombre} ${combate.competidor_azul.apellido}`
    : 'AO'
  const clubAka = combate.competidor_rojo?.club || ''
  const clubAo = combate.competidor_azul?.club || ''

  useEffect(() => {
    const duracion = duracionSegs(categoria)
    iniciar(combate, categoria, null, null, duracion)
    resetearCronometro(duracion)
  }, [combate.id]) // eslint-disable-line

  const atoShibaraku = tiempoSegundos === 15 && corriendo

  function handlePenalizar(lado, tipo) {
    if (tipo === 'shikkaku') {
      setConfirm({
        msg: `¿SHIKKAKU para ${lado.toUpperCase()}? El atleta queda descalificado del torneo completo.`,
        fn: () => { penalizar(lado, tipo); setConfirm(null) },
      })
      return
    }
    if (tipo === 'hansoku') {
      setConfirm({
        msg: `¿HANSOKU para ${lado.toUpperCase()}? El atleta pierde el bout.`,
        fn: () => { penalizar(lado, tipo); setConfirm(null) },
      })
      return
    }
    penalizar(lado, tipo)
  }

  async function handleConfirmarResultado() {
    await confirmarResultado()
    setConfirmado(true)
  }

  function abrirTV() {
    window.open(`/torneo/${torneoId}/marcador/${combate.id}/tv`, '_blank', 'noopener')
  }

  if (confirmado) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-emerald-400 font-semibold text-lg">Resultado guardado</p>
        <button onClick={onVolver} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Volver a categorías
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header del marcador */}
      <div className="flex items-center justify-between">
        <button onClick={onVolver}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          <ArrowLeft size={13} /> Categorías
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{categoria.nombre}</p>
          <p className="text-xs text-zinc-600">Ronda {combate.ronda} · #{combate.orden_en_ronda}</p>
        </div>
        <button onClick={abrirTV}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1.5">
          <ArrowSquareOut size={13} /> TV
        </button>
      </div>

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
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
              YAME
            </button>
          ) : (
            <button onClick={iniciarCronometro} disabled={boutFinalizado}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-40">
              HAJIME
            </button>
          )}
          <button onClick={() => resetearCronometro(duracionSegs(categoria))} disabled={corriendo}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-sm disabled:opacity-40">
            Reset
          </button>
        </div>
      </div>

      {/* SENSHU */}
      <div className="flex gap-2 justify-center text-xs">
        <span className="text-zinc-600">SENSHU:</span>
        {scoring.senshu
          ? <span className={`font-bold ${scoring.senshu === 'aka' ? 'text-rose-400' : 'text-sky-400'}`}>
              {scoring.senshu.toUpperCase()}
            </span>
          : <span className="text-zinc-700">—</span>
        }
      </div>

      {/* Paneles AKA / AO */}
      <div className="flex gap-3">
        <AtletaPanel
          lado="aka"
          nombre={nombreAka}
          club={clubAka}
          scoring={scoring}
          onPunto={marcarPunto}
          onDeshacerPunto={deshacerPunto}
          onPenalizar={handlePenalizar}
        />
        <AtletaPanel
          lado="ao"
          nombre={nombreAo}
          club={clubAo}
          scoring={scoring}
          onPunto={marcarPunto}
          onDeshacerPunto={deshacerPunto}
          onPenalizar={handlePenalizar}
        />
      </div>

      {/* Resultado */}
      {boutFinalizado && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 text-center">
          <p className="text-zinc-400 text-sm mb-1">Ganador del bout</p>
          <p className={`text-2xl font-black ${ganador === 'aka' ? 'text-rose-400' : ganador === 'ao' ? 'text-sky-400' : 'text-zinc-400'}`}>
            {ganador === 'aka' ? nombreAka : ganador === 'ao' ? nombreAo : 'HANTEI (empate)'}
          </p>
          {error && <p className="text-rose-400 text-xs mt-2">{error}</p>}
          <button onClick={handleConfirmarResultado} disabled={loading}
            className="mt-4 bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-600 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Confirmar y guardar resultado'}
          </button>
        </div>
      )}

      {/* Modal confirmación */}
      {confirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-zinc-100 font-semibold text-sm mb-4">{confirm.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-3 rounded-xl font-medium hover:bg-zinc-700">
                Cancelar
              </button>
              <button onClick={confirm.fn}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-500">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MarcadorPublico ──────────────────────────────────────────────────────────

export default function MarcadorPublico() {
  const { token } = useParams()
  const [fase, setFase] = useState('cargando') // cargando | invalido | esperando | finalizado | categorias | combates | marcador
  const [linkData, setLinkData] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [combates, setCombates] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [combateSeleccionado, setCombateSeleccionado] = useState(null)
  const [loadingCombates, setLoadingCombates] = useState(false)

  // 1. Validar token
  useEffect(() => {
    async function validar() {
      const link = await fetchLinkMesaTecnicaByToken(token)
      if (!link) { setFase('invalido'); return }
      setLinkData(link)

      const estado = link.torneo?.estado
      if (estado === 'finalizado') { setFase('finalizado'); return }
      if (estado !== 'en_curso') { setFase('esperando'); return }

      // Cargar categorías del tatami
      const { data } = await supabase
        .from('categoria')
        .select('id, nombre, modalidad, estado, orden_en_tatami')
        .eq('tatami_id', link.tatami_id)
        .in('estado', ['cerrada', 'en_curso'])
        .order('orden_en_tatami', { ascending: true, nullsFirst: false })
      setCategorias(data || [])
      setFase('categorias')
    }
    validar()
  }, [token])

  // 2. Cargar combates de la categoría seleccionada
  async function seleccionarCategoria(cat) {
    setCategoriaSeleccionada(cat)
    setLoadingCombates(true)
    setFase('combates')
    const { data } = await supabase
      .from('combate')
      .select(`
        *,
        competidor_rojo:competidor_rojo_id(id, nombre, apellido, club),
        competidor_azul:competidor_azul_id(id, nombre, apellido, club)
      `)
      .eq('categoria_id', cat.id)
      .neq('estado', 'bye')
      .order('ronda', { ascending: true })
      .order('orden_en_ronda', { ascending: true })
    setCombates(data || [])
    setLoadingCombates(false)
  }

  function seleccionarCombate(combate) {
    setCombateSeleccionado(combate)
    setFase('marcador')
  }

  function volverACategorias() {
    setCombateSeleccionado(null)
    setCategoriaSeleccionada(null)
    setFase('categorias')
  }

  function volverACombates() {
    setCombateSeleccionado(null)
    setFase('combates')
  }

  // ── Pantallas de estado ────────────────────────────────────────────────────

  if (fase === 'cargando') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (fase === 'invalido') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-rose-950/50 border border-rose-900/40 flex items-center justify-center mx-auto mb-5">
            <Warning size={24} className="text-rose-400" />
          </div>
          <h1 className="text-lg font-black text-zinc-100 mb-2">Link no válido</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2">
            Este link ya no es válido o fue desactivado.
          </p>
          <p className="text-zinc-500 text-sm">
            Pedile al organizador el link actualizado para este tatami.
          </p>
        </div>
      </div>
    )
  }

  if (fase === 'finalizado') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 text-lg font-semibold mb-2">El torneo ha finalizado</p>
          <p className="text-zinc-600 text-sm">{linkData?.torneo?.nombre}</p>
        </div>
      </div>
    )
  }

  if (fase === 'esperando') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="text-lg font-black text-zinc-100 mb-1">El torneo aún no ha comenzado</h1>
          <p className="text-zinc-400 text-sm">{linkData?.torneo?.nombre}</p>
          <p className="text-zinc-600 text-sm mt-1">{linkData?.tatami?.nombre}</p>
          <p className="text-zinc-700 text-xs mt-4">Esta pantalla no se actualiza automáticamente — refrescá cuando el torneo inicie.</p>
        </div>
      </div>
    )
  }

  // ── Header compartido para las pantallas operativas ───────────────────────

  const Header = () => (
    <div className="mb-5">
      <p className="text-xs font-semibold text-rose-500 tracking-widest uppercase">{linkData?.tatami?.nombre}</p>
      <p className="text-zinc-600 text-xs">{linkData?.torneo?.nombre}</p>
    </div>
  )

  // ── Selector de categorías ─────────────────────────────────────────────────

  if (fase === 'categorias') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-6 max-w-2xl mx-auto">
        <Header />
        <h2 className="text-base font-bold mb-4">Seleccioná una categoría</h2>
        {categorias.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-12">
            No hay categorías con bracket activo en este tatami.
          </p>
        ) : (
          <div className="space-y-3">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => seleccionarCategoria(cat)}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-colors"
              >
                <p className="font-semibold text-zinc-100 text-sm">{cat.nombre}</p>
                <p className="text-xs text-zinc-500 mt-1">{MODALIDAD_LABEL[cat.modalidad] || cat.modalidad}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Selector de combates ───────────────────────────────────────────────────

  if (fase === 'combates') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-6 max-w-2xl mx-auto">
        <Header />
        <button onClick={volverACategorias}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 mb-4 transition-colors">
          <ArrowLeft size={12} /> Categorías
        </button>
        <h2 className="text-base font-bold mb-1">{categoriaSeleccionada?.nombre}</h2>
        <p className="text-xs text-zinc-600 mb-4">
          {MODALIDAD_LABEL[categoriaSeleccionada?.modalidad]}
        </p>

        {loadingCombates ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : combates.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-12">No hay combates en esta categoría.</p>
        ) : (
          <div className="space-y-2">
            {combates.map((c) => {
              const nombreRojo = c.competidor_rojo
                ? `${c.competidor_rojo.nombre} ${c.competidor_rojo.apellido}`
                : '—'
              const nombreAzul = c.competidor_azul
                ? `${c.competidor_azul.nombre} ${c.competidor_azul.apellido}`
                : '—'
              return (
                <button
                  key={c.id}
                  onClick={() => seleccionarCombate(c)}
                  disabled={c.estado === 'finalizado'}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-3.5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs text-zinc-600">Ronda {c.ronda} · #{c.orden_en_ronda}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COMBATE_BADGE[c.estado]}`}>
                      {c.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-rose-300 flex-1 truncate">{nombreRojo}</span>
                    <span className="text-xs text-zinc-600 shrink-0">vs</span>
                    <span className="text-sm font-medium text-sky-300 flex-1 truncate text-right">{nombreAzul}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Marcador activo ────────────────────────────────────────────────────────

  if (fase === 'marcador' && combateSeleccionado && categoriaSeleccionada) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-4 max-w-3xl mx-auto">
        <Header />
        <PanelKumite
          combate={combateSeleccionado}
          categoria={categoriaSeleccionada}
          torneoId={linkData?.torneo?.id}
          onVolver={volverACombates}
        />
      </div>
    )
  }

  return null
}
