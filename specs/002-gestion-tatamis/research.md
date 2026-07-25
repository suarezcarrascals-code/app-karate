# Research: Gestión de Tatamis

**Feature**: 002-gestion-tatamis | **Date**: 2026-06-03

## Decisiones técnicas

### 1. Cálculo del orden automático

**Decision**: Calcular el orden en cliente como `max(orden existente) + 1` antes del insert.

**Rationale**: Simple y predecible. El store ya tiene la lista de tatamis del torneo — el máximo se calcula sin query adicional. Si la lista está vacía, el orden es 1.

**Alternatives considered**:
- Trigger en DB — rechazado: CLAUDE.md prohíbe lógica en DB triggers
- `count(*) + 1` — rechazado: no es correcto si se eliminaron tatamis intermedios

---

### 2. Formulario de creación — inline vs página separada

**Decision**: Formulario inline en el dashboard (sin cambio de ruta).

**Rationale**: Tatamis son simples (2 campos). Un formulario inline evita navegación innecesaria y permite ver la lista mientras se crea. El patrón es consistente con dashboards de configuración rápida.

**Alternatives considered**:
- Página `/torneo/:id/tatamis/nuevo` — rechazado: demasiada fricción para tan pocos campos
- Modal — válido, pero inline es más simple y accesible

---

### 3. Eliminación — verificación de categorías

**Decision**: Query a Supabase para verificar si el tatami tiene categorías antes de mostrar el botón eliminar como activo.

**Rationale**: La tabla `categoria` tiene `tatami_id` como FK. Un `count` simple es suficiente. Si el count > 0, se muestra mensaje bloqueante.

**Alternatives considered**:
- Soft delete — diferido: no hay requisito de historial en esta versión
- Cascade delete — rechazado: demasiado peligroso sin confirmación explícita

---

### 4. Ruta del dashboard del torneo

**Decision**: `/torneo/:id` como dashboard principal con lista de tatamis.

**Rationale**: Siguiendo la jerarquía de CLAUDE.md: `Torneo → Tatami → Categoría`. El dashboard del torneo es el punto central de configuración. La lista de torneos (`/`) enlaza a `/torneo/:id`.

**Navigation flow**:
```
/ (lista torneos) → /torneo/:id (dashboard + tatamis) → /torneo/:id/tatami/:tid (categorías — futuro)
```
