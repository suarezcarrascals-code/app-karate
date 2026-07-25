// ─── Utilidades ──────────────────────────────────────────────────────────────

function siguientePotenciaDeDos(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

let _idCounter = 0
function uid() {
  return `combate-${++_idCounter}`
}

// ─── asignarByes ─────────────────────────────────────────────────────────────
// Devuelve cuántos slots totales se necesitan y cuántos byes hay.

export function asignarByes(n) {
  if (n < 2) throw new Error('Se necesitan al menos 2 competidores')
  const total_slots = siguientePotenciaDeDos(n)
  return { total_slots, byes: total_slots - n }
}

// ─── contarRondas ────────────────────────────────────────────────────────────

export function contarRondas(bracket) {
  return bracket.rondas.length
}

// ─── generarBracket ──────────────────────────────────────────────────────────
// Genera un bracket de eliminación directa.
// Cada combate tiene: { id, rojo, azul, ganador: null }
// Las rondas posteriores a la 1 tienen rojo/azul = null (pendientes).

export function generarBracket(competidores) {
  if (!competidores || competidores.length < 2) {
    throw new Error('Se necesitan al menos 2 competidores')
  }

  const { total_slots, byes } = asignarByes(competidores.length)

  // Mezclar aleatoriamente
  const shuffled = [...competidores].sort(() => Math.random() - 0.5)

  // Distribuir byes: primero los partidos reales (2 vs 2), luego los byes (1 vs null).
  // Esto evita pares null-null cuando los byes superan la mitad del bracket.
  const nRealPairs = (shuffled.length - byes) / 2
  const slots = []
  let idx = 0
  for (let i = 0; i < nRealPairs; i++) {
    slots.push(shuffled[idx++], shuffled[idx++])
  }
  for (let i = 0; i < byes; i++) {
    slots.push(shuffled[idx++], null)
  }

  // Primera ronda: emparejar de a pares
  const ronda1 = {
    numero: 1,
    combates: [],
  }
  for (let i = 0; i < slots.length; i += 2) {
    ronda1.combates.push({
      id: uid(),
      rojo: slots[i],
      azul: slots[i + 1] ?? null,
      ganador: null,
      estado: 'pendiente',
    })
  }

  const rondas = [ronda1]

  // Rondas siguientes: participantes vacíos (se llenan con ganadores)
  let cantidadCombates = ronda1.combates.length / 2
  let numeroRonda = 2
  while (cantidadCombates >= 1) {
    const ronda = {
      numero: numeroRonda,
      combates: Array.from({ length: cantidadCombates }, () => ({
        id: uid(),
        rojo: null,
        azul: null,
        ganador: null,
        estado: 'pendiente',
      })),
    }
    rondas.push(ronda)
    cantidadCombates = Math.floor(cantidadCombates / 2)
    numeroRonda++
  }

  return { rondas }
}
