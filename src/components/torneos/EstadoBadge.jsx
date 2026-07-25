const ESTILOS = {
  borrador: {
    clases: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/80',
    dot: 'bg-zinc-500',
    etiqueta: 'Borrador',
  },
  inscripciones: {
    clases: 'bg-sky-950/60 text-sky-400 border border-sky-900/60',
    dot: 'bg-sky-400',
    etiqueta: 'Inscripciones',
  },
  en_curso: {
    clases: 'bg-rose-950/60 text-rose-400 border border-rose-900/60',
    dot: 'bg-rose-500',
    etiqueta: 'En curso',
  },
  finalizado: {
    clases: 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50',
    dot: 'bg-zinc-600',
    etiqueta: 'Finalizado',
  },
}

export default function EstadoBadge({ estado }) {
  const estilo = ESTILOS[estado] ?? ESTILOS.borrador
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${estilo.clases}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
      {ESTILOS[estado]?.etiqueta ?? estado}
    </span>
  )
}
