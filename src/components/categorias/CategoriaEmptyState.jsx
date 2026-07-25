import { Tag } from '@phosphor-icons/react'

export default function CategoriaEmptyState({ onCrear }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Tag size={24} weight="duotone" className="text-zinc-600" />
      </div>
      <h3 className="text-base font-semibold text-zinc-300 mb-1">No hay categorías aún</h3>
      <p className="text-zinc-600 text-sm mb-5 max-w-[200px] leading-relaxed">
        Creá las categorías del torneo para asignarlas a tatamis.
      </p>
      <button onClick={onCrear}
        className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors active:scale-95">
        Crear categoría
      </button>
    </div>
  )
}
