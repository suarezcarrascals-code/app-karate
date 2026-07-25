import { supabase } from './supabase'

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export function edadAFechaNacimiento(edad) {
  const year = new Date().getFullYear() - parseInt(edad)
  return `${year}-01-01`
}

export function encontrarCategoriasCompatibles(competidor, categorias) {
  const edad = competidor.edad != null ? parseInt(competidor.edad) : calcularEdad(competidor.fecha_nacimiento)
  return categorias.filter((cat) => {
    if (cat.modalidad !== competidor.modalidad) return false
    if (cat.genero !== 'mixto' && cat.genero !== competidor.genero) return false
    if (cat.edad_min != null && (edad === null || edad < cat.edad_min)) return false
    if (cat.edad_max != null && (edad === null || edad > cat.edad_max)) return false
    if (cat.peso_min != null && (competidor.peso == null || competidor.peso < cat.peso_min)) return false
    if (cat.peso_max != null && (competidor.peso == null || competidor.peso > cat.peso_max)) return false
    return true
  })
}

const COMPETIDOR_SELECT = '*, inscripciones:inscripcion(id, categoria_id, categoria(id, nombre, modalidad)), dojo:dojo_id(id, nombre)'

export async function fetchCompetidorById(id) {
  const { data, error } = await supabase
    .from('competidor')
    .select(COMPETIDOR_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchCompetidores(torneoId) {
  const { data, error } = await supabase
    .from('competidor')
    .select(COMPETIDOR_SELECT)
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertCompetidor(datos) {
  const { categoria_id, ...competidorDatos } = datos
  const { data: comp, error: compError } = await supabase
    .from('competidor')
    .insert({ ...competidorDatos, estado: 'inscrito' })
    .select('id')
    .single()
  if (compError) throw compError

  if (categoria_id && datos.torneo_id) {
    const { error: inscError } = await supabase
      .from('inscripcion')
      .insert({ competidor_id: comp.id, categoria_id, torneo_id: datos.torneo_id })
    if (inscError) throw inscError
  }

  return fetchCompetidorById(comp.id)
}

export async function deleteCompetidor(id) {
  const { error } = await supabase
    .from('competidor')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchEquipos(categoriaId) {
  const { data, error } = await supabase
    .from('equipo')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertEquipo(datos) {
  const { data, error } = await supabase
    .from('equipo')
    .insert(datos)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteEquipo(id) {
  const { error } = await supabase
    .from('equipo')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function asignarLado(competidorId, lado) {
  const { data, error } = await supabase
    .from('competidor')
    .update({ lado })
    .eq('id', competidorId)
    .select('id, lado')
    .single()
  if (error) throw error
  return data
}

export async function limpiarLadosCategoria(categoriaId) {
  const { data: inscs, error: inscError } = await supabase
    .from('inscripcion')
    .select('competidor_id')
    .eq('categoria_id', categoriaId)
  if (inscError) throw inscError

  const ids = (inscs || []).map((i) => i.competidor_id)
  if (!ids.length) return

  const { error } = await supabase
    .from('competidor')
    .update({ lado: null })
    .in('id', ids)
  if (error) throw error
}

export async function insertCompetidorPorLink(datos, linkId) {
  const fechaNac = datos.fecha_nacimiento || (datos.edad != null ? edadAFechaNacimiento(datos.edad) : null)
  const { data: comp, error: compError } = await supabase
    .from('competidor')
    .insert({
      torneo_id: datos.torneo_id,
      dojo_id: datos.dojo_id,
      nombre: datos.nombre,
      apellido: datos.apellido,
      fecha_nacimiento: fechaNac,
      peso: datos.peso ?? null,
      genero: datos.genero,
      modalidad: datos.modalidad,
      estado: 'inscrito',
      link_inscripcion_id: linkId,
    })
    .select('id')
    .single()
  if (compError) throw compError

  // Soporta tanto categoria_id (singular) como categoria_ids (array)
  const ids = datos.categoria_ids ?? (datos.categoria_id ? [datos.categoria_id] : [])
  for (const catId of ids) {
    const { error: inscError } = await supabase
      .from('inscripcion')
      .insert({ competidor_id: comp.id, categoria_id: catId, torneo_id: datos.torneo_id })
    if (inscError) throw inscError
  }

  const { data, error } = await supabase
    .from('competidor')
    .select('*, inscripciones:inscripcion(id, categoria_id, categoria(id, nombre, modalidad))')
    .eq('id', comp.id)
    .single()
  if (error) throw error
  return data
}

export async function fetchCompetidoresPorLink(linkId) {
  const { data, error } = await supabase
    .from('competidor')
    .select('*, inscripciones:inscripcion(id, categoria_id, categoria(id, nombre, modalidad))')
    .eq('link_inscripcion_id', linkId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
