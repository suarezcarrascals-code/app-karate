import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { verificarCategoriasEnTatami } from '../../lib/tatamis'
import useTatamiStore from '../../stores/useTatamiStore'

function SortableCategoria({ cat }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'bg-blue-50 shadow-md ring-1 ring-blue-200 z-10 relative' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="text-gray-300 text-base">⠿</span>
      <span className="w-5 text-center text-xs font-bold text-gray-400 shrink-0">
        {cat.orden_en_tatami}
      </span>
      <span className="text-gray-700 truncate">{cat.nombre}</span>
    </div>
  )
}

export default function TatamiCard({ tatami, posicion, torneoEstado, categorias = [], onReordenar }) {
  const [modal, setModal] = useState(null)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(tatami.nombre)
  const [arbitro, setArbitro] = useState(tatami.arbitro_nombre || '')
  const [errorNombre, setErrorNombre] = useState(null)

  const removeTatami = useTatamiStore((s) => s.removeTatami)
  const editTatami = useTatamiStore((s) => s.editTatami)
  const bloqueado = torneoEstado === 'en_curso' || torneoEstado === 'finalizado'

  const cats = categorias
    .filter((c) => c.tatami_id === tatami.id && c.orden_en_tatami != null)
    .sort((a, b) => a.orden_en_tatami - b.orden_en_tatami)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = cats.findIndex((c) => c.id === active.id)
    const newIndex = cats.findIndex((c) => c.id === over.id)
    const nuevaLista = arrayMove(cats, oldIndex, newIndex)
    onReordenar(tatami.id, nuevaLista)
  }

  async function handleEliminarClick() {
    const count = await verificarCategoriasEnTatami(tatami.id)
    if (count > 0) setModal('bloqueado')
    else setModal('confirmar')
  }

  async function handleConfirmar() {
    await removeTatami(tatami.id)
    setModal(null)
  }

  function handleEditarClick() {
    setNombre(tatami.nombre)
    setArbitro(tatami.arbitro_nombre || '')
    setErrorNombre(null)
    setEditando(true)
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return }
    try {
      await editTatami(tatami.id, { nombre: nombre.trim(), arbitro: arbitro.trim() || null })
      setEditando(false)
    } catch {
      // error en el store
    }
  }

  if (editando) {
    return (
      <form onSubmit={handleGuardar} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <input
              type="text" value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrorNombre(null) }}
              placeholder="Nombre del tatami"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errorNombre && <p className="text-red-600 text-xs mt-1">{errorNombre}</p>}
          </div>
          <input
            type="text" value={arbitro}
            onChange={(e) => setArbitro(e.target.value)}
            placeholder="Árbitro (opcional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">Guardar</button>
          <button type="button" onClick={() => setEditando(false)} className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100">Cancelar</button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
            {posicion}
          </span>
          <div>
            <p className="font-medium text-gray-900">{tatami.nombre}</p>
            <p className="text-xs text-gray-500">{tatami.arbitro_nombre || 'Sin árbitro asignado'}</p>
          </div>
        </div>

        {!bloqueado && (
          <div className="flex items-center gap-3">
            <button onClick={handleEditarClick} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Editar</button>
            <button onClick={handleEliminarClick} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3">
        {cats.length === 0 ? (
          <p className="text-xs text-gray-400">Sin categorías asignadas</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {cats.map((cat) => (
                  <SortableCategoria key={cat.id} cat={cat} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {modal === 'confirmar' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Eliminar {tatami.nombre}</h3>
            <p className="text-gray-600 text-sm mb-4">Esta acción es irreversible. ¿Confirmás que querés eliminar este tatami?</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">Cancelar</button>
              <button onClick={handleConfirmar} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'bloqueado' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">No se puede eliminar</h3>
            <p className="text-gray-600 text-sm mb-4">Este tatami tiene categorías asignadas. Primero eliminá las categorías del tatami.</p>
            <button onClick={() => setModal(null)} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
