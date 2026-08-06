import { supabase } from './supabase'

export async function fetchLinks(torneoId) {
  const { data, error } = await supabase
    .from('link_inscripcion')
    .select('*, dojo:dojo_id(id, nombre)')
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error

  if (!data?.length) return data

  // Contar atletas inscritos por link
  const { data: competidores } = await supabase
    .from('competidor')
    .select('link_inscripcion_id')
    .in('link_inscripcion_id', data.map((l) => l.id))

  const countMap = (competidores ?? []).reduce((acc, c) => {
    acc[c.link_inscripcion_id] = (acc[c.link_inscripcion_id] ?? 0) + 1
    return acc
  }, {})

  return data.map((l) => ({ ...l, _count: countMap[l.id] ?? 0 }))
}

export async function fetchLinkByToken(token) {
  const { data, error } = await supabase
    .from('link_inscripcion')
    .select(`
      *,
      dojo:dojo_id(id, nombre),
      torneo:torneo_id(id, nombre, fecha_inicio, lugar)
    `)
    .eq('token', token)
    .eq('estado', 'activo')
    .single()
  if (error) return null
  return data
}

export async function generarLink(torneoId, dojoId) {
  const { data, error } = await supabase
    .from('link_inscripcion')
    .upsert(
      { torneo_id: torneoId, dojo_id: dojoId, limite_atletas: 9999, estado: 'activo' },
      { onConflict: 'torneo_id,dojo_id' }
    )
    .select('*, dojo:dojo_id(id, nombre)')
    .single()
  if (error) throw error
  return data
}

export async function desactivarLink(linkId) {
  const { error } = await supabase
    .from('link_inscripcion')
    .update({ estado: 'inactivo' })
    .eq('id', linkId)
  if (error) throw error
}

export async function desactivarTodosLosLinks(torneoId) {
  const { error } = await supabase
    .from('link_inscripcion')
    .update({ estado: 'inactivo' })
    .eq('torneo_id', torneoId)
    .eq('estado', 'activo')
  if (error) throw error
}

export async function contarAtletasPorLink(linkId) {
  const { count, error } = await supabase
    .from('competidor')
    .select('id', { count: 'exact', head: true })
    .eq('link_inscripcion_id', linkId)
  if (error) throw error
  return count ?? 0
}
