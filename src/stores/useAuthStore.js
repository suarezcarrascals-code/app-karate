import { create } from 'zustand'
import { signIn, signUp, signOut, fetchProfile } from '../lib/auth'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // Inicializar sesión al montar la app
  init: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        set({ user: session.user, profile, loading: false })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    } catch {
      set({ user: null, profile: null, loading: false })
    }

    // Escuchar cambios de sesión
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id)
          set({ user: session.user, profile })
        } catch {
          set({ user: session.user, profile: null })
        }
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { user } = await signIn(email, password)
      const profile = await fetchProfile(user.id)
      set({ user, profile, loading: false })
      return profile
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  signUp: async (email, password, nombre) => {
    set({ loading: true, error: null })
    try {
      const { user } = await signUp(email, password, nombre)
      set({ user, profile: null, loading: false })
      return user
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  signOut: async () => {
    try {
      await signOut()
      set({ user: null, profile: null })
    } catch (err) {
      set({ error: err.message })
    }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
