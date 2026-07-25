import { create } from 'zustand'
import {
  aplicarPunto,
  deshacerUltimoPunto,
  tieneVentajaOcho,
  aplicarPenalizacion,
  calcularSenshu,
  determinarGanadorBout,
} from '../lib/scoring'
import { actualizarResultado } from '../lib/combates'
import { supabase } from '../lib/supabase'

function estadoInicial() {
  return {
    puntos_aka: 0,
    puntos_ao: 0,
    ippon_aka: 0,
    ippon_ao: 0,
    waza_ari_aka: 0,
    waza_ari_ao: 0,
    yuko_aka: 0,
    yuko_ao: 0,
    chui_aka: 0,
    chui_ao: 0,
    hansoku_chui_aka: 0,
    hansoku_chui_ao: 0,
    senshu: null,
    historial_aka: [],
    historial_ao: [],
    descalificado: undefined,
    descalificado_torneo: undefined,
    ganador_bout: undefined,
  }
}

const useMarcadorStore = create((set, get) => ({
  // Contexto del bout activo
  combate: null,
  categoria: null,
  competidores: { aka: null, ao: null },

  // Estado de puntuación (inmutable — se reemplaza en cada acción)
  scoring: estadoInicial(),

  // Cronómetro (solo en browser — no va a Supabase durante el bout)
  tiempoSegundos: 0,
  corriendo: false,
  _intervalId: null,

  // UI
  boutFinalizado: false,
  ganador: null,
  loading: false,
  error: null,

  // ── Carga inicial ─────────────────────────────────────────────────────────

  iniciar(combate, categoria, competidorAka, competidorAo, duracionSeg) {
    set({
      combate,
      categoria,
      competidores: { aka: competidorAka, ao: competidorAo },
      scoring: estadoInicial(),
      tiempoSegundos: duracionSeg,
      corriendo: false,
      boutFinalizado: false,
      ganador: null,
      error: null,
    })
  },

  resetear() {
    const { _intervalId } = get()
    if (_intervalId) clearInterval(_intervalId)
    set({ scoring: estadoInicial(), boutFinalizado: false, ganador: null, corriendo: false, _intervalId: null })
  },

  // ── Puntuación ────────────────────────────────────────────────────────────

  marcarPunto(atleta, tipo) {
    const nuevoScoring = aplicarPunto(get().scoring, atleta, tipo)
    set({ scoring: nuevoScoring })
    get()._verificarVictoriaInmediata(nuevoScoring)
  },

  deshacerPunto(atleta) {
    set({ scoring: deshacerUltimoPunto(get().scoring, atleta) })
  },

  // ── Penalizaciones ────────────────────────────────────────────────────────

  penalizar(atleta, tipo) {
    const nuevoScoring = aplicarPenalizacion(get().scoring, atleta, tipo)
    set({ scoring: nuevoScoring })
    // HANSOKU y SHIKKAKU finalizan el bout
    if (nuevoScoring.ganador_bout) {
      get()._finalizarBout(nuevoScoring.ganador_bout)
    }
  },

  // ── SENSHU ────────────────────────────────────────────────────────────────

  setSenshu(atleta) {
    set((s) => ({ scoring: { ...s.scoring, senshu: atleta } }))
  },

  anularSenshu() {
    set((s) => ({ scoring: { ...s.scoring, senshu: null } }))
  },

  // ── Cronómetro ────────────────────────────────────────────────────────────

  iniciarCronometro() {
    if (get().corriendo) return
    const id = setInterval(() => {
      set((s) => {
        if (s.tiempoSegundos <= 0) {
          clearInterval(id)
          s._finalizarPorTiempo()
          return { corriendo: false, _intervalId: null }
        }
        return { tiempoSegundos: s.tiempoSegundos - 1 }
      })
    }, 1000)
    set({ corriendo: true, _intervalId: id })
  },

  pausarCronometro() {
    const { _intervalId } = get()
    if (_intervalId) clearInterval(_intervalId)
    set({ corriendo: false, _intervalId: null })
  },

  resetearCronometro(duracionSeg) {
    const { _intervalId } = get()
    if (_intervalId) clearInterval(_intervalId)
    set({ tiempoSegundos: duracionSeg, corriendo: false, _intervalId: null })
  },

  // ── Finalización ─────────────────────────────────────────────────────────

  _verificarVictoriaInmediata(scoring) {
    if (tieneVentajaOcho(scoring)) {
      const ganador = scoring.puntos_aka > scoring.puntos_ao ? 'aka' : 'ao'
      get()._finalizarBout(ganador)
    }
  },

  _finalizarPorTiempo() {
    const ganador = determinarGanadorBout(get().scoring)
    get()._finalizarBout(ganador)
  },

  _finalizarBout(ganador) {
    const { _intervalId } = get()
    if (_intervalId) clearInterval(_intervalId)
    set({ boutFinalizado: true, ganador, corriendo: false, _intervalId: null })
  },

  async confirmarResultado() {
    const { combate, scoring, ganador } = get()
    if (!combate) return
    set({ loading: true, error: null })
    try {
      await actualizarResultado(combate.id, {
        puntos_rojo: scoring.puntos_aka,
        puntos_azul: scoring.puntos_ao,
        ganador_id: ganador === 'aka' ? combate.competidor_rojo_id : combate.competidor_azul_id,
        estado: 'finalizado',
      })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ── Realtime sync para TV display ─────────────────────────────────────────

  suscribirTV(combateId, onUpdate) {
    const canal = supabase
      .channel(`combate-${combateId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'combate', filter: `id=eq.${combateId}` }, onUpdate)
      .subscribe()
    return () => supabase.removeChannel(canal)
  },
}))

export default useMarcadorStore
