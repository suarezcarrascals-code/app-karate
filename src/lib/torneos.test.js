import { describe, it, expect, vi } from 'vitest'
import { fetchTorneos, insertTorneo, uploadLogo, cambiarEstadoTorneo } from './torneos'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'abc-123', nombre: 'Test', estado: 'borrador' },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { id: 'abc-123', estado: 'inscripciones' },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/logo.jpg' },
        })),
      })),
    },
  },
}))

describe('fetchTorneos', () => {
  it('retorna un array de torneos', async () => {
    const result = await fetchTorneos()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('insertTorneo', () => {
  it('retorna el torneo creado con su id y estado borrador', async () => {
    const result = await insertTorneo({
      nombre: 'Torneo Test',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-03',
      lugar: 'Gimnasio',
      logo_url: null,
    })
    expect(result).toHaveProperty('id')
    expect(result.estado).toBe('borrador')
  })
})

describe('cambiarEstadoTorneo', () => {
  it('retorna el torneo con el nuevo estado', async () => {
    const result = await cambiarEstadoTorneo('abc-123', 'inscripciones')
    expect(result.estado).toBe('inscripciones')
  })
})
