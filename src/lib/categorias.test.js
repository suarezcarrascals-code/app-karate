import { describe, it, expect, vi } from 'vitest'
import { fetchCategorias, insertCategoria, calcularOrdenesOcupados, estaFueraDeRango } from './categorias'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'categoria') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              not: vi.fn(() => Promise.resolve({ data: [{ orden_en_tatami: 1 }, { orden_en_tatami: 2 }], error: null })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: 'cat-123', nombre: 'Kumite M U14', estado: 'abierta', tatami_id: null },
                  error: null,
                })
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: 'cat-123', tatami_id: 'tat-1', orden_en_tatami: 1 }, error: null })
                ),
              })),
            })),
          })),
        }
      }
      if (table === 'movimiento_categoria') {
        return {
          insert: vi.fn(() => Promise.resolve({ error: null })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        }
      }
    }),
  },
}))

describe('fetchCategorias', () => {
  it('retorna un array de categorias del torneo', async () => {
    const result = await fetchCategorias('torneo-id')
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('insertCategoria', () => {
  it('retorna la categoria creada con id y estado abierta', async () => {
    const result = await insertCategoria({
      torneo_id: 'torneo-1',
      nombre: 'Kumite M U14',
      modalidad: 'kumite_individual',
      genero: 'masculino',
    })
    expect(result).toHaveProperty('id')
    expect(result.estado).toBe('abierta')
  })
})

describe('calcularOrdenesOcupados', () => {
  it('retorna array de numeros con los ordenes ocupados del tatami', async () => {
    const result = await calcularOrdenesOcupados('tatami-id')
    expect(Array.isArray(result)).toBe(true)
    result.forEach((n) => expect(typeof n).toBe('number'))
  })
})

describe('estaFueraDeRango', () => {
  const categoria = { edad_min: 12, edad_max: 13, peso_min: null, peso_max: 40 }

  it('retorna fueraDeRango false cuando el competidor esta dentro del rango', () => {
    const competidor = { edad: 12, peso: 38 }
    const result = estaFueraDeRango(competidor, categoria)
    expect(result.fueraDeRango).toBe(false)
  })

  it('retorna fueraDeRango true cuando la edad esta fuera de rango', () => {
    const competidor = { edad: 10, peso: 38 }
    const result = estaFueraDeRango(competidor, categoria)
    expect(result.fueraDeRango).toBe(true)
    expect(result.motivos.length).toBeGreaterThan(0)
  })

  it('retorna fueraDeRango true cuando el peso excede el maximo', () => {
    const competidor = { edad: 12, peso: 45 }
    const result = estaFueraDeRango(competidor, categoria)
    expect(result.fueraDeRango).toBe(true)
  })

  it('retorna fueraDeRango false cuando no hay rangos definidos', () => {
    const sinRangos = { edad_min: null, edad_max: null, peso_min: null, peso_max: null }
    const competidor = { edad: 10, peso: 100 }
    const result = estaFueraDeRango(competidor, sinRangos)
    expect(result.fueraDeRango).toBe(false)
  })
})
