import { describe, it, expect, vi } from 'vitest'
import { calcularEdad, encontrarCategoriasCompatibles, fetchCompetidores, insertCompetidor, asignarCategoria, deleteCompetidor, fetchEquipos, insertEquipo } from './competidores'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ id: 'c1', nombre: 'Juan', apellido: 'García', modalidad: 'kumite_individual', estado: 'sin_categoria' }],
            error: null,
          })),
        })),
      })),
      insert: vi.fn((payload) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'c1', nombre: payload?.nombre ?? 'Team Alpha', apellido: 'García', modalidad: 'kumite_individual', estado: 'sin_categoria', inscripcion_manual: false },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'c1', categoria_id: 'cat1', estado: 'inscrito' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

// ─── calcularEdad ────────────────────────────────────────────────────────────

describe('calcularEdad', () => {
  it('retorna null si no hay fecha de nacimiento', () => {
    expect(calcularEdad(null)).toBeNull()
    expect(calcularEdad(undefined)).toBeNull()
    expect(calcularEdad('')).toBeNull()
  })

  it('calcula correctamente la edad cuando el cumpleaños ya pasó este año', () => {
    const edad = calcularEdad('2010-01-01')
    expect(edad).toBe(16)
  })

  it('descuenta un año si el cumpleaños aún no pasó este año', () => {
    const edad = calcularEdad('2010-12-31')
    expect(edad).toBe(15)
  })

  it('retorna 0 para alguien nacido hoy', () => {
    const hoy = new Date().toISOString().split('T')[0]
    expect(calcularEdad(hoy)).toBe(0)
  })
})

// ─── encontrarCategoriasCompatibles ─────────────────────────────────────────

describe('encontrarCategoriasCompatibles', () => {
  const catBase = { id: 'c1', modalidad: 'kumite_individual', genero: 'masculino', edad_min: 14, edad_max: 17, peso_min: 40, peso_max: 55 }

  it('retorna la categoría que coincide exactamente', () => {
    const competidor = { modalidad: 'kumite_individual', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(1)
  })

  it('excluye categorías con modalidad diferente', () => {
    const competidor = { modalidad: 'kata_individual', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(0)
  })

  it('excluye categorías con género diferente', () => {
    const competidor = { modalidad: 'kumite_individual', genero: 'femenino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(0)
  })

  it('incluye categorías mixtas para cualquier género', () => {
    const catMixta = { ...catBase, id: 'c2', genero: 'mixto' }
    const competidor = { modalidad: 'kumite_individual', genero: 'femenino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catMixta])).toHaveLength(1)
  })

  it('excluye si la edad está fuera del rango', () => {
    const competidor = { modalidad: 'kumite_individual', genero: 'masculino', fecha_nacimiento: '2000-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(0)
  })

  it('excluye si el peso está fuera del rango', () => {
    const competidor = { modalidad: 'kumite_individual', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 70 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(0)
  })

  it('incluye si no hay rangos definidos en la categoría', () => {
    const catSinRangos = { id: 'c3', modalidad: 'kata_individual', genero: 'masculino', edad_min: null, edad_max: null, peso_min: null, peso_max: null }
    const competidor = { modalidad: 'kata_individual', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catSinRangos])).toHaveLength(1)
  })

  it('retorna múltiples categorías si más de una coincide', () => {
    const cat2 = { id: 'c2', modalidad: 'kumite_individual', genero: 'masculino', edad_min: 12, edad_max: 18, peso_min: null, peso_max: null }
    const competidor = { modalidad: 'kumite_individual', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase, cat2])).toHaveLength(2)
  })

  it('retorna array vacío si no hay ninguna coincidencia', () => {
    const competidor = { modalidad: 'kumite_equipo', genero: 'masculino', fecha_nacimiento: '2010-01-01', peso: 45 }
    expect(encontrarCategoriasCompatibles(competidor, [catBase])).toHaveLength(0)
  })
})

// ─── fetchCompetidores ───────────────────────────────────────────────────────

describe('fetchCompetidores', () => {
  it('retorna un array de competidores del torneo', async () => {
    const result = await fetchCompetidores('torneo-id')
    expect(Array.isArray(result)).toBe(true)
  })
})

// ─── insertCompetidor ────────────────────────────────────────────────────────

describe('insertCompetidor', () => {
  it('retorna el competidor creado con estado sin_categoria', async () => {
    const result = await insertCompetidor({ torneo_id: 'tid', nombre: 'Juan', apellido: 'García', modalidad: 'kumite_individual' })
    expect(result).toHaveProperty('id')
    expect(result.estado).toBe('sin_categoria')
  })
})

// ─── asignarCategoria ────────────────────────────────────────────────────────

describe('asignarCategoria', () => {
  it('retorna el competidor con categoria_id y estado inscrito', async () => {
    const result = await asignarCategoria('c1', 'cat1')
    expect(result.categoria_id).toBe('cat1')
    expect(result.estado).toBe('inscrito')
  })
})

// ─── deleteCompetidor ────────────────────────────────────────────────────────

describe('deleteCompetidor', () => {
  it('no lanza error al eliminar', async () => {
    await expect(deleteCompetidor('c1')).resolves.not.toThrow()
  })
})

// ─── fetchEquipos ────────────────────────────────────────────────────────────

describe('fetchEquipos', () => {
  it('retorna un array de equipos de la categoría', async () => {
    const result = await fetchEquipos('cat-1')
    expect(Array.isArray(result)).toBe(true)
  })

  it('cada equipo tiene id y nombre', async () => {
    const result = await fetchEquipos('cat-1')
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('nombre')
  })
})

// ─── insertEquipo ────────────────────────────────────────────────────────────

describe('insertEquipo', () => {
  it('retorna el equipo creado con id', async () => {
    const result = await insertEquipo({
      categoria_id: 'cat-1',
      nombre: 'Team Alpha',
      miembro_1_id: 'c1',
      miembro_2_id: 'c2',
      miembro_3_id: 'c3',
    })
    expect(result).toHaveProperty('id')
    expect(result.nombre).toBe('Team Alpha')
  })
})
