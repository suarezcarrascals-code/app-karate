import { create } from 'zustand'
import { fetchDojos, insertDojo, deleteDojo } from '../lib/dojos'

const useDojoStore = create((set) => ({
  dojos: [],
  loading: false,
  error: null,

  fetchDojos: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const dojos = await fetchDojos(torneoId)
      set({ dojos, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addDojo: async (datos) => {
    set({ loading: true, error: null })
    try {
      const dojo = await insertDojo(datos)
      set((state) => ({ dojos: [...state.dojos, dojo], loading: false }))
      return dojo
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  removeDojo: async (id) => {
    set({ error: null })
    try {
      await deleteDojo(id)
      set((state) => ({ dojos: state.dojos.filter((d) => d.id !== id) }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

export default useDojoStore
