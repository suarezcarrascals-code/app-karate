import { supabase } from './supabase'

export async function insertInscripcion(competidorId, categoriaId, torneoId) {
  const { data, error } = await supabase
    .from('inscripcion')
    .insert({ competidor_id: competidorId, categoria_id: categoriaId, torneo_id: torneoId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInscripcion(id) {
  const { error } = await supabase.from('inscripcion').delete().eq('id', id)
  if (error) throw error
}

export async function deleteInscripcionByCC(competidorId, categoriaId) {
  const { error } = await supabase
    .from('inscripcion')
    .delete()
    .eq('competidor_id', competidorId)
    .eq('categoria_id', categoriaId)
  if (error) throw error
}
