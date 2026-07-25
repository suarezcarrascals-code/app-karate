import { supabase } from './supabase'

export async function fetchTatamis(torneoId) {
  const { data, error } = await supabase
    .from('tatami')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('orden', { ascending: true })
  if (error) throw error
  return data
}

export async function insertTatami({ torneo_id, nombre, orden, arbitro }) {
  const { data, error } = await supabase
    .from('tatami')
    .insert({ torneo_id, nombre, orden, arbitro_nombre: arbitro || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function verificarCategoriasEnTatami(tatamiId) {
  const { count, error } = await supabase
    .from('categoria')
    .select('*', { count: 'exact', head: true })
    .eq('tatami_id', tatamiId)
  if (error) throw error
  return count ?? 0
}

export async function updateTatami(tatamiId, { nombre, arbitro }) {
  const { data, error } = await supabase
    .from('tatami')
    .update({ nombre, arbitro_nombre: arbitro ?? null })
    .eq('id', tatamiId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTatami(tatamiId) {
  const { error } = await supabase
    .from('tatami')
    .delete()
    .eq('id', tatamiId)
  if (error) throw error
}

export function calcularOrden(tatamis) {
  if (!tatamis || tatamis.length === 0) return 1
  return Math.max(...tatamis.map((t) => t.orden)) + 1
}
