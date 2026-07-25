import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

function formatTiempo(seg) {
  const m = Math.floor(seg / 60).toString().padStart(2, '0')
  const s = (seg % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TvDisplay() {
  const { combateId } = useParams()
  const [combate, setCombate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('combate')
        .select('*, competidor_rojo:competidor_rojo_id(nombre, apellido, club), competidor_azul:competidor_azul_id(nombre, apellido, club)')
        .eq('id', combateId)
        .single()
      setCombate(data)
      setLoading(false)
    }
    cargar()

    // Escuchar cambios en tiempo real
    const canal = supabase
      .channel(`tv-combate-${combateId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'combate',
        filter: `id=eq.${combateId}`,
      }, (payload) => {
        setCombate((prev) => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [combateId])

  if (loading || !combate) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const aka = combate.competidor_rojo
  const ao = combate.competidor_azul
  const puntosAka = combate.puntos_rojo ?? 0
  const puntosAo = combate.puntos_azul ?? 0

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col select-none">
      {/* AKA */}
      <div className="flex-1 flex items-center px-12 border-b border-zinc-800">
        <div className="flex-1">
          <p className="text-6xl font-black text-white tracking-tight uppercase leading-none">
            {aka ? `${aka.nombre} ${aka.apellido}` : 'AKA'}
          </p>
          <p className="text-2xl text-zinc-400 font-medium mt-2 uppercase tracking-widest">
            {aka?.club || '—'}
          </p>
        </div>
        <div className="bg-rose-600 rounded-2xl w-48 h-40 flex items-center justify-center shrink-0">
          <span className="text-9xl font-black text-white tabular-nums leading-none">{puntosAka}</span>
        </div>
      </div>

      {/* AO */}
      <div className="flex-1 flex items-center px-12">
        <div className="flex-1">
          <p className="text-6xl font-black text-white tracking-tight uppercase leading-none">
            {ao ? `${ao.nombre} ${ao.apellido}` : 'AO'}
          </p>
          <p className="text-2xl text-zinc-400 font-medium mt-2 uppercase tracking-widest">
            {ao?.club || '—'}
          </p>
        </div>
        <div className="bg-sky-600 rounded-2xl w-48 h-40 flex items-center justify-center shrink-0">
          <span className="text-9xl font-black text-white tabular-nums leading-none">{puntosAo}</span>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="bg-zinc-900 border-t border-zinc-800 flex items-center px-12 py-4 gap-8">
        <div className="bg-zinc-800 rounded-xl px-5 py-2">
          <span className="text-white font-black text-2xl tabular-nums">
            {puntosAka} – {puntosAo}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-zinc-300 font-semibold text-lg uppercase tracking-wide">
            {combate.categoria_id ? 'KUMITE' : '—'}
          </p>
          <p className="text-yellow-400 text-sm font-bold uppercase tracking-widest">
            {combate.estado === 'en_curso' ? 'EN CURSO' : combate.estado === 'finalizado' ? 'FINALIZADO' : combate.estado}
          </p>
        </div>
        <div className="text-white font-black text-6xl tabular-nums tracking-widest">
          {/* El cronómetro lo controla la mesa técnica en su ventana — aquí mostramos tiempo restante si está guardado */}
          00:00
        </div>
      </div>
    </div>
  )
}
