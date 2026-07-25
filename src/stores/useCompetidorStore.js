import { create } from 'zustand'
import {
  fetchCompetidores, fetchCompetidorById,
  insertCompetidor, deleteCompetidor,
  fetchEquipos, insertEquipo, deleteEquipo,
  asignarLado, limpiarLadosCategoria,
} from '../lib/competidores'
import { insertInscripcion, deleteInscripcionByCC } from '../lib/inscripciones'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

const useCompetidorStore = create((set, get) => ({
  competidores: [],
  equipos: [],
  loading: false,
  error: null,

  fetchCompetidores: async (torneoId) => {
    set({ loading: true, error: null })
    try {
      const competidores = await fetchCompetidores(torneoId)
      set({ competidores, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Crea un único competidor con inscripción en una categoría
  addCompetidor: async (datos) => {
    set({ loading: true, error: null })
    try {
      const competidor = await insertCompetidor(datos)
      set((state) => ({ competidores: [...state.competidores, competidor], loading: false }))
      return competidor
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // Crea un único competidor inscrito en múltiples categorías a la vez
  addCompetidores: async (datosBase, categorias, inscripcionManual = false) => {
    set({ loading: true, error: null })
    try {
      const { categoria_id, ...personales } = datosBase
      const comp = await insertCompetidor({
        ...personales,
        inscripcion_manual: inscripcionManual,
      })

      for (const cat of categorias) {
        await insertInscripcion(comp.id, cat.id, datosBase.torneo_id)
      }

      const actualizado = await fetchCompetidorById(comp.id)
      set((state) => ({ competidores: [...state.competidores, actualizado], loading: false }))
      return [actualizado]
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // Quita a un competidor de una categoría eliminando su inscripcion
  quitarDeCategoria: async (competidorId, categoriaId) => {
    set({ error: null })
    try {
      await deleteInscripcionByCC(competidorId, categoriaId)
      set((state) => ({
        competidores: state.competidores.map((c) =>
          c.id !== competidorId ? c : {
            ...c,
            inscripciones: c.inscripciones.filter((i) => i.categoria_id !== categoriaId),
          }
        ),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  // Inscribe un competidor ya existente en una nueva categoría
  inscribirEnCategoria: async (competidorId, categoriaId, torneoId) => {
    set({ error: null })
    try {
      await insertInscripcion(competidorId, categoriaId, torneoId)
      const actualizado = await fetchCompetidorById(competidorId)
      set((state) => ({
        competidores: state.competidores.map((c) => c.id === competidorId ? actualizado : c),
      }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  removeCompetidor: async (id) => {
    set({ error: null })
    try {
      await deleteCompetidor(id)
      set((state) => ({ competidores: state.competidores.filter((c) => c.id !== id) }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  fetchEquipos: async (categoriaId) => {
    set({ loading: true, error: null })
    try {
      const equipos = await fetchEquipos(categoriaId)
      set({ equipos, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addEquipo: async (datos) => {
    set({ loading: true, error: null })
    try {
      const equipo = await insertEquipo(datos)
      set((state) => ({ equipos: [...state.equipos, equipo], loading: false }))
      return equipo
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  addEquiposAleatorios: async (competidoresCat, equiposCat, categoriaId) => {
    const asignados = new Set(
      equiposCat.flatMap((e) => [e.miembro_1_id, e.miembro_2_id, e.miembro_3_id])
    )
    const disponibles = shuffle(competidoresCat.filter((c) => !asignados.has(c.id)))

    const batches = []
    for (let i = 0; i + 2 < disponibles.length; i += 3) {
      batches.push(disponibles.slice(i, i + 3))
    }
    const excluidos = disponibles.length % 3

    set({ loading: true, error: null })
    try {
      const nuevos = []
      for (let i = 0; i < batches.length; i++) {
        const [m1, m2, m3] = batches[i]
        const equipo = await insertEquipo({
          categoria_id: categoriaId,
          nombre: `Equipo ${(equiposCat.length + i + 1)}`,
          club: null,
          miembro_1_id: m1.id,
          miembro_2_id: m2.id,
          miembro_3_id: m3.id,
        })
        nuevos.push(equipo)
      }
      set((state) => ({ equipos: [...state.equipos, ...nuevos], loading: false }))
      return { creados: nuevos.length, excluidos }
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  removeEquipo: async (id) => {
    set({ error: null })
    try {
      await deleteEquipo(id)
      set((state) => ({ equipos: state.equipos.filter((e) => e.id !== id) }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  asignarLadosAleatorio: async (competidoresCat) => {
    const mezclados = shuffle(competidoresCat)
    const mitad = Math.ceil(mezclados.length / 2)

    set({ loading: true, error: null })
    try {
      const actualizados = []
      for (let i = 0; i < mezclados.length; i++) {
        const lado = i < mitad ? 'aka' : 'ao'
        await asignarLado(mezclados[i].id, lado)
        actualizados.push({ id: mezclados[i].id, lado })
      }
      set((state) => ({
        competidores: state.competidores.map((c) => {
          const upd = actualizados.find((u) => u.id === c.id)
          return upd ? { ...c, lado: upd.lado } : c
        }),
        loading: false,
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  limpiarLados: async (categoriaId, competidoresCat) => {
    set({ loading: true, error: null })
    try {
      await limpiarLadosCategoria(categoriaId)
      const ids = new Set(competidoresCat.map((c) => c.id))
      set((state) => ({
        competidores: state.competidores.map((c) => ids.has(c.id) ? { ...c, lado: null } : c),
        loading: false,
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },
}))

export default useCompetidorStore
