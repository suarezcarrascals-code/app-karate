function nombreRonda(numero, total) {
  const desdeFin = total - numero
  if (desdeFin === 0) return 'Final'
  if (desdeFin === 1) return 'Semifinal'
  if (desdeFin === 2) return 'Cuartos'
  return `Ronda ${numero}`
}

function CombateCard({ combate, competidores }) {
  function buscar(id) {
    if (!id) return null
    return competidores.find((c) => c.id === id)
  }

  const rojo = buscar(combate.competidor_rojo_id)
  const azul = buscar(combate.competidor_azul_id)
  const esBye = combate.estado === 'bye'
  const finalizado = combate.estado === 'finalizado'

  function esGanador(id) {
    return finalizado && combate.ganador_id === id
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${
      esBye ? 'border-zinc-800/50 opacity-50' : 'border-zinc-700'
    }`}>
      {/* Rojo */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-zinc-800 ${
        esGanador(combate.competidor_rojo_id) ? 'bg-rose-950/40' : 'bg-zinc-900'
      }`}>
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        <span className={`flex-1 text-sm leading-tight ${
          rojo ? 'text-zinc-100' : 'text-zinc-600 italic'
        }`}>
          {rojo ? `${rojo.nombre} ${rojo.apellido}` : esBye ? 'BYE' : 'Pendiente'}
        </span>
        {finalizado && (
          <span className={`text-xs font-bold tabular-nums ${
            esGanador(combate.competidor_rojo_id) ? 'text-rose-400' : 'text-zinc-500'
          }`}>
            {combate.puntos_rojo}
          </span>
        )}
        {esGanador(combate.competidor_rojo_id) && (
          <span className="text-xs text-rose-400 font-bold">W</span>
        )}
      </div>

      {/* Azul */}
      <div className={`flex items-center gap-2 px-3 py-2 ${
        esGanador(combate.competidor_azul_id) ? 'bg-sky-950/40' : 'bg-zinc-900'
      }`}>
        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
        <span className={`flex-1 text-sm leading-tight ${
          azul ? 'text-zinc-100' : 'text-zinc-600 italic'
        }`}>
          {azul ? `${azul.nombre} ${azul.apellido}` : esBye ? 'BYE' : 'Pendiente'}
        </span>
        {finalizado && (
          <span className={`text-xs font-bold tabular-nums ${
            esGanador(combate.competidor_azul_id) ? 'text-sky-400' : 'text-zinc-500'
          }`}>
            {combate.puntos_azul}
          </span>
        )}
        {esGanador(combate.competidor_azul_id) && (
          <span className="text-xs text-sky-400 font-bold">W</span>
        )}
      </div>
    </div>
  )
}

export default function BracketView({ combates, competidores }) {
  if (!combates || combates.length === 0) return null

  // Agrupar por ronda
  const porRonda = combates.reduce((acc, c) => {
    if (!acc[c.ronda]) acc[c.ronda] = []
    acc[c.ronda].push(c)
    return acc
  }, {})

  const rondas = Object.keys(porRonda)
    .map(Number)
    .sort((a, b) => a - b)

  const totalRondas = rondas.length

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {rondas.map((numRonda) => {
          const combatesRonda = porRonda[numRonda].sort(
            (a, b) => a.orden_en_ronda - b.orden_en_ronda
          )
          return (
            <div key={numRonda} className="flex flex-col w-56 shrink-0">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 text-center">
                {nombreRonda(numRonda, totalRondas)}
              </p>
              <div className="flex flex-col justify-around flex-1 gap-3">
                {combatesRonda.map((c) => (
                  <CombateCard key={c.id} combate={c} competidores={competidores} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
