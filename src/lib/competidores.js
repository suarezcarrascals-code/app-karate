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

export async function fetchCompetidores(torneoId) {
  const { data, error } = await supabase
    .from('competidor')
    .select('*, categoria:categoria_id(id, nombre, modalidad), dojo:dojo_id(id, nombre)')
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function insertCompetidor(datos) {
  const { data, error } = await supabase
    .from('competidor')
    .insert({ ...datos, estado: 'inscrito' })
    .select('*, categoria:categoria_id(id, nombre, modalidad), dojo:dojo_id(id, nombre)')
    .single()
  if (error) throw error
  return data
}

export async function asignarCategoria(competidorId, categoriaId) {
  const { data, error } = await supabase
    .from('competidor')
    .update({ categoria_id: categoriaId, estado: 'inscrito' })
    .eq('id', competidorId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function marcarPendiente(competidorId) {
  const { data, error } = await supabase
    .from('competidor')
    .update({ estado: 'pendiente_asignacion' })
    .eq('id', competidorId)
    .select()
    .single()
  if (error) throw error
  return data
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
  const { error } = await supabase
    .from('competidor')
    .update({ lado: null })
    .eq('categoria_id', categoriaId)
  if (error) throw error
}

export async function insertCompetidorPorLink(datos, linkId) {
  const fechaNac = datos.fecha_nacimiento || (datos.edad != null ? edadAFechaNacimiento(datos.edad) : null)
  const { data, error } = await supabase
    .from('competidor')
    .insert({
      torneo_id: datos.torneo_id,
      categoria_id: datos.categoria_id,
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
    .select('*, categoria:categoria_id(id, nombre, modalidad)')
    .single()
  if (error) throw error
  return data
}

export async function fetchCompetidoresPorLink(linkId) {
  const { data, error } = await supabase
    .from('competidor')
    .select('*, categoria:categoria_id(id, nombre, modalidad)')
    .eq('link_inscripcion_id', linkId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}
