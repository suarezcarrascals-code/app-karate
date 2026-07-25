const GRUPOS = [
  {
    key: 'kumite_individual',
    label: 'Kumite Individual',
    color: 'text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-950/50 border-amber-900/50 text-amber-300',
    resaltado: 'bg-amber-950/60 border-amber-700/60 text-amber-200',
  },
  {
    key: 'kumite_equipo',
    label: 'Kumite Equipo',
    color: 'text-orange-400',
    dot: 'bg-orange-500',
    badge: 'bg-orange-950/50 border-orange-900/50 text-orange-300',
    resaltado: 'bg-orange-950/60 border-orange-700/60 text-orange-200',
  },
  {
    key: 'kata_individual',
    label: 'Kata Individual',
    color: 'text-sky-400',
    dot: 'bg-sky-500',
    badge: 'bg-sky-950/50 border-sky-900/50 text-sky-300',
    resaltado: 'bg-sky-950/60 border-sky-700/60 text-sky-200',
  },
  {
    key: 'kata_equipo',
    label: 'Kata Equipo',
    color: 'text-cyan-400',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-950/50 border-cyan-900/50 text-cyan-300',
    resaltado: 'bg-cyan-950/60 border-cyan-700/60 text-cyan-200',
  },
]

const GENERO_LABEL = { masculino: 'Masc.', femenino: 'Fem.', mixto: 'Mixto' }

export default function CategoriaDisplay({ categorias, idsResaltados = [] }) {
  if (!categorias || categorias.length === 0) return null

  const grupos = GRUPOS.map((g) => ({
    ...g,
    items: categorias.filter((c) => c.modalidad === g.key),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
        Categorías disponibles
      </p>
      <div className="space-y-4">
        {grupos.map((grupo) => (
          <div key={grupo.key}>
            {/* Encabezado de grupo */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${grupo.dot} shrink-0`} />
              <p className={`text-xs font-bold uppercase tracking-widest ${grupo.color}`}>
                {grupo.label}
              </p>
              <span className="text-xs text-zinc-700">({grupo.items.length})</span>
            </div>

            {/* Cards */}
            <div className="grid gap-1.5">
              {grupo.items.map((cat) => {
                const resaltada = idsResaltados.includes(cat.id)
                return (
                  <div
                    key={cat.id}
                    className={`rounded-lg px-3 py-2 border text-xs transition-colors ${
                      resaltada ? grupo.resaltado : `${grupo.badge} opacity-80`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">
                        {cat.nombre}
                        {resaltada && <span className="ml-2 text-emerald-400 font-bold">← Sugerida</span>}
                      </span>
                      <span className="shrink-0 text-zinc-500 font-medium">
                        {GENERO_LABEL[cat.genero] || cat.genero}
                      </span>
                    </div>
                    {(cat.edad_min != null || cat.edad_max != null || cat.peso_max != null) && (
                      <p className="text-zinc-500 mt-0.5">
                        {cat.edad_min != null && cat.edad_max != null && `${cat.edad_min}–${cat.edad_max} años`}
                        {cat.peso_max != null && ` · hasta ${cat.peso_max} kg`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
