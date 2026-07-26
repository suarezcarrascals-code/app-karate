import { useState } from 'react'

function nombreRonda(numero, totalMainRondas) {
  const desdeFin = totalMainRondas - numero
  if (desdeFin === 0) return 'Final'
  if (desdeFin === 1) return 'Semifinal'
  if (desdeFin === 2) return 'Cuartos'
  return `Ronda ${numero}`
}

function CombateCard({ combate, competidores, onDeclararGanador, label }) {
  const [confirmando, setConfirmando] = useState(null) // 'rojo' | 'azul' | null

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

  function handleConfirmar() {
    const id = confirmando === 'rojo' ? combate.competidor_rojo_id : combate.competidor_azul_id
    onDeclararGanador(combate.id, id)
    setConfirmando(null)
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${esBye ? 'border-zinc-800/40 opacity-40' : 'border-zinc-700'}`}>

      {label && (
        <div className="px-3 py-1 bg-zinc-800/60 border-b border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        </div>
      )}

      {/* Rojo */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 ${
        esGanador(combate.competidor_rojo_id) ? 'bg-rose-950/50' : 'bg-zinc-900'
      }`}>
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
      <div className={`flex items-center gap-2 px-3 py-2.5 ${
        esGanador(combate.competidor_azul_id) ? 'bg-sky-950/50' : 'bg-zinc-900'
      }`}>
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

      {/* Botones de declarar ganador */}
      {puedeDeclarar && confirmando === null && (
        <div className="flex gap-1.5 px-2.5 py-2 border-t border-zinc-800 bg-zinc-800/30">
          <button
            onClick={() => setConfirmando('rojo')}
            className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 hover:bg-rose-900/60 transition-colors"
          >
            Rojo gana
          </button>
          <button
            onClick={() => setConfirmando('azul')}
            className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-sky-950/60 border border-sky-800/50 text-sky-300 hover:bg-sky-900/60 transition-colors"
          >
            Azul gana
          </button>
        </div>
      )}

      {/* Confirmación */}
      {puedeDeclarar && confirmando !== null && (
        <div className="flex items-center gap-2 px-2.5 py-2 border-t border-zinc-700 bg-zinc-800/50">
          <p className={`text-[11px] font-semibold flex-1 ${confirmando === 'rojo' ? 'text-rose-300' : 'text-sky-300'}`}>
            {confirmando === 'rojo'
              ? `${rojo?.nombre} gana — ¿confirmar?`
              : `${azul?.nombre} gana — ¿confirmar?`}
          </p>
          <button
            onClick={handleConfirmar}
            className="px-3 py-1 text-[11px] font-bold rounded-lg bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/60 transition-colors"
          >
            Sí
          </button>
          <button
            onClick={() => setConfirmando(null)}
            className="px-3 py-1 text-[11px] rounded-lg bg-zinc-700/50 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 transition-colors"
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

              <div className="flex flex-col gap-3">
                {combatesRonda.map((c) => (
                  <CombateCard
                    key={c.id}
                    combate={c}
                    competidores={competidores}
                    onDeclararGanador={onDeclararGanador}
                  />
                ))}

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
