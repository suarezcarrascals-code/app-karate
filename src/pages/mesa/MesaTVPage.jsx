import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias } from '../../lib/categorias'

function fmtTime(seg) {
  const total = Math.max(0, Math.round(seg))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function calcularSegRestantes(combate) {
  const base = combate.timer_seg_restantes ?? 180
  if (!combate.timer_activo || !combate.timer_inicio_ts) return base
  const elapsed = (Date.now() - new Date(combate.timer_inicio_ts).getTime()) / 1000
  return Math.max(0, base - elapsed)
}

// 5 puntos progresivos: 1-3 Chui (amarillo), 4 HC (naranja), 5 H (rojo)
const DOT_TV = [
  '', 'bg-yellow-400', 'bg-yellow-400', 'bg-amber-500', 'bg-orange-500', 'bg-red-600',
]

function AmonBadge({ amon, shikkaku }) {
  const nivel = shikkaku ? 5 : (amon ?? 0)
  const esH = nivel >= 5
  const esHC = nivel === 4

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const lleno = nivel >= n
          return (
            <div
              key={n}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                lleno ? `${DOT_TV[n]} border-transparent` : 'bg-transparent border-zinc-700'
              }`}
            />
          )
        })}
      </div>
      {esH && (
        <span className={`text-sm font-black tracking-widest ${
          shikkaku ? 'text-purple-400' : 'text-red-400'
        }`}>
          {shikkaku ? 'SHIKKAKU' : 'HANSOKU'}
        </span>
      )}
      {esHC && !esH && (
        <span className="text-sm font-black tracking-widest text-orange-400">HC</span>
      )}
    </div>
  )
}

export default function MesaTVPage() {
  const { token, catId, combateId } = useParams()

  const [link, setLink] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [rojoNombre, setRojoNombre] = useState(null)
  const [azulNombre, setAzulNombre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const [timerSeg, setTimerSeg] = useState(180)
  const timerRef = useRef(null)

  const compsCacheRef = useRef({})

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  useEffect(() => {
    async function cargar() {
      const linkData = await fetchLinkMesaByToken(token)
      if (linkData) {
        setLink(linkData)
        const cats = await fetchCategorias(linkData.torneo_id)
        setCategoria(cats.find((c) => c.id === catId) ?? null)
      }
      setLoading(false)
    }
    cargar()
  }, [token, catId])

  async function resolverNombre(id) {
    if (!id) return null
    if (compsCacheRef.current[id]) return compsCacheRef.current[id]
    const { data } = await supabase
      .from('competidor')
      .select('id, nombre, apellido, dojo:dojo_id(nombre)')
      .eq('id', id)
      .single()
    if (data) {
      compsCacheRef.current[id] = data
      return data
    }
    return null
  }

  useEffect(() => {
    let activo = true

    async function poll() {
      let data = null

      if (combateId) {
        const res = await supabase.from('combate').select('*').eq('id', combateId).single()
        data = res.data ?? null
      } else {
        const res = await supabase
          .from('combate')
          .select('*')
          .eq('categoria_id', catId)
          .eq('estado', 'en_curso')
          .maybeSingle()
        data = res.data ?? null
      }

      if (!activo) return
      if (data) {
        setCombate(data)

        const seg = calcularSegRestantes(data)
        setTimerSeg(seg)

        if (timerRef.current) clearInterval(timerRef.current)
        if (data.timer_activo && data.timer_inicio_ts && seg > 0) {
          const startedAt = Date.now()
          const startSeg = seg
          timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startedAt) / 1000
            setTimerSeg(Math.max(0, startSeg - elapsed))
          }, 100)
        }

        const [rojoData, azulData] = await Promise.all([
          resolverNombre(data.competidor_rojo_id),
          resolverNombre(data.competidor_azul_id),
        ])
        if (!activo) return
        if (rojoData) setRojoNombre(rojoData)
        if (azulData) setAzulNombre(azulData)
      }
    }

    poll()
    const id = setInterval(poll, 500)
    return () => {
      activo = false
      clearInterval(id)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [catId, combateId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!combate) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-zinc-400 text-2xl font-bold">{categoria?.nombre ?? 'Categoría'}</p>
        <p className="text-zinc-600 text-sm">Esperando el inicio del combate…</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-600 text-xs">Actualizando</span>
        </div>
      </div>
    )
  }

  const puntosRojo  = combate.puntos_rojo  ?? 0
  const puntosAzul  = combate.puntos_azul  ?? 0
  const amonRojo    = combate.amon_rojo    ?? 0
  const amonAzul    = combate.amon_azul    ?? 0
  const shikkakuRojo = combate.shikkaku_rojo ?? false
  const shikkakuAzul = combate.shikkaku_azul ?? false
  const senshu      = combate.senshu

  const nombreRonda = (() => {
    if (combate.orden_en_ronda === 0) return '3er Puesto'
    if (combate.ronda === 1) return 'Ronda 1'
    return `Ronda ${combate.ronda}`
  })()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col select-none overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-900">
        <div>
          <p className="text-zinc-500 text-sm">{link?.torneo?.nombre}</p>
          <p className="text-zinc-300 font-semibold">{link?.tatami?.nombre} · {categoria?.nombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-zinc-500 text-sm">{nombreRonda}</p>
          <span
            className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
            title={online ? 'Sincronizando' : 'Sin conexión'}
          />
        </div>
      </div>

      {/* Marcador principal — AO (azul) izquierda · AKA (rojo) derecha */}
      <div className="flex-1 flex">
        {/* AO (azul) — izquierda */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-sky-950/60 to-black px-8 py-10 gap-4 border-r border-zinc-900">
          <div className="w-4 h-4 rounded-full bg-sky-500" />
          <div className="text-5xl font-black text-white text-center leading-tight">
            {azulNombre?.nombre ?? '—'}
            <br />
            <span className="text-3xl font-bold">{azulNombre?.apellido ?? ''}</span>
          </div>
          <p className="text-zinc-500 text-sm">{azulNombre?.dojo?.nombre ?? ''}</p>

          <div className={`text-[10rem] font-black tabular-nums leading-none mt-4 ${
            (shikkakuAzul || amonAzul >= 5) ? 'line-through text-zinc-700'
              : puntosAzul > puntosRojo ? 'text-sky-400' : 'text-zinc-200'
          }`}>
            {puntosAzul}
          </div>

          <div className="flex gap-4 text-3xl font-bold">
            {(combate.yuko_azul ?? 0) > 0 && <span className="text-sky-300">YUKO ×{combate.yuko_azul}</span>}
            {(combate.waza_ari_azul ?? 0) > 0 && <span className="text-sky-200">WA ×{combate.waza_ari_azul}</span>}
            {(combate.ippon_azul ?? 0) > 0 && <span className="text-white">IPPON ×{combate.ippon_azul}</span>}
          </div>

          {senshu === 'azul' && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border-2 border-yellow-400 px-5 py-2 rounded-xl">
              <span className="text-yellow-300 text-2xl">★</span>
              <span className="text-yellow-300 text-xl font-black tracking-widest">SENSHU</span>
            </div>
          )}

          <AmonBadge amon={amonAzul} shikkaku={shikkakuAzul} />
        </div>

        {/* AKA (rojo) — derecha */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-bl from-rose-950/60 to-black px-8 py-10 gap-4">
          <div className="w-4 h-4 rounded-full bg-rose-500" />
          <div className="text-5xl font-black text-white text-center leading-tight">
            {rojoNombre?.nombre ?? '—'}
            <br />
            <span className="text-3xl font-bold">{rojoNombre?.apellido ?? ''}</span>
          </div>
          <p className="text-zinc-500 text-sm">{rojoNombre?.dojo?.nombre ?? ''}</p>

          <div className={`text-[10rem] font-black tabular-nums leading-none mt-4 ${
            (shikkakuRojo || amonRojo >= 5) ? 'line-through text-zinc-700'
              : puntosRojo > puntosAzul ? 'text-rose-400' : 'text-zinc-200'
          }`}>
            {puntosRojo}
          </div>

          <div className="flex gap-4 text-3xl font-bold">
            {(combate.yuko_rojo ?? 0) > 0 && <span className="text-rose-300">YUKO ×{combate.yuko_rojo}</span>}
            {(combate.waza_ari_rojo ?? 0) > 0 && <span className="text-rose-200">WA ×{combate.waza_ari_rojo}</span>}
            {(combate.ippon_rojo ?? 0) > 0 && <span className="text-white">IPPON ×{combate.ippon_rojo}</span>}
          </div>

          {senshu === 'rojo' && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border-2 border-yellow-400 px-5 py-2 rounded-xl">
              <span className="text-yellow-300 text-2xl">★</span>
              <span className="text-yellow-300 text-xl font-black tracking-widest">SENSHU</span>
            </div>
          )}

          <AmonBadge amon={amonRojo} shikkaku={shikkakuRojo} />
        </div>
      </div>

      {/* Cronómetro */}
      <div className={`border-t border-zinc-900 flex flex-col items-center justify-center py-6 gap-2 ${
        timerSeg <= 15 && timerSeg > 0 ? 'bg-amber-950/20' : ''
      }`}>
        <div
          style={{ fontSize: 'clamp(4rem, 10vw, 10rem)', lineHeight: 1 }}
          className={`font-black tabular-nums tracking-tight ${
            timerSeg <= 15 && timerSeg > 0
              ? 'text-amber-400'
              : timerSeg === 0
              ? 'text-red-500'
              : 'text-zinc-100'
          }`}
        >
          {fmtTime(timerSeg)}
        </div>
        {timerSeg <= 15 && timerSeg > 0 && (
          <p className="text-amber-400 font-bold tracking-widest text-sm uppercase animate-pulse">
            ATO SHIBARAKU
          </p>
        )}
      </div>
    </div>
  )
}
