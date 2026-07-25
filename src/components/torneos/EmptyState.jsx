import { Link } from 'react-router-dom'
import { Trophy } from '@phosphor-icons/react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        <Trophy size={28} weight="duotone" className="text-zinc-500" />
      </div>
      <h2 className="text-base font-semibold text-zinc-200 mb-2">No hay torneos aún</h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-[220px] leading-relaxed">
        Creá tu primer torneo para empezar a organizar la competencia.
      </p>
      <Link
        to="/torneos/nuevo"
        className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-rose-500 transition-colors active:scale-95"
      >
        Crear torneo
      </Link>
    </div>
  )
}
