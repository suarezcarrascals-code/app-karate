# Implementation Plan: Gestión de Categorías

**Branch**: `feature/003-gestion-categorias` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

## Summary

Las categorías se crean al nivel del torneo y se asignan a tatamis con un orden en el cronograma del día. La asignación es flexible: se puede mover una categoría a otro tatami en cualquier estado, con registro automático en historial. El tatami asignado es visible públicamente desde la asignación con leyenda "sujeto a cambios". Los competidores pueden ser inscritos fuera de su rango por el organizador con confirmación explícita.

## Technical Context

**Language/Version**: JavaScript ES2022+ / JSX

**Primary Dependencies**: React 18, React Router v6, Zustand, Supabase JS v2, Tailwind CSS v4

**Storage**: Supabase PostgreSQL — tablas `categoria` (ya existe en DB), nueva tabla `movimiento_categoria`; campo `inscripcion_manual` en `competidor`

**Testing**: Vitest — funciones en `src/lib/categorias.js`

**Target Platform**: Web — desktop-first para organizador; mobile-first para vista pública

**Project Type**: SPA con React + Supabase BaaS

**Performance Goals**: Asignación y movimiento de categoría visible en menos de 3 segundos en vista pública

**Constraints**: Unicidad de `(tatami_id, orden_en_tatami)` por torneo; un competidor en una sola categoría por torneo; historial de movimientos inmutable

**Scale/Scope**: Hasta ~30 categorías por torneo en uso típico

## Constitution Check

Convenciones CLAUDE.md verificadas:
- Lógica de negocio en `src/lib/` (validaciones, cálculo de unicidad de orden) ✓
- Rutas anidadas bajo `/torneo/:id/` ✓
- Nomenclatura dominio español, código inglés ✓
- Zustand para estado global ✓
- EDD obligatorio en `src/lib/` ✓

**Nueva tabla en DB**: `movimiento_categoria` — requiere SQL de creación + permisos antes de implementar.

## Project Structure

### Documentation

```text
specs/003-gestion-categorias/
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
        categorias/
          index.jsx        # Lista de categorías del torneo (/torneo/:id/categorias)
  components/
    categorias/
      CategoriaCard.jsx    # Tarjeta de categoría con tatami asignado y orden
      CategoriaForm.jsx    # Formulario de creación de categoría
      AsignarTatamiForm.jsx # Formulario de asignación/movimiento a tatami
      HistorialMovimientos.jsx # Lista de movimientos históricos
  stores/
    useCategoriaStore.js   # Zustand: categorías + acciones CRUD + asignación
  lib/
    categorias.js          # Queries Supabase + lógica de negocio
    categorias.test.js     # Tests EDD
```

**Rutas nuevas**:
- `/torneo/:id/categorias` — lista de categorías del torneo
- El dashboard `/torneo/:id` existente enlaza a esta sección

## Complexity Tracking

**Nueva tabla `movimiento_categoria`**: requiere migración SQL y permisos antes de implementar. No hay violación de constitución — es lógica de dominio necesaria.
