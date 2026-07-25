import { describe, it, expect, vi } from 'vitest'
import { fetchTatamis, insertTatami, deleteTatami, verificarCategoriasEnTatami, calcularOrden } from './tatamis'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'tatami') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [{ id: 'abc', nombre: 'Tatami A', orden: 1 }], error: null })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: 'abc', nombre: 'Tatami A', orden: 1, torneo_id: 'tid' }, error: null })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }
      if (table === 'categoria') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
          })),
        }
      }
    }),
  },
}))

describe('fetchTatamis', () => {
  it('retorna un array de tatamis del torneo', async () => {
    const result = await fetchTatamis('torneo-id')
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('insertTatami', () => {
  it('retorna el tatami creado con id y orden', async () => {
    const result = await insertTatami({ torneo_id: 'tid', nombre: 'Tatami A', orden: 1 })
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('orden')
    expect(result.nombre).toBe('Tatami A')
  })
})

describe('deleteTatami', () => {
  it('no lanza error al eliminar un tatami existente', async () => {
    await expect(deleteTatami('abc')).resolves.not.toThrow()
  })
})

describe('verificarCategoriasEnTatami', () => {
  it('retorna el numero de categorias del tatami', async () => {
    const count = await verificarCategoriasEnTatami('abc')
    expect(typeof count).toBe('number')
  })
})

describe('calcularOrden', () => {
  it('retorna 1 cuando la lista esta vacia', () => {
    expect(calcularOrden([])).toBe(1)
  })

  it('retorna max(orden) + 1 cuando hay tatamis', () => {
    const tatamis = [{ orden: 1 }, { orden: 2 }, { orden: 3 }]
    expect(calcularOrden(tatamis)).toBe(4)
  })

  it('maneja correctamente tatamis con ordenes no consecutivos', () => {
    const tatamis = [{ orden: 1 }, { orden: 3 }]
    expect(calcularOrden(tatamis)).toBe(4)
  })
})
