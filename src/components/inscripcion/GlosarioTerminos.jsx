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
  { label: 'Senior', rango: 'Kata 16+ · Kumite 18+' },
]

export default function GlosarioTerminos() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
        Guía de categorías
      </p>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Modalidad</p>
        <div className="space-y-2">
          {MODALIDADES.map(({ label, desc }) => (
            <div key={label}>
              <span className="text-xs font-semibold text-zinc-200">{label}</span>
              <p className="text-[11px] text-zinc-600 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Grupos de edad</p>
        <div className="space-y-2">
          {EDADES.map(({ label, rango }) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-rose-400/80 shrink-0">{label}</span>
              <span className="text-[11px] text-zinc-600 text-right leading-snug">{rango}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
