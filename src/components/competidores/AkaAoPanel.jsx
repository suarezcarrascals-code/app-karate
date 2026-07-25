export default function AkaAoPanel({ competidores, onAsignar, onLimpiar, loading }) {
  const aka = competidores.filter((c) => c.lado === 'aka')
  const ao  = competidores.filter((c) => c.lado === 'ao')
  const sinLado = competidores.filter((c) => !c.lado)
  const asignado = aka.length > 0 || ao.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onAsignar}
          disabled={loading || competidores.length < 2}
          className="bg-rose-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-500 transition-colors disabled:opacity-50 active:scale-95"
        >
          {loading ? 'Asignando...' : 'Asignar aleatoriamente'}
        </button>
        {asignado && (
          <button
            onClick={onLimpiar}
            disabled={loading}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Limpiar asignación
          </button>
        )}
      </div>

      {competidores.length < 2 && (
        <p className="text-xs text-amber-400/80">
          Necesitás al menos 2 competidores para dividir en Aka y Ao.
        </p>
      )}

      {asignado && (
        <div className="grid grid-cols-2 gap-3">
          {/* AKA */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Aka ({aka.length})
              </p>
            </div>
            <div className="space-y-1">
              {aka.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-950/30 border border-rose-900/40 rounded-lg">
                  <span className="text-xs text-rose-600 font-bold w-4 shrink-0">{i + 1}</span>
                  <span className="text-xs text-zinc-200 leading-tight">
                    {c.nombre} {c.apellido}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AO */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
              <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Ao ({ao.length})
              </p>
            </div>
            <div className="space-y-1">
              {ao.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-sky-950/30 border border-sky-900/40 rounded-lg">
                  <span className="text-xs text-sky-600 font-bold w-4 shrink-0">{i + 1}</span>
                  <span className="text-xs text-zinc-200 leading-tight">
                    {c.nombre} {c.apellido}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {asignado && sinLado.length > 0 && (
        <p className="text-xs text-zinc-600">
          Sin asignar: {sinLado.map((c) => `${c.nombre} ${c.apellido}`).join(', ')}
        </p>
      )}
    </div>
  )
}
