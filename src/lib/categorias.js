import { supabase } from './supabase'

export async function fetchCategorias(torneoId) {
  const { data, error } = await supabase
    .from('categoria')
    .select('*, tatami:tatami_id(id, nombre)')
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertCategoria({ torneo_id, nombre, modalidad, genero, edad_min, edad_max, peso_min, peso_max, cinturon_min, cinturon_max, nivel }) {
  const { data, error } = await supabase
    .from('categoria')
    .insert({ torneo_id, nombre, modalidad, genero, edad_min, edad_max, peso_min, peso_max, cinturon_min, cinturon_max, nivel: nivel || null, estado: 'abierta' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function asignarTatami(categoriaId, tatamiId, orden, tatamiAnteriorId = null, motivo = null) {
  const { data, error } = await supabase
    .from('categoria')
    .update({ tatami_id: tatamiId, orden_en_tatami: orden })
    .eq('id', categoriaId)
    .select()
    .single()
  if (error) throw error

  await supabase.from('movimiento_categoria').insert({
    categoria_id: categoriaId,
    tatami_id_anterior: tatamiAnteriorId,
    tatami_id_nuevo: tatamiId,
    motivo,
  })

  return data
}

export async function calcularOrdenesOcupados(tatamiId) {
  const { data, error } = await supabase
    .from('categoria')
    .select('orden_en_tatami')
    .eq('tatami_id', tatamiId)
    .not('orden_en_tatami', 'is', null)
  if (error) throw error
  return (data || []).map((c) => c.orden_en_tatami)
}

export async function actualizarOrdenesEnTatami(items) {
  // items: [{ id, orden_en_tatami }] — actualiza todos en paralelo
  await Promise.all(
    items.map(({ id, orden_en_tatami }) =>
      supabase.from('categoria').update({ orden_en_tatami }).eq('id', id)
    )
  )
}

export async function fetchHistorialMovimientos(categoriaId) {
  const { data, error } = await supabase
    .from('movimiento_categoria')
    .select('*, tatami_anterior:tatami_id_anterior(nombre), tatami_nuevo:tatami_id_nuevo(nombre)')
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertCategoriasBulk(torneoId, categorias) {
  const rows = categorias.map((c) => ({
    torneo_id: torneoId,
    nombre: c.nombre,
    modalidad: c.modalidad,
    genero: c.genero,
    edad_min: c.edad_min ?? null,
    edad_max: c.edad_max ?? null,
    peso_min: c.peso_min ?? null,
    peso_max: c.peso_max ?? null,
    cinturon_min: c.cinturon_min ?? null,
    cinturon_max: c.cinturon_max ?? null,
    nivel: c.nivel ?? null,
    estado: 'abierta',
  }))
  const { data, error } = await supabase
    .from('categoria')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

export async function deleteCategoria(categoriaId) {
  // Eliminar competidores primero (FK sin CASCADE)
  const { error: errComp } = await supabase
    .from('competidor')
    .delete()
    .eq('categoria_id', categoriaId)
  if (errComp) throw errComp

  const { error } = await supabase
    .from('categoria')
    .delete()
    .eq('id', categoriaId)
  if (error) throw error
}

export async function asignarTatamiLote(tatamiId, items) {
  // items: [{id, tatami_id, orden}] — tatami_id es el actual (para log)
  await Promise.all(
    items.map(({ id, tatami_id: tatamiAnteriorId, orden }) =>
      Promise.all([
        supabase.from('categoria').update({ tatami_id: tatamiId, orden_en_tatami: orden }).eq('id', id),
        supabase.from('movimiento_categoria').insert({
          categoria_id: id,
          tatami_id_anterior: tatamiAnteriorId || null,
          tatami_id_nuevo: tatamiId,
          motivo: 'Asignación en lote',
        }),
      ])
    )
  )
  const { data, error } = await supabase
    .from('categoria')
    .select('*, tatami:tatami_id(id, nombre)')
    .in('id', items.map((i) => i.id))
  if (error) throw error
  return data
}

export async function actualizarEstadoCategoria(categoriaId, estado) {
  const { data, error } = await supabase
    .from('categoria')
    .update({ estado })
    .eq('id', categoriaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cerrarInscripciones(categoriaId) {
  const { data, error } = await supabase
    .from('categoria')
    .update({ estado: 'cerrada' })
    .eq('id', categoriaId)
    .select()
    .single()
  if (error) throw error
  return data
}

export function estaFueraDeRango(competidor, categoria) {
  const motivos = []
  if (categoria.edad_min !== null && competidor.edad < categoria.edad_min)
    motivos.push(`Edad ${competidor.edad} menor al mínimo (${categoria.edad_min})`)
  if (categoria.edad_max !== null && competidor.edad > categoria.edad_max)
    motivos.push(`Edad ${competidor.edad} mayor al máximo (${categoria.edad_max})`)
  if (categoria.peso_max !== null && competidor.peso > categoria.peso_max)
    motivos.push(`Peso ${competidor.peso}kg supera el máximo (${categoria.peso_max}kg)`)
  if (categoria.peso_min !== null && competidor.peso < categoria.peso_min)
    motivos.push(`Peso ${competidor.peso}kg menor al mínimo (${categoria.peso_min}kg)`)
  return { fueraDeRango: motivos.length > 0, motivos }
}
