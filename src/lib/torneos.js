import { supabase } from './supabase'

export async function fetchTorneos() {
  const { data, error } = await supabase
    .from('torneo')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertTorneo({ nombre, fecha_inicio, fecha_fin, lugar, logo_url }) {
  const { data, error } = await supabase
    .from('torneo')
    .insert({ nombre, fecha_inicio, fecha_fin, lugar, logo_url, estado: 'borrador' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadLogo(file, torneoId) {
  const path = `torneos/${torneoId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
  return publicUrl
}

export async function fetchTorneoById(id) {
  const { data, error } = await supabase
    .from('torneo')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deleteTorneo(id) {
  const { error } = await supabase.from('torneo').delete().eq('id', id)
  if (error) throw error
}

export async function cambiarEstadoTorneo(id, nuevoEstado) {
  const { data, error } = await supabase
    .from('torneo')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
