import { describe, it, expect } from 'vitest'
import { validarNombre, validarFechas, validarLugar, validarLogo, validarFormularioTorneo } from './validaciones'

describe('validarNombre', () => {
  it('retorna error cuando el nombre esta vacio', () => {
    expect(validarNombre('')).toBeTruthy()
  })
  it('retorna error cuando el nombre es solo espacios', () => {
    expect(validarNombre('   ')).toBeTruthy()
  })
  it('retorna null cuando el nombre es valido', () => {
    expect(validarNombre('Torneo Nacional 2026')).toBeNull()
  })
})

describe('validarFechas', () => {
  it('retorna error cuando la fecha de fin es anterior a la de inicio', () => {
    expect(validarFechas('2026-08-10', '2026-08-05')).toBeTruthy()
  })
  it('retorna null cuando fecha_fin >= fecha_inicio', () => {
    expect(validarFechas('2026-08-01', '2026-08-03')).toBeNull()
  })
  it('retorna null cuando ambas fechas son iguales', () => {
    expect(validarFechas('2026-08-01', '2026-08-01')).toBeNull()
  })
  it('retorna error cuando fecha_inicio esta vacia', () => {
    expect(validarFechas('', '2026-08-03')).toBeTruthy()
  })
  it('retorna error cuando fecha_fin esta vacia', () => {
    expect(validarFechas('2026-08-01', '')).toBeTruthy()
  })
})

describe('validarLugar', () => {
  it('retorna error cuando el lugar esta vacio', () => {
    expect(validarLugar('')).toBeTruthy()
  })
  it('retorna null cuando el lugar es valido', () => {
    expect(validarLugar('Gimnasio Municipal')).toBeNull()
  })
})

describe('validarLogo', () => {
  it('retorna null cuando no hay logo (es opcional)', () => {
    expect(validarLogo(null)).toBeNull()
    expect(validarLogo(undefined)).toBeNull()
  })
  it('retorna error cuando el archivo no es imagen', () => {
    const file = { type: 'application/pdf', size: 100 * 1024 }
    expect(validarLogo(file)).toBeTruthy()
  })
  it('retorna error cuando el archivo supera 2 MB', () => {
    const file = { type: 'image/jpeg', size: 3 * 1024 * 1024 }
    expect(validarLogo(file)).toBeTruthy()
  })
  it('retorna null cuando el logo es una imagen valida menor a 2 MB', () => {
    const file = { type: 'image/jpeg', size: 500 * 1024 }
    expect(validarLogo(file)).toBeNull()
  })
})

describe('validarFormularioTorneo', () => {
  const datosValidos = {
    nombre: 'Torneo Test',
    fecha_inicio: '2026-08-01',
    fecha_fin: '2026-08-03',
    lugar: 'Gimnasio',
    logo: null,
  }

  it('retorna valido true cuando todos los campos son correctos', () => {
    const resultado = validarFormularioTorneo(datosValidos)
    expect(resultado.valido).toBe(true)
    expect(Object.keys(resultado.errores)).toHaveLength(0)
  })

  it('retorna valido false cuando falta el nombre', () => {
    const resultado = validarFormularioTorneo({ ...datosValidos, nombre: '' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.nombre).toBeTruthy()
  })

  it('retorna valido false cuando las fechas son invalidas', () => {
    const resultado = validarFormularioTorneo({
      ...datosValidos,
      fecha_inicio: '2026-08-10',
      fecha_fin: '2026-08-05',
    })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.fechas).toBeTruthy()
  })
})
