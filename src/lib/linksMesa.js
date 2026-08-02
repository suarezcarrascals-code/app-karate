import { supabase } from './supabase'

export async function fetchLinkMesaByToken(token) {
  const { data, error } = await supabase
    .from('link_mesa')
    .select('*, tatami:tatami_id(id, nombre), torneo:torneo_id(id, nombre, estado)')
    .eq('token', token)
    .eq('activo', true)
    .single()
  if (error) return null
  return data
}

export async function fetchLinkMesaByTatami(tatamiId, torneoId) {
  const { data } = await supabase
    .from('link_mesa')
    .select('*')
    .eq('tatami_id', tatamiId)
    .eq('torneo_id', torneoId)
    .single()
  return data ?? null
}

export async function generarLinkMesa(torneoId, tatamiId) {
  const { data, error } = await supabase
    .from('link_mesa')
    .upsert(
      { torneo_id: torneoId, tatami_id: tatamiId, activo: true },
      { onConflict: 'torneo_id,tatami_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function desactivarLinkMesa(linkId) {
  const { error } = await supabase
    .from('link_mesa')
    .update({ activo: false })
    .eq('id', linkId)
  if (error) throw error
}
