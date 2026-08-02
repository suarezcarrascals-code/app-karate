import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fetchLinkMesaByToken } from '../../lib/linksMesa'
import { fetchCategorias } from '../../lib/categorias'
import { fetchCompetidores } from '../../lib/competidores'

function fmtTime(seg) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MesaTVPage() {
  const { token, catId } = useParams()

  const [link, setLink] = useState(null)
  const [categoria, setCategoria] = useState(null)
  const [combate, setCombate] = useState(null)
  const [rojo, setRojo] = useState(null)
  const [azul, setAzul] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timerSeg, setTimerSeg] = useState(180)
  const [timerActivo, setTimerActivo] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

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
      if (!linkData) { setLoading(false); return }
      setLink(linkData)

      const [cats, comps] = await Promise.all([
        fetchCategorias(linkData.torneo_id),
        fetchCompetidores(linkData.torneo_id),
      ])
      const cat = cats.find((c) => c.id === catId)
      setCategoria(cat)

      // Buscar combate en curso para esta categoría
      const { data: combates } = await supabase
        .from('combate')
        .select('*')
        .eq('categoria_id', catId)
        .eq('estado', 'en_curso')
        .single()

      if (combates) {
        setCombate(combates)
        setRojo(comps.find((c) => c.id === combates.competidor_rojo_id) ?? null)
        setAzul(comps.find((c) => c.id === combates.competidor_azul_id) ?? null)
      }
      setLoading(false)
    }
    cargar()
  }, [token, catId])

  // Suscripción Realtime al combate en curso
  useEffect(() => {
    if (!catId) return
    const channel = supabase
      .channel(`tv-combate-${catId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'combate', filter: `categoria_id=eq.${catId}` },
        async (payload) => {
          if (payload.new.estado === 'en_curso' || payload.new.estado === 'pendiente') {
            setCombate(payload.new)
            // Cargar nombres si cambiaron los slots
            const { data: comps } = await supabase
              .from('competidor')
              .select('id, nombre, apellido, dojo:dojo_id(nombre)')
              .in('id', [payload.new.competidor_rojo_id, payload.new.competidor_azul_id].filter(Boolean))
            if (comps) {
              setRojo(comps.find((c) => c.id === payload.new.competidor_rojo_id) ?? null)
              setAzul(comps.find((c) => c.id === payload.new.competidor_azul_id) ?? null)
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [catId])

  // Timer local (sincronizado con panel de control, solo para fluidez visual)
  useEffect(() => {
    if (!timerActivo) return
    const id = setInterval(() => {
      setTimerSeg((prev) => {
        if (prev <= 1) { setTimerActivo(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerActivo])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nombreRonda = (() => {
    if (!combate) return ''
    if (combate.orden_en_ronda === 0) return '3er Puesto'
    if (combate.ronda === 1) return 'Cuartos de Final'
    return `Ronda ${combate.ronda}`
  })()

  const puntosRojo = combate?.puntos_rojo ?? 0
  const puntosAzul = combate?.puntos_azul ?? 0
  const chiuRojo = combate?.chui_rojo ?? 0
  const chiuAzul = combate?.chui_azul ?? 0
  const hcRojo = combate?.hansoku_chui_rojo
  const hcAzul = combate?.hansoku_chui_azul
  const senshu = combate?.senshu

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
          <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
        </div>
      </div>

      {/* Marcador principal */}
      <div className="flex-1 flex">
        {/* AKA */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-rose-950/60 to-black px-8 py-10 gap-4 border-r border-zinc-900">
          <div className="w-4 h-4 rounded-full bg-rose-500" />
          <div className="text-5xl font-black text-white text-center leading-tight">
            {rojo?.nombre ?? '—'}<br />
            <span className="text-3xl font-bold">{rojo?.apellido ?? ''}</span>
          </div>
          <p className="text-zinc-500 text-sm">{rojo?.dojo?.nombre ?? ''}</p>

          <div className={`text-[10rem] font-black tabular-nums leading-none mt-4 ${puntosRojo > puntosAzul ? 'text-rose-400' : 'text-zinc-200'}`}>
            {puntosRojo}
          </div>

          {senshu === 'rojo' && (
            <div className="bg-rose-800/60 border border-rose-700 px-4 py-1.5 rounded-full text-rose-200 text-sm font-bold">
              SENSHU
            </div>
          )}

          {/* Penalizaciones */}
          <div className="flex gap-2 mt-2">
            {Array.from({ length: chiuRojo }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-amber-500" title="CHUI" />
            ))}
            {hcRojo && (
              <div className="px-2 py-0.5 bg-orange-800 text-orange-200 rounded text-xs font-bold">HC</div>
            )}
          </div>
        </div>

        {/* AO */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-bl from-sky-950/60 to-black px-8 py-10 gap-4">
          <div className="w-4 h-4 rounded-full bg-sky-500" />
          <div className="text-5xl font-black text-white text-center leading-tight">
            {azul?.nombre ?? '—'}<br />
            <span className="text-3xl font-bold">{azul?.apellido ?? ''}</span>
          </div>
          <p className="text-zinc-500 text-sm">{azul?.dojo?.nombre ?? ''}</p>

          <div className={`text-[10rem] font-black tabular-nums leading-none mt-4 ${puntosAzul > puntosRojo ? 'text-sky-400' : 'text-zinc-200'}`}>
            {puntosAzul}
          </div>

          {senshu === 'azul' && (
            <div className="bg-sky-800/60 border border-sky-700 px-4 py-1.5 rounded-full text-sky-200 text-sm font-bold">
              SENSHU
            </div>
          )}

          <div className="flex gap-2 mt-2">
            {Array.from({ length: chiuAzul }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-amber-500" title="CHUI" />
            ))}
            {hcAzul && (
              <div className="px-2 py-0.5 bg-orange-800 text-orange-200 rounded text-xs font-bold">HC</div>
            )}
          </div>
        </div>
      </div>

      {/* Cronómetro */}
      <div className="flex justify-center items-center py-6 border-t border-zinc-900 gap-8">
        <div className={`text-7xl font-black tabular-nums tracking-tight ${
          timerSeg <= 15 && timerSeg > 0 ? 'text-amber-400 animate-pulse' : timerSeg === 0 ? 'text-red-500' : 'text-zinc-100'
        }`}>
          {fmtTime(timerSeg)}
        </div>
        {timerSeg <= 15 && timerSeg > 0 && (
          <p className="text-amber-400 font-bold tracking-widest text-sm uppercase">ATO SHIBARAKU</p>
        )}
      </div>
    </div>
  )
}
