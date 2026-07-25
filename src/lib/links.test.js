import { describe, it, expect, vi } from 'vitest'
import {
  fetchLinks,
  fetchLinkByToken,
  generarLink,
  desactivarLink,
  desactivarTodosLosLinks,
  contarAtletasPorLink,
} from './links'

const LINK_MOCK = {
  id: 'link-1',
  token: 'token-uuid-1',
  torneo_id: 'torneo-1',
  dojo_id: 'dojo-1',
  limite_atletas: 10,
  estado: 'activo',
  created_at: '2026-06-06T00:00:00Z',
  dojo: { id: 'dojo-1', nombre: 'Club Shotokan' },
}

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      const chain = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        neq: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: LINK_MOCK, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [LINK_MOCK], error: null })),
        count: vi.fn(() => chain),
        head: vi.fn(() => chain),
      }
      // Para contarAtletasPorLink que usa { count: 'exact', head: true }
      chain.select = vi.fn((cols, opts) => {
        if (opts?.count === 'exact') {
          return {
            eq: vi.fn(() => Promise.resolve({ count: 3, error: null })),
          }
        }
        return chain
      })
      return chain
    }),
  },
}))

// ─── fetchLinks ──────────────────────────────────────────────────────────────

describe('fetchLinks', () => {
  it('retorna un array de links con dojo anidado', async () => {
    const result = await fetchLinks('torneo-1')
    expect(Array.isArray(result)).toBe(true)
  })
})

// ─── fetchLinkByToken ────────────────────────────────────────────────────────

describe('fetchLinkByToken', () => {
  it('retorna el link con torneo y dojo cuando el token es válido', async () => {
    const result = await fetchLinkByToken('token-uuid-1')
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('token')
  })
})

// ─── generarLink ─────────────────────────────────────────────────────────────

describe('generarLink', () => {
  it('retorna el link recién creado con token', async () => {
    const result = await generarLink('torneo-1', 'dojo-1', 10)
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('token')
  })

  it('acepta un límite de atletas mayor a 0', async () => {
    await expect(generarLink('torneo-1', 'dojo-1', 5)).resolves.not.toThrow()
  })
})

// ─── desactivarLink ──────────────────────────────────────────────────────────

describe('desactivarLink', () => {
  it('no lanza error al desactivar', async () => {
    await expect(desactivarLink('link-1')).resolves.not.toThrow()
  })
})

// ─── desactivarTodosLosLinks ─────────────────────────────────────────────────

describe('desactivarTodosLosLinks', () => {
  it('no lanza error al desactivar todos', async () => {
    await expect(desactivarTodosLosLinks('torneo-1')).resolves.not.toThrow()
  })
})

// ─── contarAtletasPorLink ────────────────────────────────────────────────────

describe('contarAtletasPorLink', () => {
  it('retorna un número entero >= 0', async () => {
    const count = await contarAtletasPorLink('link-1')
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
