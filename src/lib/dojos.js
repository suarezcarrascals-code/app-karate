import { supabase } from './supabase'

export async function fetchDojos(torneoId) {
  const { data, error } = await supabase
    .from('dojo')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('nombre', { ascending: true })
  if (error) throw error
  return data
}

export async function insertDojo({ torneo_id, nombre, ciudad, pais }) {
  const { data, error } = await supabase
    .from('dojo')
    .insert({ torneo_id, nombre, ciudad: ciudad || null, pais: pais || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDojo(id) {
  const { error } = await supabase
    .from('dojo')
    .delete()
    .eq('id', id)
  if (error) throw error
}
