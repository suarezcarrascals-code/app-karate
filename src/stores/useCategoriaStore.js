import { create } from 'zustand'
import { fetchCategorias, insertCategoria, insertCategoriasBulk, asignarTatami, asignarTatamiLote, actualizarOrdenesEnTatami, cerrarInscripciones, deleteCategoria } from '../lib/categorias'

const useCategoriaStore = create((set) => ({
  categorias: [],
  loading: false,
  error: null,

  fetchCategorias: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const categorias = await fetchCategorias(torneoId)
      set({ categorias, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addCategoria: async (datos) => {
    set({ loading: true, error: null })
    try {
      const categoria = await insertCategoria(datos)
      set((state) => ({ categorias: [...state.categorias, categoria], loading: false }))
      return categoria
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  reordenarEnTatami: async (tatamiId, nuevaLista) => {
    // nuevaLista: array de categorías ya en el nuevo orden
    const items = nuevaLista.map((cat, idx) => ({ id: cat.id, orden_en_tatami: idx + 1 }))
    // optimistic update
    set((state) => ({
      categorias: state.categorias.map((c) => {
        const item = items.find((i) => i.id === c.id)
        return item ? { ...c, orden_en_tatami: item.orden_en_tatami } : c
      }),
    }))
    try {
      await actualizarOrdenesEnTatami(items)
    } catch (err) {
      set({ error: err.message })
    }
  },

  cerrarInscripciones: async (categoriaId) => {
    set({ loading: true, error: null })
    try {
      const updated = await cerrarInscripciones(categoriaId)
      set((state) => ({
        categorias: state.categorias.map((c) => (c.id === categoriaId ? { ...c, ...updated } : c)),
        loading: false,
      }))
      return updated
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  addCategoriasBulk: async (torneoId, categorias) => {
    set({ loading: true, error: null })
    try {
      const nuevas = await insertCategoriasBulk(torneoId, categorias)
      set((state) => ({ categorias: [...state.categorias, ...nuevas], loading: false }))
      return nuevas
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  removeCategoria: async (categoriaId) => {
    set({ loading: true, error: null })
    try {
      await deleteCategoria(categoriaId)
      set((state) => ({
        categorias: state.categorias.filter((c) => c.id !== categoriaId),
        loading: false,
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  asignarTatamiLote: async (tatamiId, items) => {
    set({ loading: true, error: null })
    try {
      const actualizadas = await asignarTatamiLote(tatamiId, items)
      const map = Object.fromEntries(actualizadas.map((c) => [c.id, c]))
      set((state) => ({
        categorias: state.categorias.map((c) => map[c.id] ? { ...c, ...map[c.id] } : c),
        loading: false,
      }))
      return actualizadas
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  asignarTatami: async (categoriaId, tatamiId, orden, tatamiAnteriorId, motivo) => {
    set({ loading: true, error: null })
    try {
      const updated = await asignarTatami(categoriaId, tatamiId, orden, tatamiAnteriorId, motivo)
      set((state) => ({
        categorias: state.categorias.map((c) => (c.id === categoriaId ? { ...c, ...updated } : c)),
        loading: false,
      }))
      return updated
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

export default useCategoriaStore
