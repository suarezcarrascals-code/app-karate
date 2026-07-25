# Quickstart — Validación end-to-end: Gestión de Tatamis

**Feature**: 002-gestion-tatamis | **Date**: 2026-06-03

## Prerequisitos

1. App corriendo: `npm run dev` → `http://localhost:5173`
2. Torneo existente en la DB (creado en feature 001)
3. Permisos de Supabase configurados para tabla `tatami`

## Escenario 1 — Dashboard vacío (US1)

1. Hacer clic en un torneo de la lista → navegar a `/torneo/:id`
2. **Esperado**: ver el nombre del torneo y la sección de tatamis con estado vacío
3. **Esperado**: botón "Agregar tatami" visible

## Escenario 2 — Crear tatami sin árbitro (US2)

1. Hacer clic en "Agregar tatami"
2. Completar: Nombre = `Tatami A`, árbitro vacío
3. Hacer clic en "Guardar"
4. **Esperado**: `Tatami A` aparece en la lista con orden 1

## Escenario 3 — Crear segundo tatami con árbitro (US2)

1. Agregar otro tatami: Nombre = `Tatami B`, árbitro = `Juan Pérez`
2. **Esperado**: `Tatami B` aparece con orden 2 y muestra "Juan Pérez"

## Escenario 4 — Validación nombre vacío (FR-004)

1. Abrir formulario → dejar nombre vacío → guardar
2. **Esperado**: error "El nombre es obligatorio", no se crea el tatami

## Escenario 5 — Eliminar tatami sin categorías (US3)

1. Hacer clic en eliminar en `Tatami B` → confirmar
2. **Esperado**: `Tatami B` desaparece de la lista

## Escenario 6 — Tests

```bash
npm run test
```
**Esperado**: todos los tests de `src/lib/tatamis.test.js` en verde

## Escenario 7 — Supabase Dashboard

1. Ir a Supabase → Table Editor → `tatami`
2. **Esperado**: los tatamis creados aparecen con `torneo_id`, `nombre` y `orden` correctos
