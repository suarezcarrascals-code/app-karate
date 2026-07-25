# Quickstart — Validación end-to-end: Gestión de Categorías

**Feature**: 003-gestion-categorias | **Date**: 2026-06-03

## Prerequisitos

1. App corriendo: `npm run dev`
2. Torneo y tatamis creados (features 001 y 002)
3. SQL de migración ejecutado en Supabase (ver data-model.md)

## Escenario 1 — Crear categoría (US1)

1. Ir a `/torneo/:id/categorias`
2. **Esperado**: estado vacío con botón "Crear categoría"
3. Crear: Nombre=`Kumite Masculino U14 -40kg`, Modalidad=`kumite_individual`, Género=`masculino`, Edad 12-13, Peso max 40
4. **Esperado**: categoría aparece en la lista con estado "abierta" y "Sin tatami asignado"

## Escenario 2 — Asignar categoría a tatami (US2)

1. Hacer clic en "Asignar tatami" en la categoría creada
2. Elegir Tatami A, Orden 1
3. **Esperado**: categoría muestra "Tatami A - 1°" en la lista
4. **Esperado**: en vista pública aparece con leyenda "sujeto a cambios"

## Escenario 3 — Unicidad de orden (FR-003)

1. Intentar asignar otra categoría a Tatami A con Orden 1
2. **Esperado**: error o el orden 1 aparece como "ocupado" — sugiere el próximo disponible

## Escenario 4 — Mover categoría entre tatamis (US3)

1. Con la categoría en Tatami A → hacer clic en "Mover tatami"
2. Elegir Tatami B, Orden 1
3. **Esperado**: confirmación modal → aceptar → categoría aparece en Tatami B
4. **Esperado**: historial muestra el movimiento con timestamp

## Escenario 5 — Mover categoría en_curso (FR-005)

1. Cambiar estado de la categoría a "en_curso" (editar en Supabase o con acción futura)
2. Intentar moverla a otro tatami
3. **Esperado**: modal con advertencia adicional "categoría en competencia activa"

## Escenario 6 — Tests

```bash
npm run test
```
**Esperado**: todos los tests de `src/lib/categorias.test.js` en verde
