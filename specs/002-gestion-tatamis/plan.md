# Implementation Plan: Gestión de Tatamis

**Branch**: `feature/002-gestion-tatamis` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-gestion-tatamis/spec.md`

## Summary

El organizador puede ver, crear y eliminar tatamis dentro de un torneo. Cada tatami tiene nombre obligatorio, orden automático y árbitro opcional (texto libre). La eliminación está bloqueada si el tatami tiene categorías asignadas. La pantalla es el dashboard del torneo, accesible desde la lista de torneos.

## Technical Context

**Language/Version**: JavaScript ES2022+ / JSX

**Primary Dependencies**: React 18, React Router v6, Zustand, Supabase JS v2, Tailwind CSS v4

**Storage**: Supabase PostgreSQL — tabla `tatami` (ya creada), relación con `torneo` y futura relación con `categoria`

**Testing**: Vitest — funciones de `src/lib/tatamis.js` y validaciones

**Target Platform**: Web — desktop-first para organizador

**Project Type**: SPA con React + Supabase BaaS

**Performance Goals**: Lista de tatamis carga en menos de 2 segundos; creación refleja el nuevo tatami en menos de 2 segundos

**Constraints**: Nombre de tatami obligatorio; orden asignado automáticamente; eliminación bloqueada si hay categorías; torneo en_curso/finalizado bloquea creación y eliminación

**Scale/Scope**: Máximo ~10 tatamis por torneo en uso típico

## Constitution Check

Convenciones CLAUDE.md verificadas:
- Lógica de negocio en `src/lib/` (validaciones, cálculo de orden) ✓
- Rutas anidadas bajo `/torneo/:id/` ✓
- Nomenclatura dominio español, código inglés ✓
- Zustand para estado global ✓
- EDD obligatorio en `src/lib/` ✓

## Project Structure

### Documentation (this feature)

```text
specs/002-gestion-tatamis/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── supabase-queries.md
└── tasks.md
```

### Source Code

```text
src/
  pages/
    torneo/
      [id]/
        index.jsx          # Dashboard del torneo (ruta: /torneo/:id)
  components/
    tatamis/
      TatamiCard.jsx       # Tarjeta individual de un tatami
      TatamiForm.jsx       # Formulario inline de creación de tatami
      TatamiEmptyState.jsx # Estado vacío cuando no hay tatamis
  stores/
    useTatamiStore.js      # Zustand: lista de tatamis + acciones CRUD
  lib/
    tatamis.js             # Funciones de acceso a datos (queries Supabase)
    tatamis.test.js        # Tests EDD
```

**Structure Decision**: SPA single-project. El dashboard del torneo (`/torneo/:id`) muestra los tatamis del torneo actual.

## Complexity Tracking

Sin violaciones identificadas.
