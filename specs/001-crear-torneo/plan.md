# Implementation Plan: Gestión de Torneos — Lista y Creación

**Branch**: `feature/001-crear-torneo` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-crear-torneo/spec.md`

## Summary

El organizador puede ver todos los torneos existentes en una lista y crear nuevos torneos con nombre, fechas, lugar y logo opcional. Los torneos se crean en estado "borrador". La implementación abarca una página de lista, un formulario de creación, un Zustand store para estado global, y la integración con Supabase para persistencia y almacenamiento de logos.

## Technical Context

**Language/Version**: JavaScript ES2022+ / JSX

**Primary Dependencies**: React 18, React Router v6, Zustand, Supabase JS v2, Tailwind CSS v4

**Storage**: Supabase PostgreSQL (tabla `torneo`) + Supabase Storage (bucket `logos` para imágenes)

**Testing**: Vitest — aplica a funciones en `src/lib/validaciones.js`

**Target Platform**: Web — desktop-first para organizador (PC), responsive para consulta móvil

**Project Type**: SPA (Single Page Application) con React + Supabase como backend

**Performance Goals**: Lista carga en menos de 3 segundos; formulario guarda y el torneo aparece en lista en menos de 3 segundos

**Constraints**: Logo máximo 2 MB; validación client-side antes del envío; sin cálculos de negocio inline en componentes

**Scale/Scope**: Hasta ~50 torneos por organizador en fase inicial

## Constitution Check

Convenciones del CLAUDE.md verificadas:
- Toda validación de negocio en `src/lib/` — OK (validaciones.js)
- Nomenclatura de dominio en español, código en inglés — OK
- No prop drilling más de 2 niveles → Zustand store — OK
- Componentes en PascalCase, un archivo por componente — OK
- Rutas anidadas bajo contexto de torneo — OK (/ para lista, /torneos/nuevo para formulario)

## Project Structure

### Documentation (this feature)

```text
specs/001-crear-torneo/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas investigadas
├── data-model.md        # Modelo de datos y flujo de estado
├── quickstart.md        # Guía de validación end-to-end
├── contracts/
│   ├── supabase-queries.md   # Contratos de consultas a la DB
│   └── storage-contract.md   # Contrato de upload de logos
└── tasks.md             # Generado por /speckit-tasks
```

### Source Code

```text
src/
  pages/
    torneos/
      index.jsx          # Lista de torneos (ruta: /)
      NuevoTorneo.jsx    # Formulario de creación (ruta: /torneos/nuevo)
  components/
    torneos/
      TorneoCard.jsx     # Tarjeta individual en la lista
      TorneoForm.jsx     # Formulario controlado de creación
      EstadoBadge.jsx    # Badge visual del estado del torneo
      EmptyState.jsx     # Pantalla vacía sin torneos
  stores/
    useTorneoStore.js    # Zustand: lista de torneos + acciones CRUD
  lib/
    supabase.js          # Cliente Supabase (ya existe)
    torneos.js           # Funciones de acceso a datos (queries)
    validaciones.js      # Validaciones de formulario (testeable)
    validaciones.test.js # Tests de validaciones con Vitest
```

**Structure Decision**: SPA single-project. Todo el código vive bajo `src/`. No hay backend separado — Supabase actúa como BaaS.

## Complexity Tracking

Sin violaciones de constitución identificadas.
