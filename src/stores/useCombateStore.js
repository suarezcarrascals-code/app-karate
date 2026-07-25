import { create } from 'zustand'
import { fetchCombates, persistirBracket, actualizarResultado, eliminarCombatesCategoria } from '../lib/combates'

const useCombateStore = create((set, get) => ({
  combates: [],
  loading: false,
  error: null,

  fetchCombates: async (categoriaId) => {
    set({ loading: true, error: null })
    try {
      const combates = await fetchCombates(categoriaId)
      set({ combates, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  generarBracket: async (categoriaId, tatamiId, competidores) => {
    set({ loading: true, error: null })
    try {
      const combates = await persistirBracket(categoriaId, tatamiId, competidores)
      set({ combates, loading: false })
      return combates
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  resetBracket: async (categoriaId) => {
    set({ loading: true, error: null })
    try {
      await eliminarCombatesCategoria(categoriaId)
      set({ combates: [], loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

export default useCombateStore
