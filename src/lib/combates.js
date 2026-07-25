import { supabase } from './supabase'
import { generarBracket } from './brackets'

export async function persistirBracket(categoriaId, tatamiId, competidores) {
  if (competidores.length < 2) throw new Error('Se necesitan al menos 2 competidores')

  const ids = competidores.map((c) => c.id)
  const bracket = generarBracket(ids)

  const filas = []
  for (const ronda of bracket.rondas) {
    for (let i = 0; i < ronda.combates.length; i++) {
      const c = ronda.combates[i]
      const esBye = c.rojo !== null && c.azul === null
      filas.push({
        categoria_id: categoriaId,
        tatami_id: tatamiId || null,
        ronda: ronda.numero,
        orden_en_ronda: i + 1,
        competidor_rojo_id: c.rojo ?? null,
        competidor_azul_id: c.azul ?? null,
        estado: esBye ? 'bye' : 'pendiente',
        ganador_id: esBye ? c.rojo : null,
      })
    }
  }

  const { data, error } = await supabase
    .from('combate')
    .insert(filas)
    .select('*')
  if (error) throw error
  return data
}

export async function fetchCombates(categoriaId) {
  const { data, error } = await supabase
    .from('combate')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('ronda', { ascending: true })
    .order('orden_en_ronda', { ascending: true })
  if (error) throw error
  return data
}

export async function actualizarResultado(combateId, { puntos_rojo, puntos_azul, ganador_id, estado }) {
  const { data, error } = await supabase
    .from('combate')
    .update({ puntos_rojo, puntos_azul, ganador_id, estado })
    .eq('id', combateId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function eliminarCombatesCategoria(categoriaId) {
  const { error } = await supabase
    .from('combate')
    .delete()
    .eq('categoria_id', categoriaId)
  if (error) throw error
}
