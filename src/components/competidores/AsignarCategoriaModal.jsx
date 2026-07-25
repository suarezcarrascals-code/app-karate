const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Individual',
  kumite_equipo: 'Kumite Equipo',
  kata_individual: 'Kata Individual',
  kata_equipo: 'Kata Equipo',
}

export default function AsignarCategoriaModal({ competidor, categorias, onElegir, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">Elegir categoría</h3>
        <p className="text-sm text-gray-500 mb-4">
          {competidor.nombre} {competidor.apellido} — {MODALIDAD_LABEL[competidor.modalidad]}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Hay {categorias.length} categorías posibles. Elegí la correcta:
        </p>
        <div className="space-y-2 mb-5">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onElegir(competidor.id, cat.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-800">{cat.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {cat.edad_min != null && cat.edad_max != null && `${cat.edad_min}–${cat.edad_max} años`}
                {cat.peso_max != null && ` · hasta ${cat.peso_max} kg`}
              </p>
            </button>
          ))}
        </div>
        <button onClick={onCancelar}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">
          Cancelar
        </button>
      </div>
    </div>
  )
}
