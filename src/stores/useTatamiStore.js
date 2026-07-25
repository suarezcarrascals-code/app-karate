import { create } from 'zustand'
import { fetchTatamis, insertTatami, updateTatami, deleteTatami, calcularOrden } from '../lib/tatamis'

const useTatamiStore = create((set, get) => ({
  tatamis: [],
  loading: false,
  error: null,

  fetchTatamis: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const tatamis = await fetchTatamis(torneoId)
      set({ tatamis, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addTatami: async ({ torneo_id, nombre, arbitro }) => {
    set({ loading: true, error: null })
    try {
      const orden = calcularOrden(get().tatamis)
      const tatami = await insertTatami({ torneo_id, nombre, orden, arbitro })
      set((state) => ({ tatamis: [...state.tatamis, tatami], loading: false }))
      return tatami
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  editTatami: async (id, campos) => {
    set({ error: null })
    try {
      const tatami = await updateTatami(id, campos)
      set((state) => ({
        tatamis: state.tatamis.map((t) => (t.id === id ? tatami : t)),
      }))
      return tatami
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  removeTatami: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteTatami(id)
      set((state) => ({ tatamis: state.tatamis.filter((t) => t.id !== id), loading: false }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

export default useTatamiStore
