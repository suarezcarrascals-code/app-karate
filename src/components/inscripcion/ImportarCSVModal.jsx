import { useState, useRef } from 'react'
import { X, DownloadSimple, UploadSimple, Warning, CheckCircle, Spinner } from '@phosphor-icons/react'
import { descargarPlantillaExcel, parsearArchivoExcel, parsearCSV } from '../../lib/csvImport'
import { encontrarCategoriasCompatibles } from '../../lib/competidores'

export default function ImportarCSVModal({ categorias, onConfirmar, onCancel, loading }) {
  const [paso, setPaso] = useState('inicio') // 'inicio' | 'preview'
  const [filas, setFilas] = useState([])
  const [erroresCSV, setErroresCSV] = useState([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState({})
  const [parsando, setParsando] = useState(false)
  const inputRef = useRef()

  async function handleArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    setParsando(true)
    setErroresCSV([])

    try {
      let parsed, errores
      if (archivo.name.endsWith('.xlsx')) {
        ;({ filas: parsed, errores } = await parsearArchivoExcel(archivo))
      } else {
        const texto = await archivo.text()
        ;({ filas: parsed, errores } = parsearCSV(texto))
      }

      setErroresCSV(errores)
      if (parsed.length === 0) { setParsando(false); return }

      const seleccion = {}
      parsed.forEach((fila, idx) => {
        const sugeridas = encontrarCategoriasCompatibles(fila, categorias)
        seleccion[idx] = sugeridas.length > 0 ? sugeridas[0].id : ''
      })

      setFilas(parsed)
      setCategoriasSeleccionadas(seleccion)
      setPaso('preview')
    } finally {
      setParsando(false)
      e.target.value = ''
    }
  }

  function handleConfirmar() {
    const atletas = filas.map((fila, idx) => ({
      ...fila,
      categoria_id: categoriasSeleccionadas[idx] || null,
    })).filter((a) => a.categoria_id)
    onConfirmar(atletas)
  }

  const sinCategoria = filas.filter((_, idx) => !categoriasSeleccionadas[idx]).length
  const listos = filas.length - sinCategoria

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-100 text-base">Importar atletas desde CSV</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {paso === 'inicio' ? 'Descargá la plantilla, llenala y subila' : `${filas.length} atletas encontrados`}
            </p>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* PASO: INICIO */}
        {paso === 'inicio' && (
          <div className="px-5 py-6 space-y-5">
            {/* Paso 1: Descargar plantilla */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-zinc-200 mb-1">Paso 1 — Descargar plantilla</p>
              <p className="text-xs text-zinc-500 mb-3">
                Abrí el archivo en Excel o Google Sheets, llenalo con los datos de tus atletas y guardalo como CSV.
              </p>
              <button
                onClick={descargarPlantillaExcel}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <DownloadSimple size={16} />
                Descargar plantilla_atletas.xlsx
              </button>
            </div>

            {/* Columnas requeridas */}
            <div className="text-xs text-zinc-600 space-y-1 px-1">
              <p className="font-medium text-zinc-500 mb-2">Columnas requeridas:</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <p><span className="font-mono text-zinc-400">nombre</span> — Nombre del atleta</p>
                <p><span className="font-mono text-zinc-400">apellido</span> — Apellido</p>
                <p><span className="font-mono text-zinc-400">edad</span> — Número entero (ej: 15)</p>
                <p><span className="font-mono text-zinc-400">peso_kg</span> — Número (ej: 65.5)</p>
                <p><span className="font-mono text-zinc-400">genero</span> — "masculino" o "femenino"</p>
              </div>
            </div>

            {/* Paso 2: Subir archivo */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-zinc-200 mb-1">Paso 2 — Subir el archivo</p>
              <p className="text-xs text-zinc-500 mb-3">
                Una vez que llenaste la plantilla, subila acá.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,text/csv"
                onChange={handleArchivo}
                className="hidden"
              />
              <button
                onClick={() => inputRef.current.click()}
                disabled={parsando}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {parsando
                  ? <><Spinner size={16} className="animate-spin" /> Leyendo archivo...</>
                  : <><UploadSimple size={16} /> Seleccionar archivo (.xlsx o .csv)</>
                }
              </button>
            </div>

            {/* Errores de parseo */}
            {erroresCSV.length > 0 && (
              <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 space-y-1">
                <p className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-2">
                  <Warning size={14} /> Errores en el archivo
                </p>
                {erroresCSV.map((err, i) => (
                  <p key={i} className="text-xs text-rose-400">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO: PREVIEW */}
        {paso === 'preview' && (
          <div className="px-5 py-4">
            {/* Resumen */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle size={14} />
                {listos} listos para inscribir
              </span>
              {sinCategoria > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Warning size={14} />
                  {sinCategoria} sin categoría asignada (se omitirán)
                </span>
              )}
            </div>

            {/* Tabla de atletas */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filas.map((fila, idx) => {
                const sugeridas = encontrarCategoriasCompatibles(fila, categorias)
                const catId = categoriasSeleccionadas[idx]

                return (
                  <div key={idx} className={`bg-zinc-800/60 border rounded-lg px-3 py-2.5 ${catId ? 'border-zinc-700/50' : 'border-amber-900/40'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100">
                          {fila.nombre} {fila.apellido}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {fila.edad} años · {fila.peso ? `${fila.peso} kg · ` : ''}{fila.genero}
                        </p>
                      </div>
                      <select
                        value={catId}
                        onChange={(e) => setCategoriasSeleccionadas((prev) => ({ ...prev, [idx]: e.target.value }))}
                        className="bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500 max-w-[200px]"
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {sugeridas.some((s) => s.id === cat.id) ? '★ ' : ''}{cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Errores de filas omitidas */}
            {erroresCSV.length > 0 && (
              <div className="mt-3 bg-rose-950/30 border border-rose-900/50 rounded-lg px-3 py-2">
                <p className="text-xs text-rose-400 font-medium mb-1">Filas omitidas por errores:</p>
                {erroresCSV.map((err, i) => (
                  <p key={i} className="text-xs text-rose-500">{err}</p>
                ))}
              </div>
            )}

            {/* Botón para cargar otro archivo */}
            <div className="mt-3">
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleArchivo} className="hidden" />
              <button
                onClick={() => { setPaso('inicio'); setFilas([]); setErroresCSV([]) }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                ← Cargar otro archivo
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
          {paso === 'preview' && (
            <button
              onClick={handleConfirmar}
              disabled={listos === 0 || loading}
              className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors disabled:opacity-40"
            >
              {loading ? 'Inscribiendo...' : `Inscribir ${listos} atleta${listos !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
