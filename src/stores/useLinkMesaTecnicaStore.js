import { create } from 'zustand'
import {
  fetchLinksMesaTecnica,
  generarLinkMesaTecnica,
  desactivarLinkMesaTecnica,
} from '../lib/linksMesaTecnica'

const useLinkMesaTecnicaStore = create((set) => ({
  links: [],
  loading: false,
  error: null,

  fetchLinks: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const links = await fetchLinksMesaTecnica(torneoId)
      set({ links, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  generarLink: async (torneoId, tatamiId) => {
    set({ loading: true, error: null })
    try {
      const link = await generarLinkMesaTecnica(torneoId, tatamiId)
      set((s) => ({
        links: [
          ...s.links.filter((l) => l.tatami_id !== tatamiId),
          link,
        ],
        loading: false,
      }))
      return link
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  desactivarLink: async (linkId) => {
    set({ error: null })
    try {
      await desactivarLinkMesaTecnica(linkId)
      set((s) => ({
        links: s.links.map((l) =>
          l.id === linkId ? { ...l, estado: 'inactivo' } : l
        ),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

export default useLinkMesaTecnicaStore
