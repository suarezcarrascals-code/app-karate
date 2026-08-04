import { supabase } from './supabase'
import { generarBracket } from './brackets'

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

export async function persistirBracket(categoriaId, tatamiId, competidores) {
  if (competidores.length < 2) throw new Error('Se necesitan al menos 2 competidores')

  const ids = competidores.map((c) => c.id)
  const bracket = generarBracket(ids)
  const totalRondas = bracket.rondas.length

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

  // 3er puesto: cuando hay semis (2+ rondas, que implica 3+ competidores)
  if (totalRondas >= 2) {
    filas.push({
      categoria_id: categoriaId,
      tatami_id: tatamiId || null,
      ronda: totalRondas,
      orden_en_ronda: 0, // orden 0 = marcador de 3er puesto
      competidor_rojo_id: null,
      competidor_azul_id: null,
      estado: 'pendiente',
      ganador_id: null,
    })
  }

  const { data, error } = await supabase.from('combate').insert(filas).select('*')
  if (error) throw error

  // Auto-avanzar ganadores de byes al slot siguiente
  const byes = data.filter((c) => c.estado === 'bye')
  for (const bye of byes) {
    const siguienteOrden = Math.ceil(bye.orden_en_ronda / 2)
    const lado = bye.orden_en_ronda % 2 === 1 ? 'competidor_rojo_id' : 'competidor_azul_id'
    const nextCombate = data.find(
      (c) => c.ronda === bye.ronda + 1 && c.orden_en_ronda === siguienteOrden
    )
    if (nextCombate) {
      await supabase.from('combate').update({ [lado]: bye.ganador_id }).eq('id', nextCombate.id)
    }
  }

  return fetchCombates(categoriaId)
}

// Marca el ganador de un combate y propaga al slot siguiente.
// Si es semifinal, también envía al perdedor al 3er puesto.
export async function avanzarGanador(combateId, ganadorId, categoriaId) {
  // 1. Obtener el combate actual
  const { data: combate, error: e1 } = await supabase
    .from('combate')
    .select('*')
    .eq('id', combateId)
    .single()
  if (e1) throw e1

  // 2. Marcar como finalizado — .select() para detectar fallas silenciosas de RLS
  const { data: updated, error: e2 } = await supabase
    .from('combate')
    .update({ ganador_id: ganadorId, estado: 'finalizado' })
    .eq('id', combateId)
    .select('id')
  if (e2) throw e2
  if (!updated || updated.length === 0) {
    throw new Error('No se pudo guardar el resultado. Verificá los permisos de la tabla combate en Supabase (UPDATE para authenticated).')
  }

  // 3. Obtener todos los combates para determinar ronda final
  const { data: todos, error: e3 } = await supabase
    .from('combate')
    .select('id, ronda, orden_en_ronda, competidor_rojo_id, competidor_azul_id')
    .eq('categoria_id', categoriaId)
  if (e3) throw e3

  // finalRonda = ronda más alta del bracket principal (excluyendo 3er puesto con orden = 0)
  const mainCombates = todos.filter((c) => c.orden_en_ronda > 0)
  const finalRonda = Math.max(...mainCombates.map((c) => c.ronda))

  // 4. Avanzar ganador al slot de la ronda siguiente (si no es la final ni el 3er puesto)
  if (combate.orden_en_ronda > 0 && combate.ronda < finalRonda) {
    const siguienteOrden = Math.ceil(combate.orden_en_ronda / 2)
    const ladoGanador = combate.orden_en_ronda % 2 === 1 ? 'competidor_rojo_id' : 'competidor_azul_id'
    const nextCombate = todos.find(
      (c) => c.ronda === combate.ronda + 1 && c.orden_en_ronda === siguienteOrden
    )
    if (nextCombate) {
      const { error: e4 } = await supabase
        .from('combate')
        .update({ [ladoGanador]: ganadorId })
        .eq('id', nextCombate.id)
      if (e4) throw e4
    }
  }

  // 5. Si es semifinal, enviar el PERDEDOR al combate de 3er puesto
  if (combate.orden_en_ronda > 0 && combate.ronda === finalRonda - 1) {
    const perdedorId =
      ganadorId === combate.competidor_rojo_id
        ? combate.competidor_azul_id
        : combate.competidor_rojo_id

    if (perdedorId) {
      const tercerPuesto = todos.find((c) => c.orden_en_ronda === 0)
      if (tercerPuesto) {
        const lado = !tercerPuesto.competidor_rojo_id ? 'competidor_rojo_id' : 'competidor_azul_id'
        const { error: e5 } = await supabase
          .from('combate')
          .update({ [lado]: perdedorId })
          .eq('id', tercerPuesto.id)
        if (e5) throw e5
      }
    }
  }
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

// Retorna el próximo combate pendiente con ambos slots llenos (listo para jugar)
export async function fetchProximoCombate(categoriaId) {
  const { data, error } = await supabase
    .from('combate')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('estado', 'pendiente')
    .not('competidor_rojo_id', 'is', null)
    .not('competidor_azul_id', 'is', null)
  if (error || !data || data.length === 0) return null
  return data.sort((a, b) => {
    if (a.ronda !== b.ronda) return a.ronda - b.ronda
    const oa = a.orden_en_ronda === 0 ? 9999 : a.orden_en_ronda
    const ob = b.orden_en_ronda === 0 ? 9999 : b.orden_en_ronda
    return oa - ob
  })[0]
}

// Sincroniza el estado del marcador a Supabase (para el display TV)
export async function sincronizarMarcador(combateId, datos) {
  const { error } = await supabase
    .from('combate')
    .update({ ...datos, estado: 'en_curso' })
    .eq('id', combateId)
  if (error) throw error
}

export async function eliminarCombatesCategoria(categoriaId) {
  const { error } = await supabase.from('combate').delete().eq('categoria_id', categoriaId)
  if (error) throw error
}

export async function fetchCombatesByCategoriasIds(catIds) {
  if (!catIds || catIds.length === 0) return []
  const { data, error } = await supabase
    .from('combate')
    .select('*')
    .in('categoria_id', catIds)
    .eq('estado', 'en_curso')
  if (error) throw error
  return data ?? []
}
