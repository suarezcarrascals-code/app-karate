import { create } from 'zustand'
import { fetchTorneos, insertTorneo, uploadLogo, cambiarEstadoTorneo, deleteTorneo } from '../lib/torneos'

const useTorneoStore = create((set) => ({
  torneos: [],
  loading: false,
  error: null,

  fetchTorneos: async () => {
    set({ loading: true, error: null })
    try {
      const torneos = await fetchTorneos()
      set({ torneos, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addTorneo: async ({ nombre, fecha_inicio, fecha_fin, lugar, logo }) => {
    set({ loading: true, error: null })
    try {
      const torneo = await insertTorneo({ nombre, fecha_inicio, fecha_fin, lugar, logo_url: null })
      let resultado = torneo
      if (logo) {
        const logo_url = await uploadLogo(logo, torneo.id)
        resultado = { ...torneo, logo_url }
      }
      set((state) => ({ torneos: [resultado, ...state.torneos], loading: false }))
      return resultado
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  activarTorneo: async (id) => {
    set({ loading: true, error: null })
    try {
      const torneo = await cambiarEstadoTorneo(id, 'inscripciones')
      set((state) => ({
        torneos: state.torneos.map((t) => (t.id === id ? torneo : t)),
        loading: false,
      }))
      return torneo
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  removeTorneo: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteTorneo(id)
      set((state) => ({ torneos: state.torneos.filter((t) => t.id !== id), loading: false }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

export default useTorneoStore
