export default function FueraDeRangoModal({ motivos, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-semibold text-zinc-100 text-base mb-1">Fuera de rango</h3>
        <p className="text-sm text-zinc-400 mb-3">
          El competidor no cumple los rangos en:
        </p>
        <ul className="mb-4 space-y-1.5">
          {motivos.map((m, i) => (
            <li key={i} className="text-sm text-orange-300 bg-orange-950/40 border border-orange-900/50 rounded-lg px-3 py-2">
              {m}
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-600 mb-5">
          Podés inscribirlo igual. Quedará marcado como "inscripción manual".
        </p>
        <div className="flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar}
            className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-500 transition-colors">
            Inscribir igual
          </button>
        </div>
      </div>
    </div>
  )
}
