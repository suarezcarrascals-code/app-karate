import { describe, it, expect, vi } from 'vitest'
import { fetchDojos, insertDojo, deleteDojo } from './dojos'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ id: 'd1', nombre: 'Dojo Central', ciudad: 'Buenos Aires', torneo_id: 'tid' }],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'd1', nombre: 'Dojo Central', ciudad: 'Buenos Aires', torneo_id: 'tid' },
            error: null,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

describe('fetchDojos', () => {
  it('retorna un array de dojos del torneo', async () => {
    const result = await fetchDojos('tid')
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('nombre')
  })
})

describe('insertDojo', () => {
  it('retorna el dojo creado con id', async () => {
    const result = await insertDojo({ torneo_id: 'tid', nombre: 'Dojo Central', ciudad: 'Buenos Aires' })
    expect(result).toHaveProperty('id')
    expect(result.nombre).toBe('Dojo Central')
  })
})

describe('deleteDojo', () => {
  it('no lanza error al eliminar', async () => {
    await expect(deleteDojo('d1')).resolves.not.toThrow()
  })
})
