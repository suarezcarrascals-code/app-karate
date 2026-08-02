# Implementation Plan: Marcador Kata Individual para Mesa Técnica

**Branch**: `008-marcador-kata-individual` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-marcador-kata-individual/spec.md`

---

## Summary

La mesa técnica necesita un panel dedicado para operar bouts de kata individual: ingresa los puntajes de los 5 jueces para AKA y AO por separado, el sistema calcula votos por mayoría y declara ganador. Extiende el patrón de `MesaKumitePage` hacia una nueva ruta `/kata`. Requiere: (1) funciones EDD en `scoring.js`, (2) migración SQL con 12 columnas en `combate`, (3) `MesaKataPage.jsx` para el panel de control, (4) `MesaKataTVPage.jsx` para el proyector, y (5) actualización de routing en `MesaBracketPage`.

---

## Technical Context

**Language/Version**: JavaScript (React 19 + Vite 8)

**Primary Dependencies**: Supabase JS v2, React Router 7, Tailwind CSS 4, @phosphor-icons/react

**Storage**: Supabase PostgreSQL — extensión de tabla `combate` con 12 columnas kata

**Testing**: Vitest — EDD obligatorio para `calcularVotosJuez`, `determinarGanadorKataBout`, `validarKataPermitido`

**Target Platform**: Desktop (panel de control); proyector/TV (vista pública)

**Performance Goals**: TV polling 500ms. Cálculo de votos < 500ms tras confirmar último puntaje.

**Constraints**: 5 jueces fijo (v1). Puntajes 5.0–10.0 step 0.1, ó 0.0 para DQ. Sin empates por juez.

**Scale/Scope**: Torneos locales Santander — < 10 tatamis simultáneos.

---

## Constitution Check

- **EDD `src/lib/`**: `calcularVotosJuez`, `determinarGanadorKataBout`, `validarKataPermitido` — tests se escriben **antes** de la implementación. ✅ Obligatorio por CLAUDE.md.
- **Aritmética en scoring.js**: Toda lógica de votos kata va en `scoring.js`. Cero cálculos en componentes ni DB triggers. ✅
- **Jerarquía Torneo → Tatami → Categoría → Combate**: Rutas anidadas `/mesa/:token/categoria/:catId/combate/:combateId/kata`. ✅
- **Estado global Zustand**: No se necesita store nuevo — estado local en la página (mismo patrón que `MesaKumitePage`). ✅
- **Supabase RLS**: Las mismas políticas de `combate` aplican — la página es pública (sin AuthGuard), el acceso está controlado por el token del link. ✅

---

## Project Structure

### Documentation (this feature)

```text
specs/008-marcador-kata-individual/
├── plan.md              ← este archivo
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── supabase-schema.md
└── tasks.md             ← generado por /speckit-tasks
```

### Source Code

```text
src/
  lib/
    scoring.js            ← EXTEND: agregar calcularVotosJuez, determinarGanadorKataBout, validarKataPermitido
    scoring.test.js       ← EXTEND: tests EDD (tests primero, implementación después)
  pages/
    mesa/
      MesaKataPage.jsx    ← NUEVO: panel de control kata individual
      MesaKataTVPage.jsx  ← NUEVO: TV display kata individual
      MesaBracketPage.jsx ← UPDATE: detectar modalidad kata → navegar a /kata
  App.jsx                 ← UPDATE: 2 rutas nuevas (/kata y /kata-tv)
```

---

## Phase 1: Tests EDD — scoring.js (PRIMERO, antes de cualquier implementación)

### 1a. Agregar tests en `src/lib/scoring.test.js`

Los casos kata están especificados en CLAUDE.md (sección EDD). Agregar al archivo existente:

```js
describe('calcularVotosJuez', () => {
  it('el juez vota por quien le dio mayor puntaje', () => {
    expect(calcularVotosJuez({ aka: 8.5, ao: 8.0 })).toBe('aka')
  })
  it('el juez vota por ao cuando ao tiene mayor puntaje', () => {
    expect(calcularVotosJuez({ aka: 7.9, ao: 8.1 })).toBe('ao')
  })
  it('lanza error si los puntajes son iguales', () => {
    expect(() => calcularVotosJuez({ aka: 8.0, ao: 8.0 })).toThrow()
  })
})

describe('determinarGanadorKataBout', () => {
  it('gana quien tenga mayoría de votos — 4 vs 3 con 7 jueces', () => {
    expect(determinarGanadorKataBout(['aka','aka','aka','aka','ao','ao','ao'])).toBe('aka')
  })
  it('gana quien tenga mayoría de votos — 3 vs 2 con 5 jueces', () => {
    expect(determinarGanadorKataBout(['ao','ao','ao','aka','aka'])).toBe('ao')
  })
  it('lanza error si el array de votos está vacío', () => {
    expect(() => determinarGanadorKataBout([])).toThrow()
  })
  it('lanza error si hay número par de votos', () => {
    expect(() => determinarGanadorKataBout(['aka','ao','aka','ao'])).toThrow()
  })
})

describe('validarKataPermitido', () => {
  it('permite kata diferente al anterior', () => {
    expect(validarKataPermitido('Kanku Dai', ['Heian Shodan', 'Bassai Dai'])).toBe(true)
  })
  it('rechaza kata igual al inmediatamente anterior', () => {
    expect(validarKataPermitido('Bassai Dai', ['Heian Shodan', 'Bassai Dai'])).toBe(false)
  })
  it('rechaza kata que ya se usó 2 veces', () => {
    expect(validarKataPermitido('Bassai Dai', ['Bassai Dai', 'Heian Shodan', 'Bassai Dai'])).toBe(false)
  })
  it('permite kata que se usó 1 vez si no es el último', () => {
    expect(validarKataPermitido('Bassai Dai', ['Bassai Dai', 'Heian Shodan', 'Kanku Dai'])).toBe(true)
  })
})
```

### 1b. Ejecutar tests → deben FALLAR (red)

```bash
npm run test -- --run src/lib/scoring.test.js
```

### 1c. Implementar en `src/lib/scoring.js`

```js
export function calcularVotosJuez({ aka, ao }) {
  if (aka === ao) throw new Error('Empate de puntajes por juez no está permitido')
  return aka > ao ? 'aka' : 'ao'
}

export function determinarGanadorKataBout(votos) {
  if (!votos || votos.length === 0) throw new Error('Array de votos vacío')
  if (votos.length % 2 === 0) throw new Error('Número par de votos — no puede haber empate')
  const aka = votos.filter(v => v === 'aka').length
  const ao  = votos.filter(v => v === 'ao').length
  return aka > ao ? 'aka' : 'ao'
}

export function validarKataPermitido(kata, historial) {
  if (!kata || !historial || historial.length === 0) return true
  if (historial[historial.length - 1] === kata) return false
  if (historial.filter(k => k === kata).length >= 2) return false
  return true
}
```

### 1d. Re-ejecutar tests → deben pasar (green)

---

## Phase 2: Migración SQL

Ejecutar en Supabase SQL Editor (ver [contracts/supabase-schema.md](contracts/supabase-schema.md)):

```sql
ALTER TABLE combate
  ADD COLUMN IF NOT EXISTS kata_anunciado_rojo  TEXT,
  ADD COLUMN IF NOT EXISTS kata_anunciado_azul  TEXT,
  ADD COLUMN IF NOT EXISTS j1_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j2_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j3_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j4_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j5_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j1_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j2_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j3_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j4_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j5_azul  DECIMAL(4,1);
```

Sin cambios de RLS — las políticas existentes de `combate` cubren columnas nuevas automáticamente.

---

## Phase 3: App.jsx — Rutas nuevas

Agregar en `src/App.jsx` (junto a la ruta `/tv` existente):

```jsx
import MesaKataPage    from './pages/mesa/MesaKataPage'
import MesaKataTVPage  from './pages/mesa/MesaKataTVPage'

// Dentro de <Routes> (rutas mesa técnica):
<Route path="/mesa/:token/categoria/:catId/combate/:combateId/kata"    element={<MesaKataPage />} />
<Route path="/mesa/:token/categoria/:catId/combate/:combateId/kata-tv" element={<MesaKataTVPage />} />
```

---

## Phase 4: MesaBracketPage — detectar modalidad kata

En `src/pages/mesa/MesaBracketPage.jsx`, dentro de `CombateRow`, actualizar la navegación:

```js
// categoria viene del state del componente padre (MesaBracketPage)
const esKata = ['kata_individual', 'kata_equipo'].includes(categoria?.modalidad)

// Ruta del combate:
const rutaOperar = `/mesa/${token}/categoria/${catId}/combate/${combate.id}${esKata ? '/kata' : ''}`

// En el botón "Operar":
onClick={() => navigate(rutaOperar)}
```

Botón TV en el header también varía:

```js
// Header existente:
onClick={() => window.open(`/mesa/${token}/categoria/${catId}/tv`, '_blank')}

// Actualizar para kata:
const rutaTV = esKata
  ? `/mesa/${token}/categoria/${catId}/combate/${combateEnCurso?.id}/kata-tv`
  : `/mesa/${token}/categoria/${catId}/tv`
onClick={() => window.open(rutaTV, '_blank')}
```

---

## Phase 5: MesaKataPage.jsx — Panel de control

### Máquina de estados

```
'anuncio' → 'rojo_performance' → 'azul_performance' → 'resultado'
```

### Recuperación de fase al cargar (desde DB)

```js
if (combateData.estado === 'finalizado') setFase('resultado')
else if (combateData.j1_rojo !== null)   setFase('azul_performance')
else                                      setFase('anuncio')
```

### UI por fase

**anuncio**: Cronómetro 35s · inputs kata AKA y AO · warnings repetición · botón iniciar performance

**rojo_performance**: 5 inputs J1–J5 (number, min=5.0, max=10.0, step=0.1) + botón DQ (0.0, con modal) + botón confirmar

**azul_performance**: Resumen bloqueado de puntajes AKA + 5 inputs J1–J5 AO + botón confirmar

**resultado**: Tabla de votos por juez · total votos · ganador resaltado · botón "Finalizar bout"

**Siempre disponible**: botones "KIKEN AKA" y "KIKEN AO" (fases anuncio y performances)

### Guardar puntajes AKA

```js
await supabase.from('combate').update({
  estado: 'en_curso',
  kata_anunciado_rojo: kataRojo,
  j1_rojo: scoresRojo.j1, j2_rojo: scoresRojo.j2, j3_rojo: scoresRojo.j3,
  j4_rojo: scoresRojo.j4, j5_rojo: scoresRojo.j5,
}).eq('id', combate.id)
```

### Guardar puntajes AO + validar empates + calcular resultado

```js
const KEYS = ['j1','j2','j3','j4','j5']
const conflictos = KEYS.filter(k => scoresRojo[k] === scoresAzul[k])
if (conflictos.length > 0) { setErrorEmpate(...); return }

await supabase.from('combate').update({
  kata_anunciado_azul: kataAzul,
  j1_azul: scoresAzul.j1, ..., j5_azul: scoresAzul.j5,
}).eq('id', combate.id)

const votos = KEYS.map(k => calcularVotosJuez({ aka: scoresRojo[k], ao: scoresAzul[k] }))
const ganador = determinarGanadorKataBout(votos)
setResultado({ votos, ganador })
setFase('resultado')
```

### Finalizar bout

```js
const ganadorId = resultado.ganador === 'aka'
  ? combate.competidor_rojo_id
  : combate.competidor_azul_id
await supabase.from('combate').update({
  estado: 'finalizado',
  ganador_id: ganadorId,
}).eq('id', combate.id)
navigate(`/mesa/${token}/categoria/${catId}`)
```

---

## Phase 6: MesaKataTVPage.jsx — TV display

Ruta: `/mesa/:token/categoria/:catId/combate/:combateId/kata-tv`

Polling cada 500ms (mismo patrón que `MesaTVPage`).

### Layout

```
[Header: torneo · tatami · categoría · ronda]

[AO — izquierda, bg-sky-600]    [AKA — derecha, bg-rose-700]
  Nombre grande                   Nombre grande
  Kata anunciado                  Kata anunciado

  Puntajes J1–J5 + voto           Puntajes J1–J5 + voto
  (alineados: AO a la izq,        (alineados: AKA a la der)
   votos en el centro)

  Votos AO: N                     Votos AKA: M

       [GANADOR: AKA]   ← solo cuando estado=finalizado o ganador_id existe
```

Los puntajes se muestran en gris hasta confirmar. El ganador se resalta con color de su lado.

---

## Dependencies & Execution Order

```
Phase 1 (tests + scoring.js)    → sin dependencias — PRIMERO (EDD obligatorio)
Phase 2 (SQL migration)         → sin dependencias — paralelo con Phase 1
Phase 5 (MesaKataPage)          → depende de Phase 1 y Phase 2
Phase 6 (MesaKataTVPage)        → depende de Phase 2
Phase 3 (App.jsx)               → depende de Phase 5 y Phase 6
Phase 4 (MesaBracketPage)       → depende de Phase 3
```

**Orden recomendado**:
1. Phase 1 — EDD scoring (red → green)
2. Phase 2 — SQL migration en Supabase
3. Phase 5 — MesaKataPage
4. Phase 6 — MesaKataTVPage
5. Phase 3 — App.jsx rutas
6. Phase 4 — MesaBracketPage routing

**MVP mínimo** (Phase 1 + 2 + 5 + 3 parcial): la mesa puede operar un bout de kata y guardar el resultado. Sin TV ni routing automático desde el bracket.
