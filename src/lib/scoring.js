// Toda la aritmética de kumite y kata vive aquí — nunca cálculos inline en componentes

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const VALOR_PUNTO = { yuko: 1, waza_ari: 2, ippon: 3 }

function oponente(atleta) {
  return atleta === 'aka' ? 'ao' : 'aka'
}

// ─── KUMITE — PUNTUACIÓN ─────────────────────────────────────────────────────

export function aplicarPunto(estado, atleta, tipo) {
  const valor = VALOR_PUNTO[tipo]
  if (!valor) throw new Error(`Tipo de punto desconocido: ${tipo}`)
  return {
    ...estado,
    [`puntos_${atleta}`]: estado[`puntos_${atleta}`] + valor,
    [`${tipo}_${atleta}`]: estado[`${tipo}_${atleta}`] + 1,
    [`historial_${atleta}`]: [...estado[`historial_${atleta}`], tipo],
  }
}

export function deshacerUltimoPunto(estado, atleta) {
  const historial = estado[`historial_${atleta}`]
  if (historial.length === 0) return estado
  const ultimo = historial[historial.length - 1]
  const valor = VALOR_PUNTO[ultimo]
  return {
    ...estado,
    [`puntos_${atleta}`]: estado[`puntos_${atleta}`] - valor,
    [`${ultimo}_${atleta}`]: estado[`${ultimo}_${atleta}`] - 1,
    [`historial_${atleta}`]: historial.slice(0, -1),
  }
}

export function tieneVentajaOcho(estado) {
  return Math.abs(estado.puntos_aka - estado.puntos_ao) >= 8
}

// ─── KUMITE — PENALIZACIONES ─────────────────────────────────────────────────

// Devuelve qué penalización corresponde aplicar a continuación según el historial
export function penalizacionDisponible(estado, atleta) {
  if (estado[`hansoku_chui_${atleta}`] >= 1) return 'hansoku'
  if (estado[`chui_${atleta}`] >= 3) return 'hansoku_chui'
  return 'chui'
}

// JOGAI y MUBOBI son infracciones que escalan dentro del sistema de CHUI
const EQUIVALE_CHUI = new Set(['chui', 'jogai', 'mubobi'])

export function aplicarPenalizacion(estado, atleta, tipo) {
  const rival = oponente(atleta)

  if (tipo === 'shikkaku') {
    return { ...estado, descalificado_torneo: atleta, ganador_bout: rival }
  }

  if (tipo === 'hansoku') {
    return { ...estado, descalificado: atleta, ganador_bout: rival }
  }

  if (tipo === 'hansoku_chui') {
    return { ...estado, [`hansoku_chui_${atleta}`]: estado[`hansoku_chui_${atleta}`] + 1 }
  }

  if (EQUIVALE_CHUI.has(tipo)) {
    // Si ya tiene 3 CHUI, escala automáticamente a HANSOKU_CHUI
    if (estado[`chui_${atleta}`] >= 3) {
      return { ...estado, [`hansoku_chui_${atleta}`]: estado[`hansoku_chui_${atleta}`] + 1 }
    }
    return { ...estado, [`chui_${atleta}`]: estado[`chui_${atleta}`] + 1 }
  }

  throw new Error(`Tipo de penalización desconocido: ${tipo}`)
}

// ─── KUMITE — SENSHU ─────────────────────────────────────────────────────────

export function calcularSenshu({ primer_marcador, doble_marcacion }) {
  if (doble_marcacion) return null
  return primer_marcador ?? null
}

// ─── KUMITE — GANADOR DEL BOUT ────────────────────────────────────────────────

export function determinarGanadorBout(estado) {
  // Descalificación directa
  if (estado.descalificado) return oponente(estado.descalificado)
  if (estado.descalificado_torneo) return oponente(estado.descalificado_torneo)

  // Criterio 1 — más puntos
  if (estado.puntos_aka !== estado.puntos_ao) {
    return estado.puntos_aka > estado.puntos_ao ? 'aka' : 'ao'
  }

  // Criterio 2 — SENSHU
  if (estado.senshu) return estado.senshu

  // Criterio 3 — más IPPON
  if (estado.ippon_aka !== estado.ippon_ao) {
    return estado.ippon_aka > estado.ippon_ao ? 'aka' : 'ao'
  }

  // Criterio 4 — más WAZA-ARI
  if (estado.waza_ari_aka !== estado.waza_ari_ao) {
    return estado.waza_ari_aka > estado.waza_ari_ao ? 'aka' : 'ao'
  }

  // Criterio 5 — requiere HANTEI
  return null
}

// ─── KUMITE EQUIPO — GANADOR DEL MATCH ───────────────────────────────────────

export function calcularGanadorEquipoElim(bouts) {
  let bouts_aka = 0
  let bouts_ao = 0
  let puntos_aka = 0
  let puntos_ao = 0

  for (const b of bouts) {
    if (b.ganador === 'aka') bouts_aka++
    if (b.ganador === 'ao') bouts_ao++
    puntos_aka += b.puntos_aka ?? 0
    puntos_ao += b.puntos_ao ?? 0
  }

  if (bouts_aka !== bouts_ao) return bouts_aka > bouts_ao ? 'aka' : 'ao'
  if (puntos_aka !== puntos_ao) return puntos_aka > puntos_ao ? 'aka' : 'ao'
  return null
}

// ─── KATA — VOTO DEL JUEZ ────────────────────────────────────────────────────

export function calcularVotoJuez({ aka, ao }) {
  if (aka === ao) throw new Error('Los puntajes del juez no pueden ser iguales')
  return aka > ao ? 'aka' : 'ao'
}

// ─── KATA — GANADOR DEL BOUT ─────────────────────────────────────────────────

export function determinarGanadorKataBout(votos) {
  if (votos.length === 0) throw new Error('El array de votos no puede estar vacío')
  if (votos.length % 2 === 0) throw new Error('El número de jueces debe ser impar para evitar empate')

  const votos_aka = votos.filter((v) => v === 'aka').length
  const votos_ao = votos.filter((v) => v === 'ao').length
  return votos_aka > votos_ao ? 'aka' : 'ao'
}

// ─── KATA — VALIDACIÓN DE KATA PERMITIDO ─────────────────────────────────────

export function validarKataPermitido(kata, historial) {
  // No puede repetir el kata inmediatamente anterior
  if (historial.length > 0 && historial[historial.length - 1] === kata) return false
  // No puede usar el mismo kata más de 2 veces en total
  const usos = historial.filter((k) => k === kata).length
  if (usos >= 2) return false
  return true
}

// ─── KATA — DESEMPATE ROUND-ROBIN (WKF Art. 5.11) ────────────────────────────

export function resolverEmpateRoundRobinKata(a, b) {
  // Criterio 1 — más puntos de victoria
  if (a.victoria_points !== b.victoria_points) {
    return a.victoria_points > b.victoria_points ? a : b
  }

  // Criterio 2 — ganador del bout directo (head-to-head)
  if (a.head_to_head !== null && a.head_to_head !== b.head_to_head) {
    return a.head_to_head === true ? a : b
  }

  // Criterio 3 — mayor suma de votos de jueces
  if (a.votos_favor !== b.votos_favor) {
    return a.votos_favor > b.votos_favor ? a : b
  }

  // Criterio 4 — mayor ranking WKF (número menor = mejor posición)
  if (a.ranking_wkf !== b.ranking_wkf) {
    return a.ranking_wkf < b.ranking_wkf ? a : b
  }

  // Criterio 5 — kata extra (no se resuelve aquí, depende de UI)
  return null
}
