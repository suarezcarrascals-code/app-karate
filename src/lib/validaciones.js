export function validarNombre(nombre) {
  if (!nombre || nombre.trim() === '') return 'El nombre es obligatorio'
  return null
}

export function validarFechas(fechaInicio, fechaFin) {
  if (!fechaInicio) return 'La fecha de inicio es obligatoria'
  if (!fechaFin) return 'La fecha de fin es obligatoria'
  if (new Date(fechaFin) < new Date(fechaInicio))
    return 'La fecha de fin debe ser posterior o igual a la de inicio'
  return null
}

export function validarLugar(lugar) {
  if (!lugar || lugar.trim() === '') return 'El lugar es obligatorio'
  return null
}

export function validarLogo(file) {
  if (!file) return null
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen'
  if (file.size > 2 * 1024 * 1024) return 'El logo no puede superar 2 MB'
  return null
}

export function validarFormularioTorneo({ nombre, fecha_inicio, fecha_fin, lugar, logo }) {
  const errores = {}
  const errorNombre = validarNombre(nombre)
  if (errorNombre) errores.nombre = errorNombre
  const errorFechas = validarFechas(fecha_inicio, fecha_fin)
  if (errorFechas) errores.fechas = errorFechas
  const errorLugar = validarLugar(lugar)
  if (errorLugar) errores.lugar = errorLugar
  const errorLogo = validarLogo(logo)
  if (errorLogo) errores.logo = errorLogo
  return { valido: Object.keys(errores).length === 0, errores }
}
