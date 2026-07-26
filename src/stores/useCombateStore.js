import { create } from 'zustand'
import {
  fetchCombates,
  persistirBracket,
  eliminarCombatesCategoria,
  avanzarGanador,
} from '../lib/combates'

const useCombateStore = create((set) => ({
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

  declararGanador: async (combateId, ganadorId, categoriaId) => {
    set({ loading: true, error: null })
    try {
      await avanzarGanador(combateId, ganadorId, categoriaId)
      const combates = await fetchCombates(categoriaId)
      set({ combates, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

export default useCombateStore
