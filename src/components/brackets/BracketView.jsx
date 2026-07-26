import { useState } from 'react'

function nombreRonda(numero, totalMainRondas) {
  const desdeFin = totalMainRondas - numero
  if (desdeFin === 0) return 'Final'
  if (desdeFin === 1) return 'Semifinal'
  if (desdeFin === 2) return 'Cuartos'
  return `Ronda ${numero}`
}

function CombateCard({ combate, competidores, onDeclararGanador, label }) {
  const [seleccionado, setSeleccionado] = useState(null) // competidor_id pendiente de confirmar

  function buscar(id) {
    return id ? competidores.find((c) => c.id === id) ?? null : null
  }

  const rojo = buscar(combate.competidor_rojo_id)
  const azul = buscar(combate.competidor_azul_id)
  const esBye = combate.estado === 'bye'
  const finalizado = combate.estado === 'finalizado'
  const puedeDeclarar = combate.estado === 'pendiente' && rojo && azul && onDeclararGanador

  function esGanador(id) {
    return finalizado && combate.ganador_id === id
  }

  function handleSeleccionar(id) {
    setSeleccionado((prev) => (prev === id ? null : id))
  }

  function handleConfirmar() {
    onDeclararGanador(combate.id, seleccionado)
    setSeleccionado(null)
  }

  const seleccionColor =
    seleccionado === combate.competidor_rojo_id ? 'text-rose-300' : 'text-sky-300'

  return (
    <div className={`rounded-xl border overflow-hidden ${esBye ? 'border-zinc-800/40 opacity-40' : 'border-zinc-700'}`}>
      {label && (
        <div className="px-3 py-1 bg-zinc-800/60 border-b border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        </div>
      )}

      {/* Rojo */}
      <div
        onClick={() => puedeDeclarar && handleSeleccionar(combate.competidor_rojo_id)}
        className={`flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 transition-colors ${
          puedeDeclarar ? 'cursor-pointer' : ''
        } ${
          esGanador(combate.competidor_rojo_id)
            ? 'bg-rose-950/50'
            : seleccionado === combate.competidor_rojo_id
            ? 'bg-rose-900/30 ring-1 ring-inset ring-rose-700/60'
            : puedeDeclarar
            ? 'bg-zinc-900 hover:bg-zinc-800/70'
            : 'bg-zinc-900'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        <span className={`flex-1 text-sm leading-tight truncate ${rojo ? 'text-zinc-100' : 'text-zinc-600 italic'}`}>
          {rojo ? `${rojo.nombre} ${rojo.apellido}` : esBye ? 'BYE' : '—'}
        </span>
        {finalizado && combate.puntos_rojo != null && (
          <span className={`text-xs font-bold tabular-nums shrink-0 ${esGanador(combate.competidor_rojo_id) ? 'text-rose-400' : 'text-zinc-600'}`}>
            {combate.puntos_rojo}
          </span>
        )}
        {esGanador(combate.competidor_rojo_id) && (
          <span className="text-xs text-rose-400 font-black shrink-0 ml-1">W</span>
        )}
      </div>

      {/* Azul */}
      <div
        onClick={() => puedeDeclarar && handleSeleccionar(combate.competidor_azul_id)}
        className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
          puedeDeclarar ? 'cursor-pointer' : ''
        } ${
          esGanador(combate.competidor_azul_id)
            ? 'bg-sky-950/50'
            : seleccionado === combate.competidor_azul_id
            ? 'bg-sky-900/30 ring-1 ring-inset ring-sky-700/60'
            : puedeDeclarar
            ? 'bg-zinc-900 hover:bg-zinc-800/70'
            : 'bg-zinc-900'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
        <span className={`flex-1 text-sm leading-tight truncate ${azul ? 'text-zinc-100' : 'text-zinc-600 italic'}`}>
          {azul ? `${azul.nombre} ${azul.apellido}` : esBye ? 'BYE' : '—'}
        </span>
        {finalizado && combate.puntos_azul != null && (
          <span className={`text-xs font-bold tabular-nums shrink-0 ${esGanador(combate.competidor_azul_id) ? 'text-sky-400' : 'text-zinc-600'}`}>
            {combate.puntos_azul}
          </span>
        )}
        {esGanador(combate.competidor_azul_id) && (
          <span className="text-xs text-sky-400 font-black shrink-0 ml-1">W</span>
        )}
      </div>

      {/* Barra inferior: instrucción o confirmación */}
      {puedeDeclarar && !seleccionado && (
        <div className="px-3 py-1.5 bg-zinc-800/40 border-t border-zinc-800/60">
          <p className="text-[10px] text-zinc-600">Tocá un competidor para declarar ganador</p>
        </div>
      )}

      {puedeDeclarar && seleccionado && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 border-t border-zinc-700/60">
          <p className={`text-[11px] font-semibold flex-1 ${seleccionColor}`}>
            {seleccionado === combate.competidor_rojo_id
              ? `${rojo?.nombre} ${rojo?.apellido}`
              : `${azul?.nombre} ${azul?.apellido}`}{' '}
            gana — ¿confirmar?
          </p>
          <button
            onClick={handleConfirmar}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/60 font-semibold transition-colors"
          >
            Sí
          </button>
          <button
            onClick={() => setSeleccionado(null)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-700/50 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

export default function BracketView({ combates, competidores, onDeclararGanador }) {
  if (!combates || combates.length === 0) return null

  // Separar 3er puesto (orden_en_ronda = 0) del bracket principal
  const tercerPuesto = combates.find((c) => c.orden_en_ronda === 0) ?? null
  const mainCombates = combates.filter((c) => c.orden_en_ronda > 0)

  if (mainCombates.length === 0) return null

  // Agrupar por ronda
  const porRonda = mainCombates.reduce((acc, c) => {
    if (!acc[c.ronda]) acc[c.ronda] = []
    acc[c.ronda].push(c)
    return acc
  }, {})

  const rondas = Object.keys(porRonda).map(Number).sort((a, b) => a - b)
  const totalMainRondas = rondas.length

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max items-start">
        {rondas.map((numRonda) => {
          const combatesRonda = porRonda[numRonda].sort((a, b) => a.orden_en_ronda - b.orden_en_ronda)
          const esUltimaRonda = numRonda === rondas[rondas.length - 1]

          return (
            <div key={numRonda} className="flex flex-col w-60 shrink-0 gap-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">
                {nombreRonda(numRonda, totalMainRondas)}
              </p>

              <div className={`flex flex-col gap-3 ${!esUltimaRonda ? 'justify-around' : ''}`}>
                {combatesRonda.map((c) => (
                  <CombateCard
                    key={c.id}
                    combate={c}
                    competidores={competidores}
                    onDeclararGanador={onDeclararGanador}
                  />
                ))}

                {/* 3er puesto: en la misma columna que la final, debajo */}
                {esUltimaRonda && tercerPuesto && (
                  <div className="mt-2">
                    <CombateCard
                      combate={tercerPuesto}
                      competidores={competidores}
                      onDeclararGanador={onDeclararGanador}
                      label="3er Puesto"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
