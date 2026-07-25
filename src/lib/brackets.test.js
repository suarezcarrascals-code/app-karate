import { describe, it, expect } from 'vitest'
import { asignarByes, generarBracket, contarRondas } from './brackets'

// ─── asignarByes ─────────────────────────────────────────────────────────────

describe('asignarByes', () => {
  it('con 6 competidores genera 2 byes para llegar a 8', () => {
    const resultado = asignarByes(6)
    expect(resultado.total_slots).toBe(8)
    expect(resultado.byes).toBe(2)
  })

  it('con 8 competidores no genera byes', () => {
    expect(asignarByes(8).byes).toBe(0)
    expect(asignarByes(8).total_slots).toBe(8)
  })

  it('con 5 competidores genera 3 byes para llegar a 8', () => {
    const resultado = asignarByes(5)
    expect(resultado.total_slots).toBe(8)
    expect(resultado.byes).toBe(3)
  })

  it('con 2 competidores no genera byes', () => {
    expect(asignarByes(2).byes).toBe(0)
    expect(asignarByes(2).total_slots).toBe(2)
  })

  it('con 16 competidores no genera byes', () => {
    expect(asignarByes(16).byes).toBe(0)
    expect(asignarByes(16).total_slots).toBe(16)
  })

  it('con 9 competidores genera 7 byes para llegar a 16', () => {
    const resultado = asignarByes(9)
    expect(resultado.total_slots).toBe(16)
    expect(resultado.byes).toBe(7)
  })

  it('con 1 competidor lanza error', () => {
    expect(() => asignarByes(1)).toThrow()
  })

  it('con 0 competidores lanza error', () => {
    expect(() => asignarByes(0)).toThrow()
  })
})

// ─── contarRondas ─────────────────────────────────────────────────────────────

describe('contarRondas', () => {
  it('con 8 slots hay 3 rondas (cuartos, semis, final)', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    expect(contarRondas(bracket)).toBe(3)
  })

  it('con 4 slots hay 2 rondas (semis, final)', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D'])
    expect(contarRondas(bracket)).toBe(2)
  })

  it('con 2 competidores hay 1 ronda (solo la final)', () => {
    const bracket = generarBracket(['A', 'B'])
    expect(contarRondas(bracket)).toBe(1)
  })
})

// ─── generarBracket ───────────────────────────────────────────────────────────

describe('generarBracket', () => {
  it('genera el número correcto de rondas con 6 competidores', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(contarRondas(bracket)).toBe(3) // 6 → 8 slots → 3 rondas
  })

  it('todos los competidores aparecen en la primera ronda', () => {
    const competidores = ['A', 'B', 'C', 'D']
    const bracket = generarBracket(competidores)
    const enRonda1 = bracket.rondas[0].combates
      .flatMap((c) => [c.rojo, c.azul])
      .filter(Boolean)
    competidores.forEach((c) => expect(enRonda1).toContain(c))
  })

  it('los byes en la primera ronda generan combates con un solo competidor', () => {
    // 3 competidores → 1 bye → un combate tiene azul = null
    const bracket = generarBracket(['A', 'B', 'C'])
    const ronda1 = bracket.rondas[0].combates
    const tienenBye = ronda1.filter((c) => c.rojo === null || c.azul === null)
    expect(tienenBye.length).toBe(1)
  })

  it('cada ronda tiene la mitad de combates que la anterior', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    const [r1, r2, r3] = bracket.rondas
    expect(r1.combates.length).toBe(4)
    expect(r2.combates.length).toBe(2)
    expect(r3.combates.length).toBe(1)
  })

  it('con 2 competidores genera 1 ronda con 1 combate', () => {
    const bracket = generarBracket(['A', 'B'])
    expect(bracket.rondas.length).toBe(1)
    expect(bracket.rondas[0].combates.length).toBe(1)
    expect(bracket.rondas[0].combates[0].rojo).toBe('A')
    expect(bracket.rondas[0].combates[0].azul).toBe('B')
  })

  it('lanza error con menos de 2 competidores', () => {
    expect(() => generarBracket(['A'])).toThrow()
    expect(() => generarBracket([])).toThrow()
  })

  it('cada combate tiene un id único', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D'])
    const ids = bracket.rondas.flatMap((r) => r.combates.map((c) => c.id))
    const unicos = new Set(ids)
    expect(unicos.size).toBe(ids.length)
  })

  it('las rondas posteriores a la 1 tienen participantes null (pendientes de resultado)', () => {
    const bracket = generarBracket(['A', 'B', 'C', 'D'])
    const ronda2 = bracket.rondas[1]
    ronda2.combates.forEach((c) => {
      expect(c.rojo).toBeNull()
      expect(c.azul).toBeNull()
    })
  })
})
