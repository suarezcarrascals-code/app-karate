export default function AtletaInscritoCard({ atleta, numero }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5">
      <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center shrink-0">
        {numero}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">
          {atleta.nombre} {atleta.apellido}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          {atleta.inscripciones?.map((i) => i.categoria?.nombre).filter(Boolean).join(' · ') || 'Sin categoría'}
        </p>
      </div>
    </div>
  )
}
