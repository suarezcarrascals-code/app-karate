import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import {
  DndContext, pointerWithin, rectIntersection, getFirstCollision,
  PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from '@phosphor-icons/react'
import useTatamiStore from '../../stores/useTatamiStore'
import useCategoriaStore from '../../stores/useCategoriaStore'
import TatamiColumna from '../../components/tatamis/TatamiColumna'
import TatamiEmptyState from '../../components/tatamis/TatamiEmptyState'
import TatamiForm from '../../components/tatamis/TatamiForm'

export default function TorneoDashboard() {
  const { id } = useParams()
  const { torneo } = useOutletContext()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pendienteMover, setPendienteMover] = useState(null)
  const [activeDrag, setActiveDrag] = useState(null)

  const { tatamis, loading, error, fetchTatamis, addTatami } = useTatamiStore()
  const { categorias, fetchCategorias, reordenarEnTatami, asignarTatami } = useCategoriaStore()
  const torneoId = id

  const bloqueado = torneo?.estado === 'en_curso' || torneo?.estado === 'finalizado'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  useEffect(() => {
    fetchTatamis(id)
    fetchCategorias(id)
  }, [id, fetchTatamis, fetchCategorias])

  async function handleAgregarTatami({ nombre, arbitro }) {
    try {
      await addTatami({ torneo_id: id, nombre, arbitro })
      setMostrarForm(false)
    } catch { /* error en store */ }
  }

  function handleDragStart({ active }) {
    setActiveDrag(categorias.find((c) => c.id === active.id) || null)
  }

  function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    if (!over || active.id === over.id) return

    const draggedCat = categorias.find((c) => c.id === active.id)
    if (!draggedCat) return

    const sourceTatamiId = draggedCat.tatami_id
    const isOverTatami = tatamis.some((t) => t.id === over.id)
    let destTatamiId = isOverTatami ? over.id : categorias.find((c) => c.id === over.id)?.tatami_id

    if (!destTatamiId) return

    if (sourceTatamiId === destTatamiId) {
      const cats = categorias
        .filter((c) => c.tatami_id === sourceTatamiId && c.orden_en_tatami != null)
        .sort((a, b) => a.orden_en_tatami - b.orden_en_tatami)
      const oldIdx = cats.findIndex((c) => c.id === active.id)
      const newIdx = cats.findIndex((c) => c.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        reordenarEnTatami(sourceTatamiId, arrayMove(cats, oldIdx, newIdx))
      }
      return
    }

    const tatDest = tatamis.find((t) => t.id === destTatamiId)
    setPendienteMover({
      categoriaId: draggedCat.id,
      categoriaNombre: draggedCat.nombre,
      tatamiOrigenId: sourceTatamiId,
      tatamiDestinoId: destTatamiId,
      tatamiDestinoNombre: tatDest?.nombre,
    })
  }

  async function handleConfirmarMover() {
    const { categoriaId, tatamiOrigenId, tatamiDestinoId } = pendienteMover

    const catsOrigenRestantes = categorias
      .filter((c) => c.tatami_id === tatamiOrigenId && c.id !== categoriaId && c.orden_en_tatami != null)
      .sort((a, b) => a.orden_en_tatami - b.orden_en_tatami)

    const catsDest = categorias.filter((c) => c.tatami_id === tatamiDestinoId && c.orden_en_tatami != null)
    const nuevoOrden = catsDest.length > 0 ? Math.max(...catsDest.map((c) => c.orden_en_tatami)) + 1 : 1

    try {
      await asignarTatami(categoriaId, tatamiDestinoId, nuevoOrden, tatamiOrigenId, 'Movido arrastrando')
      if (catsOrigenRestantes.length > 0) await reordenarEnTatami(tatamiOrigenId, catsOrigenRestantes)
      const catsDestinoOrdenadas = [...catsDest, { id: categoriaId, orden_en_tatami: nuevoOrden }]
        .sort((a, b) => a.orden_en_tatami - b.orden_en_tatami)
      if (catsDestinoOrdenadas.length > 0) await reordenarEnTatami(tatamiDestinoId, catsDestinoOrdenadas)
      await fetchCategorias(torneoId)
    } catch { /* error en store */ }
    setPendienteMover(null)
  }

  return (
    <div className="p-5 md:p-6 overflow-x-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Tatamis</h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            {tatamis.length > 0
              ? `${tatamis.length} tatami${tatamis.length !== 1 ? 's' : ''} · arrastrá las categorías para reordenarlas`
              : 'Las áreas de competencia del torneo'}
          </p>
        </div>
        {!bloqueado && !mostrarForm && (
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98] shadow-lg shadow-rose-950/40 shrink-0">
            <Plus size={14} weight="bold" />
            Agregar tatami
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="mb-5 max-w-lg">
          <TatamiForm onSubmit={handleAgregarTatami} onCancel={() => setMostrarForm(false)} loading={loading} />
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      {loading && !mostrarForm && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && tatamis.length === 0 && !mostrarForm && (
        <TatamiEmptyState onAgregar={() => setMostrarForm(true)} />
      )}

      {tatamis.length > 0 && (
        <DndContext sensors={sensors}
          collisionDetection={(args) => {
            const pointer = pointerWithin(args)
            return pointer.length > 0 ? pointer : getFirstCollision([rectIntersection(args)])
          }}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-4 pb-4">
            {tatamis.map((tatami, idx) => (
              <TatamiColumna key={tatami.id} tatami={tatami} posicion={idx + 1}
                categorias={categorias} torneoEstado={torneo?.estado} torneoId={id} />
            ))}
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="px-3 py-2 bg-zinc-800 border border-rose-500/40 rounded-lg shadow-xl text-sm font-medium text-zinc-200 max-w-64 ring-1 ring-rose-500/20">
                {activeDrag.nombre}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {pendienteMover && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-overlay-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-modal-in">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Mover categoría</h3>
            <p className="text-zinc-400 text-sm mb-1">
              ¿Mover <strong className="text-zinc-200">{pendienteMover.categoriaNombre}</strong> a{' '}
              <strong className="text-zinc-200">{pendienteMover.tatamiDestinoNombre}</strong>?
            </p>
            <p className="text-xs text-zinc-600 mb-5">El movimiento quedará registrado en el historial.</p>
            <div className="flex gap-3">
              <button onClick={() => setPendienteMover(null)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmarMover}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors">
                Mover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
