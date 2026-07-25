import { create } from 'zustand'
import { fetchLinks, generarLink, desactivarLink } from '../lib/links'
import { supabase } from '../lib/supabase'

const useLinkStore = create((set, get) => ({
  links: [],
  loading: false,
  error: null,
  _canal: null,

  fetchLinks: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const links = await fetchLinks(torneoId)
      set({ links, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  generarLink: async (torneoId, dojoId, limiteAtletas) => {
    set({ loading: true, error: null })
    try {
      const link = await generarLink(torneoId, dojoId, limiteAtletas)
      set((s) => ({
        // Reemplazar link anterior del mismo dojo si existe
        links: [
          ...s.links.filter((l) => l.dojo_id !== dojoId),
          { ...link, _count: 0 },
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
      await desactivarLink(linkId)
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

  // Incrementa el contador local de un link cuando llega un evento Realtime
  incrementarContador: (linkId) => {
    set((s) => ({
      links: s.links.map((l) =>
        l.id === linkId ? { ...l, _count: (l._count ?? 0) + 1 } : l
      ),
    }))
  },

  // Suscribirse a inserciones de competidores del torneo para actualizar contadores
  suscribirRealtime: (torneoId) => {
    const { _canal } = get()
    if (_canal) return // ya suscrito

    const canal = supabase
      .channel(`inscripciones-torneo-${torneoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'competidor', filter: `torneo_id=eq.${torneoId}` },
        (payload) => {
          const linkId = payload.new?.link_inscripcion_id
          if (linkId) get().incrementarContador(linkId)
        }
      )
      .subscribe()

    set({ _canal: canal })
  },

  desuscribir: () => {
    const { _canal } = get()
    if (_canal) supabase.removeChannel(_canal)
    set({ _canal: null })
  },
}))

export default useLinkStore
