# Research: Vista Pública en Tiempo Real

**Feature**: 009-vista-publica-realtime
**Date**: 2026-07-23

## Decision 1: Polling vs Supabase Realtime Channels

**Decision**: Polling periódico (intervalo 2000ms)

**Rationale**: El codebase ya usa polling de 500ms en `MesaTVPage` y `MesaKataTVPage`. Supabase Realtime requiere configurar canales de suscripción por tabla y row, que añade complejidad en setup de RLS policies para filas públicas. El polling cada 2s es suficiente para la vista pública (los espectadores no necesitan < 1s de latencia), mantiene el patrón uniforme y es más robusto frente a reconexiones.

**Alternativas consideradas**:
- Supabase Realtime Channels: requeriría configurar permisos de canal para usuarios anónimos; añade complejidad sin beneficio percibido por espectadores.
- SSE/WebSockets propios: out-of-scope, no hay backend custom en el proyecto.

---

## Decision 2: Estrategia de carga de datos

**Decision**: Carga inicial única para datos estáticos (torneo, tatamis, categorias, competidores); polling solo para combates.

**Rationale**: Tatamis, categorías y competidores no cambian durante la competencia. Recargarlos en cada poll sería innecesario. Solo los combates (puntos, estado) cambian en tiempo real.

**Alternativas consideradas**:
- Recargar todo en cada poll: simple pero desperdicia ancho de banda.
- Supabase embedded joins: haría las queries más complejas sin ganancia de rendimiento.

---

## Decision 3: Filtro por tatami

**Decision**: Filtrado client-side, persistido en URL como `?tatami=<tatamiId>`.

**Rationale**: Los datos de tatamis ya se cargan en la carga inicial. Filtrar en el cliente evita una petición adicional al servidor y es instantáneo (<50ms). La URL con query param permite compartir la vista filtrada por tatami (útil cuando el organizador proyecta un tatami específico en pantalla del recinto).

**Alternativas consideradas**:
- Fetch separado por tatami: latencia innecesaria para datos ya disponibles.
- localStorage: no compartible por URL.

---

## Decision 4: Reutilización de BracketView

**Decision**: Reutilizar `src/components/brackets/BracketView.jsx` en modo lectura pasando `onDeclararGanador={null}`.

**Rationale**: El componente ya soporta modo lectura — si `onDeclararGanador` es `null` o `undefined`, `puedeDeclarar` es `false` y los botones no se renderizan. Evita duplicar lógica de visualización del bracket.

---

## Decision 5: Nueva función en combates.js

**Decision**: Agregar `fetchCombatesByCategoriasIds(catIds)` — consulta `combate` filtrando por `.in('categoria_id', catIds)`.

**Rationale**: La vista pública necesita los combates en curso de todas las categorías del torneo en un solo fetch, no uno por categoría. Esta función es una query simple sin lógica de negocio, por lo que no requiere test bajo el criterio EDD (que aplica a funciones de cálculo/transformación, no a fetches de DB).

---

## Decision 6: Detección de fase kata en vista pública

**Decision**: Usar la misma heurística que `MesaKataTVPage`: si `j1_rojo != null` → "AO actuando"; si `j1_azul != null` → "Evaluando resultado"; si solo `estado='en_curso'` → "En anuncio / espera".

**Rationale**: Reutilizar lógica ya probada. La vista pública no necesita mostrar puntajes kata intermedios (solo el estado es relevante para espectadores).

---

## Decision 7: Estado del torneo

**Decision**: Mostrar contenido para torneos en estado `en_curso` o `finalizado`. Para `borrador` e `inscripciones`: mostrar mensaje "La competencia aún no ha comenzado".

**Rationale**: El torneo pasa por borrador → inscripciones → en_curso → finalizado. En `en_curso` hay combates activos; en `finalizado` hay resultados que mostrar. Los estados anteriores no tienen contenido útil para espectadores.
