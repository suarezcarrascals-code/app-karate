import { describe, it, expect } from 'vitest'
import {
  // Kumite — puntuación
  aplicarPunto,
  deshacerUltimoPunto,
  tieneVentajaOcho,
  // Kumite — penalizaciones
  aplicarPenalizacion,
  penalizacionDisponible,
  // Kumite — senshu y decisión
  calcularSenshu,
  determinarGanadorBout,
  // Kumite equipo
  calcularGanadorEquipoElim,
  // Kata — votos
  calcularVotoJuez,
  determinarGanadorKataBout,
  // Kata — validación de kata
  validarKataPermitido,
  // Kata — desempate round-robin
  resolverEmpateRoundRobinKata,
} from './scoring'

// ─── ESTADO INICIAL HELPER ────────────────────────────────────────────────────

function estadoBase() {
  return {
    puntos_aka: 0,
    puntos_ao: 0,
    ippon_aka: 0,
    ippon_ao: 0,
    waza_ari_aka: 0,
    waza_ari_ao: 0,
    yuko_aka: 0,
    yuko_ao: 0,
    chui_aka: 0,
    chui_ao: 0,
    hansoku_chui_aka: 0,
    hansoku_chui_ao: 0,
    senshu: null,
    historial_aka: [],
    historial_ao: [],
  }
}

// ─── APLICAR PUNTO ────────────────────────────────────────────────────────────

describe('aplicarPunto', () => {
  it('YUKO suma 1 punto a aka', () => {
    const s = aplicarPunto(estadoBase(), 'aka', 'yuko')
    expect(s.puntos_aka).toBe(1)
    expect(s.yuko_aka).toBe(1)
  })

  it('WAZA_ARI suma 2 puntos a ao', () => {
    const s = aplicarPunto(estadoBase(), 'ao', 'waza_ari')
    expect(s.puntos_ao).toBe(2)
    expect(s.waza_ari_ao).toBe(1)
  })

  it('IPPON suma 3 puntos', () => {
    const s = aplicarPunto(estadoBase(), 'aka', 'ippon')
    expect(s.puntos_aka).toBe(3)
    expect(s.ippon_aka).toBe(1)
  })

  it('no toca los puntos del oponente', () => {
    const base = { ...estadoBase(), puntos_ao: 4 }
    const s = aplicarPunto(base, 'aka', 'yuko')
    expect(s.puntos_ao).toBe(4)
  })

  it('acumula correctamente varios puntos', () => {
    let s = estadoBase()
    s = aplicarPunto(s, 'aka', 'yuko')
    s = aplicarPunto(s, 'aka', 'waza_ari')
    s = aplicarPunto(s, 'aka', 'ippon')
    expect(s.puntos_aka).toBe(6)
  })

  it('registra la acción en el historial', () => {
    const s = aplicarPunto(estadoBase(), 'aka', 'ippon')
    expect(s.historial_aka).toHaveLength(1)
    expect(s.historial_aka[0]).toBe('ippon')
  })
})

// ─── DESHACER ÚLTIMO PUNTO ────────────────────────────────────────────────────

describe('deshacerUltimoPunto', () => {
  it('revierte el último punto aplicado a aka', () => {
    let s = estadoBase()
    s = aplicarPunto(s, 'aka', 'waza_ari')
    s = deshacerUltimoPunto(s, 'aka')
    expect(s.puntos_aka).toBe(0)
    expect(s.waza_ari_aka).toBe(0)
    expect(s.historial_aka).toHaveLength(0)
  })

  it('solo deshace el último — los anteriores quedan intactos', () => {
    let s = estadoBase()
    s = aplicarPunto(s, 'aka', 'yuko')
    s = aplicarPunto(s, 'aka', 'ippon')
    s = deshacerUltimoPunto(s, 'aka')
    expect(s.puntos_aka).toBe(1)
    expect(s.ippon_aka).toBe(0)
    expect(s.yuko_aka).toBe(1)
  })

  it('no hace nada si no hay historial', () => {
    const s = deshacerUltimoPunto(estadoBase(), 'aka')
    expect(s.puntos_aka).toBe(0)
  })

  it('no toca al oponente al deshacer', () => {
    let s = { ...estadoBase(), puntos_ao: 3, ippon_ao: 1 }
    s = aplicarPunto(s, 'aka', 'yuko')
    s = deshacerUltimoPunto(s, 'aka')
    expect(s.puntos_ao).toBe(3)
    expect(s.ippon_ao).toBe(1)
  })
})

// ─── VENTAJA DE OCHO ─────────────────────────────────────────────────────────

describe('tieneVentajaOcho', () => {
  it('true cuando la diferencia es exactamente 8', () => {
    expect(tieneVentajaOcho({ puntos_aka: 8, puntos_ao: 0 })).toBe(true)
  })

  it('true cuando la diferencia supera 8', () => {
    expect(tieneVentajaOcho({ puntos_aka: 5, puntos_ao: 13 })).toBe(true)
  })

  it('false cuando la diferencia es 7', () => {
    expect(tieneVentajaOcho({ puntos_aka: 7, puntos_ao: 0 })).toBe(false)
  })

  it('false cuando están empatados', () => {
    expect(tieneVentajaOcho({ puntos_aka: 4, puntos_ao: 4 })).toBe(false)
  })
})

// ─── PENALIZACIONES ───────────────────────────────────────────────────────────

describe('penalizacionDisponible', () => {
  it('con 0 chui → disponible: chui', () => {
    expect(penalizacionDisponible(estadoBase(), 'aka')).toBe('chui')
  })

  it('con 2 chui → disponible: chui (todavía puede recibir el tercero)', () => {
    expect(penalizacionDisponible({ ...estadoBase(), chui_aka: 2 }, 'aka')).toBe('chui')
  })

  it('con 3 chui y sin hansoku_chui → disponible: hansoku_chui', () => {
    expect(penalizacionDisponible({ ...estadoBase(), chui_aka: 3 }, 'aka')).toBe('hansoku_chui')
  })

  it('con 3 chui + 1 hansoku_chui → disponible: hansoku', () => {
    const s = { ...estadoBase(), chui_aka: 3, hansoku_chui_aka: 1 }
    expect(penalizacionDisponible(s, 'aka')).toBe('hansoku')
  })
})

describe('aplicarPenalizacion', () => {
  it('CHUI incrementa el contador de chui', () => {
    const s = aplicarPenalizacion(estadoBase(), 'aka', 'chui')
    expect(s.chui_aka).toBe(1)
    expect(s.descalificado).toBeUndefined()
  })

  it('tres CHUI no descalifican por sí solos', () => {
    let s = estadoBase()
    s = aplicarPenalizacion(s, 'aka', 'chui')
    s = aplicarPenalizacion(s, 'aka', 'chui')
    s = aplicarPenalizacion(s, 'aka', 'chui')
    expect(s.chui_aka).toBe(3)
    expect(s.descalificado).toBeUndefined()
  })

  it('CHUI cuando ya hay 3 escala automáticamente a HANSOKU_CHUI', () => {
    const s = aplicarPenalizacion({ ...estadoBase(), chui_aka: 3 }, 'aka', 'chui')
    expect(s.hansoku_chui_aka).toBe(1)
    expect(s.chui_aka).toBe(3)
  })

  it('JOGAI equivale a CHUI — incrementa el mismo contador', () => {
    const s = aplicarPenalizacion(estadoBase(), 'aka', 'jogai')
    expect(s.chui_aka).toBe(1)
  })

  it('MUBOBI equivale a CHUI — incrementa el mismo contador', () => {
    const s = aplicarPenalizacion(estadoBase(), 'ao', 'mubobi')
    expect(s.chui_ao).toBe(1)
  })

  it('HANSOKU_CHUI directo (infracción grave) registra la advertencia', () => {
    const s = aplicarPenalizacion(estadoBase(), 'aka', 'hansoku_chui')
    expect(s.hansoku_chui_aka).toBe(1)
    expect(s.descalificado).toBeUndefined()
  })

  it('HANSOKU con HANSOKU_CHUI previo descalifica del bout — ao gana', () => {
    const s = aplicarPenalizacion({ ...estadoBase(), hansoku_chui_aka: 1 }, 'aka', 'hansoku')
    expect(s.descalificado).toBe('aka')
    expect(s.ganador_bout).toBe('ao')
  })

  it('HANSOKU directo (infracción grave) descalifica sin advertencias previas', () => {
    const s = aplicarPenalizacion(estadoBase(), 'aka', 'hansoku')
    expect(s.descalificado).toBe('aka')
    expect(s.ganador_bout).toBe('ao')
  })

  it('SHIKKAKU descalifica del torneo completo', () => {
    const s = aplicarPenalizacion(estadoBase(), 'ao', 'shikkaku')
    expect(s.descalificado_torneo).toBe('ao')
    expect(s.ganador_bout).toBe('aka')
  })
})

// ─── SENSHU ───────────────────────────────────────────────────────────────────

describe('calcularSenshu', () => {
  it('se asigna al primer marcador sin doble marcación', () => {
    expect(calcularSenshu({ primer_marcador: 'aka', doble_marcacion: false })).toBe('aka')
  })

  it('no se asigna cuando hay doble marcación', () => {
    expect(calcularSenshu({ primer_marcador: 'aka', doble_marcacion: true })).toBeNull()
  })

  it('ao puede tener senshu', () => {
    expect(calcularSenshu({ primer_marcador: 'ao', doble_marcacion: false })).toBe('ao')
  })
})

// ─── GANADOR DEL BOUT ─────────────────────────────────────────────────────────

describe('determinarGanadorBout', () => {
  it('criterio 1 — gana quien tiene más puntos', () => {
    const s = { ...estadoBase(), puntos_aka: 4, puntos_ao: 2 }
    expect(determinarGanadorBout(s)).toBe('aka')
  })

  it('criterio 2 — empate de puntos → gana quien tiene SENSHU', () => {
    const s = { ...estadoBase(), puntos_aka: 2, puntos_ao: 2, senshu: 'ao' }
    expect(determinarGanadorBout(s)).toBe('ao')
  })

  it('criterio 3 — sin SENSHU → gana mayor número de IPPON', () => {
    const s = { ...estadoBase(), puntos_aka: 3, puntos_ao: 3, senshu: null, ippon_aka: 1, ippon_ao: 0 }
    expect(determinarGanadorBout(s)).toBe('aka')
  })

  it('criterio 4 — mismo IPPON → gana mayor WAZA_ARI', () => {
    const s = {
      ...estadoBase(),
      puntos_aka: 3, puntos_ao: 3,
      senshu: null,
      ippon_aka: 1, ippon_ao: 1,
      waza_ari_aka: 2, waza_ari_ao: 0,
    }
    expect(determinarGanadorBout(s)).toBe('aka')
  })

  it('criterio 5 — todo igual → null (requiere HANTEI)', () => {
    const s = {
      ...estadoBase(),
      puntos_aka: 2, puntos_ao: 2,
      senshu: null,
      ippon_aka: 0, ippon_ao: 0,
      waza_ari_aka: 1, waza_ari_ao: 1,
    }
    expect(determinarGanadorBout(s)).toBeNull()
  })

  it('descalificado pierde el bout automáticamente', () => {
    const s = { ...estadoBase(), descalificado: 'aka' }
    expect(determinarGanadorBout(s)).toBe('ao')
  })
})

// ─── KUMITE EQUIPO — GANADOR DEL MATCH ───────────────────────────────────────

describe('calcularGanadorEquipoElim', () => {
  it('gana el equipo con más bouts ganados', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 3, puntos_ao: 0 },
      { ganador: 'ao',  puntos_aka: 0, puntos_ao: 2 },
      { ganador: 'aka', puntos_aka: 1, puntos_ao: 0 },
    ]
    expect(calcularGanadorEquipoElim(bouts)).toBe('aka')
  })

  it('empate en bouts → gana mayor total de puntos', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 5, puntos_ao: 2 },
      { ganador: 'ao',  puntos_aka: 1, puntos_ao: 6 },
    ]
    expect(calcularGanadorEquipoElim(bouts)).toBe('ao')
  })

  it('empate en bouts y en puntos → null (requiere bout extra)', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 4, puntos_ao: 2 },
      { ganador: 'ao',  puntos_aka: 2, puntos_ao: 4 },
    ]
    expect(calcularGanadorEquipoElim(bouts)).toBeNull()
  })
})

// ─── KATA — VOTO DEL JUEZ ────────────────────────────────────────────────────

describe('calcularVotoJuez', () => {
  it('vota por aka cuando aka tiene mayor puntaje', () => {
    expect(calcularVotoJuez({ aka: 8.5, ao: 8.0 })).toBe('aka')
  })

  it('vota por ao cuando ao tiene mayor puntaje', () => {
    expect(calcularVotoJuez({ aka: 7.9, ao: 8.1 })).toBe('ao')
  })

  it('lanza error si los puntajes son iguales', () => {
    expect(() => calcularVotoJuez({ aka: 8.0, ao: 8.0 })).toThrow()
  })
})

// ─── KATA — GANADOR DEL BOUT ─────────────────────────────────────────────────

describe('determinarGanadorKataBout', () => {
  it('gana quien tenga mayoría de votos — 4 vs 3 con 7 jueces', () => {
    const votos = ['aka', 'aka', 'aka', 'aka', 'ao', 'ao', 'ao']
    expect(determinarGanadorKataBout(votos)).toBe('aka')
  })

  it('gana quien tenga mayoría — 3 vs 2 con 5 jueces', () => {
    const votos = ['ao', 'ao', 'ao', 'aka', 'aka']
    expect(determinarGanadorKataBout(votos)).toBe('ao')
  })

  it('lanza error si el array está vacío', () => {
    expect(() => determinarGanadorKataBout([])).toThrow()
  })

  it('lanza error si hay número par de votos (empate imposible)', () => {
    expect(() => determinarGanadorKataBout(['aka', 'ao', 'aka', 'ao'])).toThrow()
  })
})

// ─── KATA — VALIDACIÓN DE KATA PERMITIDO ─────────────────────────────────────

describe('validarKataPermitido', () => {
  it('permite kata diferente al anterior', () => {
    const historial = ['Heian Shodan', 'Bassai Dai']
    expect(validarKataPermitido('Kanku Dai', historial)).toBe(true)
  })

  it('rechaza kata igual al inmediatamente anterior', () => {
    const historial = ['Heian Shodan', 'Bassai Dai']
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(false)
  })

  it('rechaza kata que ya se usó 2 veces aunque no sea el último', () => {
    const historial = ['Bassai Dai', 'Heian Shodan', 'Bassai Dai']
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(false)
  })

  it('permite kata usado 1 vez si no es el último', () => {
    const historial = ['Bassai Dai', 'Heian Shodan', 'Kanku Dai']
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(true)
  })

  it('permite cualquier kata si el historial está vacío', () => {
    expect(validarKataPermitido('Heian Shodan', [])).toBe(true)
  })
})

// ─── KATA — DESEMPATE ROUND-ROBIN ────────────────────────────────────────────

describe('resolverEmpateRoundRobinKata', () => {
  it('criterio 1 — gana quien tiene más puntos de victoria', () => {
    const a = { victoria_points: 6, votos_favor: 10, head_to_head: null, ranking_wkf: 5 }
    const b = { victoria_points: 3, votos_favor: 15, head_to_head: null, ranking_wkf: 1 }
    expect(resolverEmpateRoundRobinKata(a, b)).toBe(a)
  })

  it('criterio 3 — mismos puntos de victoria y sin head-to-head → mayor suma de votos', () => {
    const a = { victoria_points: 6, votos_favor: 12, head_to_head: null, ranking_wkf: 5 }
    const b = { victoria_points: 6, votos_favor: 9,  head_to_head: null, ranking_wkf: 1 }
    expect(resolverEmpateRoundRobinKata(a, b)).toBe(a)
  })

  it('criterio 4 — todo empate → gana mayor ranking WKF (número menor = mejor)', () => {
    const a = { victoria_points: 6, votos_favor: 10, head_to_head: null, ranking_wkf: 3 }
    const b = { victoria_points: 6, votos_favor: 10, head_to_head: null, ranking_wkf: 7 }
    expect(resolverEmpateRoundRobinKata(a, b)).toBe(a)
  })
})
