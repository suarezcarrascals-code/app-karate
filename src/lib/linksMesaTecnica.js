import { supabase } from './supabase'

export async function fetchLinksMesaTecnica(torneoId) {
  const { data, error } = await supabase
    .from('link_mesa_tecnica')
    .select('*, tatami:tatami_id(id, nombre)')
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function generarLinkMesaTecnica(torneoId, tatamiId) {
  await supabase
    .from('link_mesa_tecnica')
    .delete()
    .eq('torneo_id', torneoId)
    .eq('tatami_id', tatamiId)

  const { data, error } = await supabase
    .from('link_mesa_tecnica')
    .insert({ torneo_id: torneoId, tatami_id: tatamiId })
    .select('*, tatami:tatami_id(id, nombre)')
    .single()
  if (error) throw error
  return data
}

export async function fetchLinkMesaTecnicaByToken(token) {
  const { data, error } = await supabase
    .from('link_mesa_tecnica')
    .select(`
      *,
      tatami:tatami_id(id, nombre),
      torneo:torneo_id(id, nombre, estado, lugar, fecha_inicio)
    `)
    .eq('token', token)
    .eq('estado', 'activo')
    .single()
  if (error) return null
  return data
}

export async function desactivarLinkMesaTecnica(linkId) {
  const { error } = await supabase
    .from('link_mesa_tecnica')
    .update({ estado: 'inactivo' })
    .eq('id', linkId)
  if (error) throw error
}
