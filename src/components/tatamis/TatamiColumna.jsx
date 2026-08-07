import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical, Link } from '@phosphor-icons/react'
import { verificarCategoriasEnTatami } from '../../lib/tatamis'
import { generarLinkMesa } from '../../lib/linksMesa'
import useTatamiStore from '../../stores/useTatamiStore'

const MODALIDAD_LABEL = {
  kumite_individual: 'Kumite Ind.',
  kumite_equipo: 'Kumite Eq.',
  kata_individual: 'Kata Ind.',
  kata_equipo: 'Kata Eq.',
}

const MODALIDAD_COLOR = {
  kumite_individual: 'text-amber-400',
  kumite_equipo: 'text-orange-400',
  kata_individual: 'text-sky-400',
  kata_equipo: 'text-cyan-400',
}

function CategoriaItemColumna({ cat }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
    data: { tatamiId: cat.tatami_id },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition: isDragging ? 'none' : transition }}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border select-none ${
        isDragging
          ? 'opacity-0'
          : 'bg-zinc-800/70 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800'
      }`}
      {...attributes}
    >
      <div {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0">
        <DotsSixVertical size={14} />
      </div>
      <span className="w-5 text-center text-xs font-bold text-zinc-600 shrink-0 tabular-nums">
        {cat.orden_en_tatami ?? '-'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-snug">{cat.nombre}</p>
        <span className={`text-xs font-medium ${MODALIDAD_COLOR[cat.modalidad] || 'text-zinc-500'}`}>
          {MODALIDAD_LABEL[cat.modalidad] || cat.modalidad}
        </span>
      </div>
    </div>
  )
}

export default function TatamiColumna({ tatami, posicion, categorias, torneoEstado, torneoId }) {
  const [editando, setEditando] = useState(false)
  const [modal, setModal] = useState(null)
  const [nombre, setNombre] = useState(tatami.nombre)
  const [arbitro, setArbitro] = useState(tatami.arbitro_nombre || '')
  const [errorNombre, setErrorNombre] = useState(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [generandoLink, setGenerandoLink] = useState(false)

  const removeTatami = useTatamiStore((s) => s.removeTatami)
  const editTatami = useTatamiStore((s) => s.editTatami)
  const bloqueado = torneoEstado === 'en_curso' || torneoEstado === 'finalizado'

  async function handleLinkMesa() {
    setGenerandoLink(true)
    try {
      const linkData = await generarLinkMesa(torneoId, tatami.id)
      if (!linkData?.token) throw new Error('El link no tiene token. Revisá que la tabla link_mesa tenga un token generado por defecto.')
      const url = `${window.location.origin}/mesa/${linkData.token}`
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        prompt('Copiá este link manualmente:', url)
      }
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    } catch (err) {
      alert(`Error al generar link de mesa: ${err.message}`)
    } finally {
      setGenerandoLink(false)
    }
  }

  const cats = categorias
    .filter((c) => c.tatami_id === tatami.id)
    .sort((a, b) => (a.orden_en_tatami ?? 999) - (b.orden_en_tatami ?? 999))

  const { setNodeRef, isOver } = useDroppable({ id: tatami.id, data: { tatamiId: tatami.id } })

  async function handleEliminarClick() {
    const count = await verificarCategoriasEnTatami(tatami.id)
    setModal(count > 0 ? 'bloqueado' : 'confirmar')
  }

  async function handleConfirmar() {
    await removeTatami(tatami.id)
    setModal(null)
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!nombre.trim()) { setErrorNombre('Obligatorio'); return }
    try {
      await editTatami(tatami.id, { nombre: nombre.trim(), arbitro: arbitro.trim() || null })
      setEditando(false)
    } catch { /* error en store */ }
  }

  return (
    <div className="flex flex-col w-full md:w-80 md:flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        {editando ? (
          <form onSubmit={handleGuardar} className="space-y-2">
            <div>
              <input type="text" value={nombre}
                onChange={(e) => { setNombre(e.target.value); setErrorNombre(null) }}
                placeholder="Nombre del tatami"
                className="w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600" />
              {errorNombre && <p className="text-rose-400 text-xs mt-1">{errorNombre}</p>}
            </div>
            <input type="text" value={arbitro}
              onChange={(e) => setArbitro(e.target.value)}
              placeholder="Árbitro (opcional)"
              className="w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600" />
            <div className="flex gap-2">
              <button type="submit"
                className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-rose-500 transition-colors">
                Guardar
              </button>
              <button type="button" onClick={() => setEditando(false)}
                className="text-zinc-400 px-3 py-1 rounded-lg text-xs hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-rose-950/50 border border-rose-900/30 text-rose-400 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                {posicion}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 text-sm truncate">{tatami.nombre}</p>
                <p className="text-xs text-zinc-600 truncate">{tatami.arbitro_nombre || 'Sin árbitro'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {torneoEstado === 'en_curso' && (
                <button
                  onClick={handleLinkMesa}
                  disabled={generandoLink}
                  title="Copiar link de mesa técnica"
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                    linkCopiado
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  <Link size={11} />
                  {linkCopiado ? 'Copiado' : 'Link mesa'}
                </button>
              )}
              {!bloqueado && (
                <>
                  <button onClick={() => { setNombre(tatami.nombre); setArbitro(tatami.arbitro_nombre || ''); setEditando(true) }}
                    className="text-xs text-zinc-500 hover:text-zinc-200 font-medium transition-colors">
                    Editar
                  </button>
                  <button onClick={handleEliminarClick}
                    className="text-xs text-zinc-600 hover:text-rose-400 font-medium transition-colors">
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef}
        className={`flex-1 p-2 min-h-28 transition-colors ${isOver ? 'bg-rose-950/20' : 'bg-zinc-950/20'}`}>
        <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {cats.map((cat) => <CategoriaItemColumna key={cat.id} cat={cat} />)}
          </div>
        </SortableContext>
        {cats.length === 0 && (
          <p className="text-xs text-zinc-700 text-center py-6">
            {isOver ? 'Soltar aquí' : 'Sin categorías'}
          </p>
        )}
        {cats.length > 0 && isOver && (
          <p className="text-xs text-rose-500 text-center mt-2">Soltar aquí</p>
        )}
      </div>

      {modal === 'confirmar' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">Eliminar {tatami.nombre}</h3>
            <p className="text-zinc-400 text-sm mb-5">Esta acción es irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">Cancelar</button>
              <button onClick={handleConfirmar}
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-500 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'bloqueado' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 text-base mb-2">No se puede eliminar</h3>
            <p className="text-zinc-400 text-sm mb-5">Este tatami tiene categorías asignadas. Movelas a otro tatami primero.</p>
            <button onClick={() => setModal(null)}
              className="w-full bg-zinc-800 text-zinc-200 py-2.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
