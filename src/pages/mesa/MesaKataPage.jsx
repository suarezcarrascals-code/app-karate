import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TelevisionSimple, Warning } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias } from '../../lib/categorias'
import { calcularVotoJuez, determinarGanadorKataBout, validarKataPermitido } from '../../lib/scoring'

const JUECES = ['j1', 'j2', 'j3', 'j4', 'j5']
const SCORES_INIT = { j1: '', j2: '', j3: '', j4: '', j5: '' }

function fmtNombre(comp) {
  if (!comp) return '—'
  return `${comp.nombre} ${comp.apellido}`
}

function nombreRonda(combate, maxRonda) {
  if (!combate) return ''
  if (combate.orden_en_ronda === 0) return '3er Puesto'
  if (combate.ronda === maxRonda) return 'Final'
  if (combate.ronda === maxRonda - 1 && maxRonda > 1) return 'Semifinal'
  return `Ronda ${combate.ronda}`
}

function ScoreInput({ juezIdx, lado, valor, onChange, disabled }) {
  const color = lado === 'rojo' ? 'rose' : 'sky'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-zinc-500 font-medium">J{juezIdx + 1}</span>
      <input
        type="number"
        min="5.0"
        max="10.0"
        step="0.1"
        disabled={disabled}
        value={valor}
        onChange={(e) => onChange(juezIdx, e.target.value)}
        placeholder="—"
        className={`w-16 h-10 rounded-lg text-center font-bold text-sm tabular-nums
          bg-zinc-900 border disabled:opacity-40 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2
          ${color === 'rose'
            ? 'border-rose-800 text-rose-200 focus:ring-rose-600'
            : 'border-sky-800 text-sky-200 focus:ring-sky-600'
          }`}
      />
    </div>
  )
}

function ScoreLocked({ juezIdx, lado, valor }) {
  const color = lado === 'rojo' ? 'rose' : 'sky'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-zinc-500 font-medium">J{juezIdx + 1}</span>
      <div className={`w-16 h-10 rounded-lg flex items-center justify-center font-bold text-sm tabular-nums
        ${color === 'rose' ? 'bg-rose-950/60 text-rose-300' : 'bg-sky-950/60 text-sky-300'}`}>
        {valor !== null && valor !== '' ? parseFloat(valor).toFixed(1) : '—'}
      </div>
    </div>
  )
}

export default function MesaKataPage() {
  const { token, catId, combateId } = useParams()
  const navigate = useNavigate()

  const [link, setLink] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [compRojo, setCompRojo] = useState(null)
  const [compAzul, setCompAzul] = useState(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)

  // Fase: 'anuncio' | 'rojo_performance' | 'azul_performance' | 'resultado'
  const [fase, setFase] = useState('anuncio')

  // Katas anunciados
  const [kataRojo, setKataRojo] = useState('')
  const [kataAzul, setKataAzul] = useState('')
  const [historialRojo, setHistorialRojo] = useState([])
  const [historialAzul, setHistorialAzul] = useState([])

  // Puntajes (string para compatibilidad con input)
  const [scoresRojo, setScoresRojo] = useState({ ...SCORES_INIT })
  const [scoresAzul, setScoresAzul] = useState({ ...SCORES_INIT })

  // Resultado calculado
  const [votos, setVotos] = useState([]) // ['rojo'|'azul', ...]
  const [ganador, setGanador] = useState(null) // 'rojo' | 'azul'

  // UI state
  const [guardando, setGuardando] = useState(false)
  const [errorEmpate, setErrorEmpate] = useState(null)
  const [modalKiken, setModalKiken] = useState(null) // 'rojo' | 'azul'
  const [modalDQ, setModalDQ] = useState(null) // { lado: 'rojo'|'azul' }

  // Cronómetro anuncio (35s)
  const [timer, setTimer] = useState(35)
  const [timerActivo, setTimerActivo] = useState(false)
  const [timerLado, setTimerLado] = useState(null) // 'rojo' | 'azul'
  const timerRef = useRef(null)

  // Warnings de kata
  const [warnRojo, setWarnRojo] = useState(null)
  const [warnAzul, setWarnAzul] = useState(null)

  // Max ronda para label
  const [maxRonda, setMaxRonda] = useState(1)

  // Número de jueces activos: 3 o 5
  const [numJueces, setNumJueces] = useState(5)
  const juecesActivos = JUECES.slice(0, numJueces)

  // Indicador online/offline
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    async function cargar() {
      const linkData = await fetchLinkMesaByToken(token)
      if (!linkData) { navigate('/'); return }
      setLink(linkData)

      const cats = await fetchCategorias(linkData.torneo_id)
      const cat = cats.find((c) => c.id === catId) ?? null
      setCategoria(cat)

      if (cat && cat.modalidad !== 'kata_individual') {
        setLoading(false)
        return
      }

      const { data: c } = await supabase
        .from('combate')
        .select('*')
        .eq('id', combateId)
        .single()

      if (!c) { setLoading(false); return }
      setCombate(c)

      // Resolver nombres de competidores
      const [rData, aData] = await Promise.all([
        supabase.from('competidor').select('id,nombre,apellido,dojo:dojo_id(nombre)').eq('id', c.competidor_rojo_id).single(),
        supabase.from('competidor').select('id,nombre,apellido,dojo:dojo_id(nombre)').eq('id', c.competidor_azul_id).single(),
      ])
      if (rData.data) setCompRojo(rData.data)
      if (aData.data) setCompAzul(aData.data)

      // Calcular max ronda para label
      const { data: todosCombates } = await supabase
        .from('combate')
        .select('ronda')
        .eq('categoria_id', catId)
      if (todosCombates?.length) {
        setMaxRonda(Math.max(...todosCombates.map((x) => x.ronda)))
      }

      // Cargar historial de katas del competidor rojo
      if (c.competidor_rojo_id) {
        const { data: hr } = await supabase
          .from('combate')
          .select('kata_anunciado_rojo')
          .eq('competidor_rojo_id', c.competidor_rojo_id)
          .eq('categoria_id', catId)
          .eq('estado', 'finalizado')
          .neq('id', combateId)
          .order('created_at', { ascending: true })
        setHistorialRojo((hr ?? []).map((x) => x.kata_anunciado_rojo).filter(Boolean))
      }

      // Cargar historial de katas del competidor azul
      if (c.competidor_azul_id) {
        const { data: ha } = await supabase
          .from('combate')
          .select('kata_anunciado_azul')
          .eq('competidor_azul_id', c.competidor_azul_id)
          .eq('categoria_id', catId)
          .eq('estado', 'finalizado')
          .neq('id', combateId)
          .order('created_at', { ascending: true })
        setHistorialAzul((ha ?? []).map((x) => x.kata_anunciado_azul).filter(Boolean))
      }

      // Inferir fase desde DB
      inferirFase(c)

      setLoading(false)
    }
    cargar()
  }, [token, catId, combateId, navigate])

  function inferirFase(c) {
    // Inferir número de jueces: si j4_rojo tiene valor → 5, si j1_rojo existe pero j4 es null → 3
    // Antes de confirmar AKA leer localStorage
    if (c.j1_rojo !== null) {
      setNumJueces(c.j4_rojo !== null ? 5 : 3)
    } else {
      const saved = localStorage.getItem(`kata_jueces_${c.id}`)
      if (saved) setNumJueces(parseInt(saved, 10))
    }

    const nj = c.j1_rojo !== null ? (c.j4_rojo !== null ? 5 : 3) : 5

    if (c.estado === 'finalizado') {
      setFase('resultado')
      if (c.j1_rojo !== null) {
        const sR = JUECES.reduce((acc, j) => ({ ...acc, [j]: c[`${j}_rojo`] ?? '' }), {})
        const sA = JUECES.reduce((acc, j) => ({ ...acc, [j]: c[`${j}_azul`] ?? '' }), {})
        setScoresRojo(sR)
        setScoresAzul(sA)
        if (c.j1_azul !== null) recalcularResultado(sR, sA, nj)
      }
    } else if (c.j1_rojo !== null) {
      setFase('azul_performance')
      const sR = JUECES.reduce((acc, j) => ({ ...acc, [j]: c[`${j}_rojo`] ?? '' }), {})
      setScoresRojo(sR)
    } else {
      setFase('anuncio')
    }
    if (c.kata_anunciado_rojo) setKataRojo(c.kata_anunciado_rojo)
    if (c.kata_anunciado_azul) setKataAzul(c.kata_anunciado_azul)
  }

  function recalcularResultado(sR, sA, nj = numJueces) {
    try {
      const activos = JUECES.slice(0, nj)
      const vv = activos.map((j) =>
        calcularVotoJuez({ aka: parseFloat(sR[j]), ao: parseFloat(sA[j]) }) === 'aka' ? 'rojo' : 'azul'
      )
      const ganadorAkaAo = determinarGanadorKataBout(
        vv.map((v) => (v === 'rojo' ? 'aka' : 'ao'))
      )
      setVotos(vv)
      setGanador(ganadorAkaAo === 'aka' ? 'rojo' : 'azul')
    } catch {
      // puntajes inválidos o incompletos — no calcular aún
    }
  }

  // Cronómetro 35s
  function iniciarTimer(lado) {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(35)
    setTimerLado(lado)
    setTimerActivo(true)
    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const restantes = Math.max(0, 35 - elapsed)
      setTimer(restantes)
      if (restantes <= 0) {
        clearInterval(timerRef.current)
        setTimerActivo(false)
      }
    }, 100)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Validar kata anunciado
  function validarKata(kata, historial, setWarn) {
    if (!kata.trim()) return
    if (!validarKataPermitido(kata.trim(), historial)) {
      const ultimo = historial[historial.length - 1]
      const usos = historial.filter((k) => k === kata.trim()).length
      if (usos >= 2) {
        setWarn(`"${kata}" ya se usó 2 veces en este torneo (máximo WKF).`)
      } else if (ultimo === kata.trim()) {
        setWarn(`"${kata}" fue el kata del bout anterior y no puede repetirse seguido.`)
      }
    } else {
      setWarn(null)
    }
  }

  // Score change handlers
  function cambiarScoreRojo(idx, val) {
    setScoresRojo((prev) => ({ ...prev, [JUECES[idx]]: val }))
    setErrorEmpate(null)
  }
  function cambiarScoreAzul(idx, val) {
    setScoresAzul((prev) => ({ ...prev, [JUECES[idx]]: val }))
    setErrorEmpate(null)
  }

  function cambiarNumJueces(n) {
    setNumJueces(n)
    localStorage.setItem(`kata_jueces_${combateId}`, n)
  }

  // DQ (0.0) para un lado completo
  function aplicarDQ(lado) {
    const zeros = juecesActivos.reduce((acc, j) => ({ ...acc, [j]: '0.0' }), {})
    if (lado === 'rojo') setScoresRojo(zeros)
    else setScoresAzul(zeros)
    setModalDQ(null)
  }

  // Confirmar puntajes AKA (rojo)
  async function confirmarRojo() {
    const faltantes = juecesActivos.filter((j) => scoresRojo[j] === '' || scoresRojo[j] === null)
    if (faltantes.length) { setErrorEmpate(`Completa los puntajes: ${faltantes.map((j) => j.toUpperCase()).join(', ')}`); return }
    setGuardando(true)
    const rojoScores = Object.fromEntries(juecesActivos.map((j) => [`${j}_rojo`, parseFloat(scoresRojo[j])]))
    const update = {
      estado: 'en_curso',
      kata_anunciado_rojo: kataRojo.trim() || null,
      ...rojoScores,
    }
    await supabase.from('combate').update(update).eq('id', combateId)
    setCombate((prev) => ({ ...prev, ...update }))
    setFase('azul_performance')
    setGuardando(false)
  }

  // Confirmar puntajes AO (azul)
  async function confirmarAzul() {
    const faltantes = juecesActivos.filter((j) => scoresAzul[j] === '' || scoresAzul[j] === null)
    if (faltantes.length) { setErrorEmpate(`Completa los puntajes: ${faltantes.map((j) => j.toUpperCase()).join(', ')}`); return }

    // Detectar empates por juez
    const conflictos = juecesActivos.filter(
      (j) => parseFloat(scoresRojo[j]) === parseFloat(scoresAzul[j])
    )
    if (conflictos.length) {
      setErrorEmpate(
        `${conflictos.map((j) => j.toUpperCase()).join(', ')} tienen igual puntaje para AKA y AO. Corrige antes de confirmar.`
      )
      return
    }

    setGuardando(true)
    const azulScores = Object.fromEntries(juecesActivos.map((j) => [`${j}_azul`, parseFloat(scoresAzul[j])]))
    const update = {
      kata_anunciado_azul: kataAzul.trim() || null,
      ...azulScores,
    }
    await supabase.from('combate').update(update).eq('id', combateId)
    setCombate((prev) => ({ ...prev, ...update }))

    // Calcular votos y ganador
    const vv = juecesActivos.map((j) =>
      calcularVotoJuez({ aka: parseFloat(scoresRojo[j]), ao: parseFloat(scoresAzul[j]) }) === 'aka' ? 'rojo' : 'azul'
    )
    const ganadorAkaAo = determinarGanadorKataBout(vv.map((v) => (v === 'rojo' ? 'aka' : 'ao')))
    setVotos(vv)
    setGanador(ganadorAkaAo === 'aka' ? 'rojo' : 'azul')
    setFase('resultado')
    setGuardando(false)
  }

  // Finalizar bout
  async function finalizarBout() {
    if (!ganador) return
    setGuardando(true)
    const ganadorId = ganador === 'rojo' ? combate.competidor_rojo_id : combate.competidor_azul_id
    await supabase.from('combate').update({
      estado: 'finalizado',
      ganador_id: ganadorId,
    }).eq('id', combateId)
    navigate(`/mesa/${token}/categoria/${catId}`)
  }

  // KIKEN
  async function confirmarKiken() {
    if (!modalKiken) return
    setGuardando(true)
    const ganadorId = modalKiken === 'rojo' ? combate.competidor_azul_id : combate.competidor_rojo_id
    await supabase.from('combate').update({
      estado: 'finalizado',
      ganador_id: ganadorId,
    }).eq('id', combateId)
    navigate(`/mesa/${token}/categoria/${catId}`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (categoria && categoria.modalidad !== 'kata_individual') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Warning size={32} className="text-amber-500" />
        <p className="text-zinc-300 font-semibold">Esta categoría no es kata individual</p>
        <p className="text-zinc-600 text-sm">Modalidad: {categoria.modalidad}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-zinc-500 underline mt-2">Volver</button>
      </div>
    )
  }

  if (!combate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Combate no encontrado.</p>
      </div>
    )
  }

  const tvUrl = `/mesa/${token}/categoria/${catId}/combate/${combateId}/kata-tv`
  const rondaLabel = nombreRonda(combate, maxRonda)
  const puedeKiken = fase !== 'resultado'

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
        <button
          onClick={() => navigate(`/mesa/${token}/categoria/${catId}`)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <ArrowLeft size={13} />
          {link?.tatami?.nombre}
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-200 truncate max-w-[180px]">{categoria?.nombre}</p>
          <p className="text-[10px] text-zinc-600">{rondaLabel} · Kata Individual</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <button
            onClick={() => window.open(tvUrl, '_blank')}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded-lg transition-colors"
          >
            <TelevisionSimple size={12} />
            TV
          </button>
        </div>
      </div>

      {/* Competidores */}
      <div className="flex border-b border-zinc-900">
        <div className="flex-1 py-3 px-4 border-r border-zinc-900 bg-sky-950/20">
          <p className="text-[10px] text-sky-500 font-bold tracking-widest uppercase mb-0.5">AO</p>
          <p className="font-bold text-zinc-100 text-sm leading-tight">{fmtNombre(compAzul)}</p>
          <p className="text-[10px] text-zinc-600">{compAzul?.dojo?.nombre}</p>
        </div>
        <div className="flex-1 py-3 px-4 bg-rose-950/20">
          <p className="text-[10px] text-rose-500 font-bold tracking-widest uppercase mb-0.5">AKA</p>
          <p className="font-bold text-zinc-100 text-sm leading-tight">{fmtNombre(compRojo)}</p>
          <p className="text-[10px] text-zinc-600">{compRojo?.dojo?.nombre}</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">

        {/* ── FASE: ANUNCIO ── */}
        {fase === 'anuncio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Anuncio de kata</h2>
              {timerActivo && (
                <div className={`text-2xl font-black tabular-nums ${timer <= 10 ? 'text-amber-400 animate-pulse' : 'text-zinc-300'}`}>
                  {Math.ceil(timer)}s
                </div>
              )}
            </div>

            {/* AKA — anuncio */}
            <div className="bg-zinc-900 rounded-xl border border-rose-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-rose-400 tracking-widest uppercase">AKA anuncia</p>
                {!timerActivo && (
                  <button
                    onClick={() => iniciarTimer('rojo')}
                    className="text-[11px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ▶ 35s
                  </button>
                )}
                {timerActivo && timerLado === 'rojo' && (
                  <span className={`text-sm font-black ${timer <= 10 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {Math.ceil(timer)}s
                  </span>
                )}
              </div>
              <input
                type="text"
                value={kataRojo}
                onChange={(e) => {
                  setKataRojo(e.target.value)
                  validarKata(e.target.value, historialRojo, setWarnRojo)
                }}
                placeholder="Ej: Bassai Dai"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-700"
              />
              {warnRojo && (
                <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2">
                  <Warning size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-300">{warnRojo}</p>
                </div>
              )}
            </div>

            {/* AO — anuncio */}
            <div className="bg-zinc-900 rounded-xl border border-sky-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-sky-400 tracking-widest uppercase">AO anuncia</p>
                {!timerActivo && (
                  <button
                    onClick={() => iniciarTimer('azul')}
                    className="text-[11px] px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ▶ 35s
                  </button>
                )}
                {timerActivo && timerLado === 'azul' && (
                  <span className={`text-sm font-black ${timer <= 10 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {Math.ceil(timer)}s
                  </span>
                )}
              </div>
              <input
                type="text"
                value={kataAzul}
                onChange={(e) => {
                  setKataAzul(e.target.value)
                  validarKata(e.target.value, historialAzul, setWarnAzul)
                }}
                placeholder="Ej: Kanku Dai"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-700"
              />
              {warnAzul && (
                <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2">
                  <Warning size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-300">{warnAzul}</p>
                </div>
              )}
            </div>

            {/* Toggle número de jueces */}
            <div className="flex items-center gap-3 bg-zinc-900 rounded-xl border border-zinc-800 px-4 py-3">
              <span className="text-xs text-zinc-500 flex-1">Jueces</span>
              {[3, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => cambiarNumJueces(n)}
                  className={`w-10 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                    numJueces === n
                      ? 'bg-zinc-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={() => setFase('rojo_performance')}
              className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Iniciar performance AKA →
            </button>
          </div>
        )}

        {/* ── FASE: ROJO PERFORMANCE ── */}
        {fase === 'rojo_performance' && (
          <div className="space-y-4">
            {/* Toggle jueces — editable hasta que AKA confirme */}
            <div className="flex items-center gap-3 bg-zinc-900 rounded-xl border border-zinc-800 px-4 py-2.5">
              <span className="text-xs text-zinc-500 flex-1">Jueces</span>
              {[3, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => { cambiarNumJueces(n); setScoresRojo({ ...SCORES_INIT }) }}
                  className={`w-10 py-1 rounded-lg text-sm font-bold transition-colors ${
                    numJueces === n
                      ? 'bg-zinc-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900 rounded-xl border border-rose-900/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-rose-400 uppercase tracking-wider">AKA actúa</p>
                {kataRojo && <p className="text-xs text-zinc-500">{kataRojo}</p>}
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {juecesActivos.map((_, idx) => (
                  <ScoreInput
                    key={idx}
                    juezIdx={idx}
                    lado="rojo"
                    valor={scoresRojo[juecesActivos[idx]]}
                    onChange={cambiarScoreRojo}
                    disabled={false}
                  />
                ))}
              </div>
              <button
                onClick={() => setModalDQ({ lado: 'rojo' })}
                className="w-full py-2 bg-zinc-800 border border-zinc-700 text-red-500 font-bold rounded-lg text-xs hover:bg-zinc-700 transition-colors"
              >
                DQ AKA (0.0 todos los jueces)
              </button>
            </div>

            {errorEmpate && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3 text-xs text-red-300">
                {errorEmpate}
              </div>
            )}

            <button
              onClick={confirmarRojo}
              disabled={guardando || juecesActivos.some((j) => scoresRojo[j] === '')}
              className="w-full py-3 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {guardando ? 'Guardando...' : 'Confirmar puntajes AKA →'}
            </button>
          </div>
        )}

        {/* ── FASE: AZUL PERFORMANCE ── */}
        {fase === 'azul_performance' && (
          <div className="space-y-4">
            {/* Resumen AKA bloqueado */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">AKA confirmado</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {juecesActivos.map((_, idx) => (
                  <ScoreLocked key={idx} juezIdx={idx} lado="rojo" valor={scoresRojo[juecesActivos[idx]]} />
                ))}
              </div>
            </div>

            {/* Panel AO */}
            <div className="bg-zinc-900 rounded-xl border border-sky-900/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-sky-400 uppercase tracking-wider">AO actúa</p>
                {kataAzul && <p className="text-xs text-zinc-500">{kataAzul}</p>}
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {juecesActivos.map((_, idx) => (
                  <ScoreInput
                    key={idx}
                    juezIdx={idx}
                    lado="azul"
                    valor={scoresAzul[juecesActivos[idx]]}
                    onChange={cambiarScoreAzul}
                    disabled={false}
                  />
                ))}
              </div>
              <button
                onClick={() => setModalDQ({ lado: 'azul' })}
                className="w-full py-2 bg-zinc-800 border border-zinc-700 text-red-500 font-bold rounded-lg text-xs hover:bg-zinc-700 transition-colors"
              >
                DQ AO (0.0 todos los jueces)
              </button>
            </div>

            {errorEmpate && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3 text-xs text-red-300">
                {errorEmpate}
              </div>
            )}

            <button
              onClick={confirmarAzul}
              disabled={guardando || juecesActivos.some((j) => scoresAzul[j] === '')}
              className="w-full py-3 bg-sky-700 hover:bg-sky-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {guardando ? 'Guardando...' : 'Confirmar puntajes AO →'}
            </button>
          </div>
        )}

        {/* ── FASE: RESULTADO ── */}
        {fase === 'resultado' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 text-center">Resultado del bout</h2>

            {/* Tabla de votos */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-4 py-2 bg-zinc-800/50">
                <span>Juez</span>
                <span className="text-center text-sky-400">AO</span>
                <span className="text-center text-rose-400">AKA</span>
                <span className="text-center">Voto</span>
              </div>
              {juecesActivos.map((j, idx) => {
                const voto = votos[idx]
                return (
                  <div key={j} className="grid grid-cols-4 px-4 py-2.5 border-t border-zinc-800 items-center">
                    <span className="text-xs text-zinc-500">J{idx + 1}</span>
                    <span className={`text-center font-bold tabular-nums text-sm ${voto === 'azul' ? 'text-sky-300' : 'text-zinc-600'}`}>
                      {scoresAzul[j] !== '' ? parseFloat(scoresAzul[j]).toFixed(1) : '—'}
                    </span>
                    <span className={`text-center font-bold tabular-nums text-sm ${voto === 'rojo' ? 'text-rose-300' : 'text-zinc-600'}`}>
                      {scoresRojo[j] !== '' ? parseFloat(scoresRojo[j]).toFixed(1) : '—'}
                    </span>
                    <span className={`text-center text-xs font-bold ${voto === 'rojo' ? 'text-rose-400' : 'text-sky-400'}`}>
                      {voto === 'rojo' ? 'AKA' : 'AO'}
                    </span>
                  </div>
                )
              })}
              <div className="grid grid-cols-4 px-4 py-3 bg-zinc-800/30 border-t border-zinc-700 items-center">
                <span className="text-xs font-bold text-zinc-400 col-span-2">Votos AO</span>
                <span className="text-center text-xl font-black text-sky-400 col-start-2">
                  {votos.filter((v) => v === 'azul').length}
                </span>
                <span className="text-center text-xl font-black text-rose-400">
                  {votos.filter((v) => v === 'rojo').length}
                </span>
              </div>
            </div>

            {/* Banner ganador */}
            <div className={`rounded-xl py-4 text-center font-black text-lg tracking-wider uppercase ${
              ganador === 'rojo' ? 'bg-rose-900/50 text-rose-200 border border-rose-700/40' : 'bg-sky-900/50 text-sky-200 border border-sky-700/40'
            }`}>
              Ganador: {ganador === 'rojo' ? `AKA — ${fmtNombre(compRojo)}` : `AO — ${fmtNombre(compAzul)}`}
            </div>

            <button
              onClick={finalizarBout}
              disabled={guardando || combate.estado === 'finalizado'}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {combate.estado === 'finalizado' ? 'Bout ya finalizado' : guardando ? 'Guardando...' : 'Finalizar bout'}
            </button>
          </div>
        )}

        {/* ── KIKEN ── (disponible fuera del resultado) */}
        {puedeKiken && (
          <div className="border-t border-zinc-900 pt-4 flex gap-3">
            <button
              onClick={() => setModalKiken('azul')}
              className="flex-1 py-2 text-xs font-bold text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 rounded-lg transition-colors"
            >
              KIKEN AO
            </button>
            <button
              onClick={() => setModalKiken('rojo')}
              className="flex-1 py-2 text-xs font-bold text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 rounded-lg transition-colors"
            >
              KIKEN AKA
            </button>
          </div>
        )}
      </div>

      {/* Modal KIKEN */}
      {modalKiken && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-zinc-100">Confirmar KIKEN</h3>
            <p className="text-sm text-zinc-400">
              ¿{modalKiken === 'rojo' ? fmtNombre(compRojo) : fmtNombre(compAzul)} no se presenta?
              El rival avanzará automáticamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalKiken(null)}
                className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarKiken}
                disabled={guardando}
                className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Confirmar KIKEN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal DQ */}
      {modalDQ && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-zinc-100">Confirmar DQ</h3>
            <p className="text-sm text-zinc-400">
              ¿Descalificar a {modalDQ.lado === 'rojo' ? 'AKA' : 'AO'}?
              Todos sus puntajes quedarán en 0.0.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalDQ(null)}
                className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => aplicarDQ(modalDQ.lado)}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Confirmar DQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
