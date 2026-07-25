# Implementation Plan: Inscripción de Competidores

**Branch**: `feature/004-inscripcion-competidores` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-inscripcion-competidores/spec.md`

## Summary

Permite al organizador inscribir competidores en categorías del torneo. El flujo principal es: navegar a `/torneo/:id/categoria/:catId/competidores` → completar formulario → validación de rangos en cliente → guardar en Supabase. La función `estaFueraDeRango` ya existe en `src/lib/categorias.js` y se reutiliza directamente. US4 (equipos) es P3 e independiente de US1–US3.

## Technical Context

**Language/Version**: JavaScript (React 18, Vite)

**Primary Dependencies**: React Router v6, Zustand, Supabase JS v2, Tailwind CSS

**Storage**: Supabase PostgreSQL — tablas `competidor` y `equipo` (definidas en CLAUDE.md, requieren migración SQL)

**Testing**: Vitest — EDD obligatorio para `src/lib/competidores.js`

**Target Platform**: Web mobile-first (Android/iOS via navegador)

**Project Type**: Web application (SPA)

**Performance Goals**: Lista de competidores visible sin demora perceptible; inscripción completable en < 60s

**Constraints**: Sin auth en esta etapa; offline no requerido para inscripciones

**Scale/Scope**: Torneos locales — decenas a cientos de competidores por torneo

## Constitution Check

- ✅ EDD: tests antes de implementación en `src/lib/`
- ✅ Aritmética de negocio (`calcularEdad`, validación fuera de rango) en `src/lib/`, nunca inline
- ✅ `estaFueraDeRango` ya implementada y testeada — se importa, no se duplica
- ✅ Estado global en Zustand (`useCompetidorStore`)
- ✅ Dominio en español, código en inglés
- ✅ Jerarquía mantenida: competidores se acceden desde la categoría

## Project Structure

### Documentation (this feature)

```text
specs/004-inscripcion-competidores/
├── plan.md              ← este archivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── supabase-queries.md
└── tasks.md             ← generado por /speckit-tasks
```

### Source Code

```text
src/
  lib/
    competidores.js          ← fetchCompetidores, insertCompetidor, deleteCompetidor,
    competidores.test.js         calcularEdad, fetchEquipos, insertEquipo
  stores/
    useCompetidorStore.js    ← competidores, loading, error + acciones
  components/
    competidores/
      CompetidorEmptyState.jsx
      CompetidorForm.jsx         ← nombre, apellido, club, país, fecha_nacimiento, peso, cinturón
      CompetidorCard.jsx         ← datos + edad calculada + badge inscripcion_manual
      FueraDeRangoModal.jsx      ← advertencia con motivos + confirmar/cancelar
      EquipoForm.jsx             ← (P3) selector 3 miembros + nombre equipo
      EquipoCard.jsx             ← (P3) equipo con sus 3 miembros
  pages/
    torneo/
      categoria/
        CompetidoresPage.jsx     ← ruta /torneo/:id/categoria/:catId/competidores
```

**Nuevas rutas**:
- `/torneo/:id/categoria/:catId/competidores` — lista e inscripción de competidores
- Punto de entrada: botón "Ver competidores" en cada `CategoriaCard`
