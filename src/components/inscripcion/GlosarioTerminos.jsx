const MODALIDADES = [
  { label: 'Kumite', desc: 'Combate cuerpo a cuerpo controlado' },
  { label: 'Kata', desc: 'Ejecución de formas técnicas' },
  { label: 'Individual', desc: 'Un competidor por bout' },
  { label: 'Equipo', desc: 'Tres competidores por equipo' },
]

const EDADES = [
  { label: 'U14',    rango: '12–13 años' },
  { label: 'Cadet',  rango: '14–15 años' },
  { label: 'Junior', rango: '16–17 años' },
  { label: 'U21',    rango: '18–20 años' },
  { label: 'Senior', rango: '16+ (kata) · 18+ (kumite)' },
]

export default function GlosarioTerminos() {
  return (
    <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/80 py-3 -mx-4 px-4">
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
        Guía de categorías
      </p>

      <div className="space-y-2">
        {/* Modalidades */}
        <div className="flex flex-wrap gap-1.5">
          {MODALIDADES.map(({ label, desc }) => (
            <span
              key={label}
              className="inline-flex items-baseline gap-1 text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg"
            >
              <span className="font-semibold text-zinc-200">{label}</span>
              <span className="text-zinc-600">{desc}</span>
            </span>
          ))}
        </div>

        {/* Grupos de edad */}
        <div className="flex flex-wrap gap-1.5">
          {EDADES.map(({ label, rango }) => (
            <span
              key={label}
              className="inline-flex items-baseline gap-1 text-xs bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg"
            >
              <span className="font-semibold text-rose-400/80">{label}</span>
              <span className="text-zinc-600">{rango}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
