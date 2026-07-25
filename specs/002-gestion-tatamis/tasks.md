# Tasks: Gestión de Tatamis

**Input**: Design documents from `/specs/002-gestion-tatamis/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Incluidos para `src/lib/` — obligatorio por convención EDD del proyecto (CLAUDE.md).

**Organization**: Tareas agrupadas por user story para implementación y testing independiente.

---

## Phase 1: Setup

**Purpose**: Estructura de carpetas y permisos en Supabase

- [ ] T001 Ejecutar SQL de permisos para tabla `tatami` en Supabase: `grant select, insert, update, delete on tatami to anon; grant select on tatami to authenticated;` + policies RLS (lectura y escritura pública igual que torneo)
- [ ] T002 [P] Crear carpetas `src/components/tatamis/` y `src/pages/torneo/`

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Lib de acceso a datos y store — deben estar completos antes de cualquier user story

**⚠️ CRÍTICO**: EDD obligatorio — tests primero (red), luego implementación (green).

- [ ] T003 Escribir tests en `src/lib/tatamis.test.js` — deben fallar (red): `fetchTatamis` retorna array, `insertTatami` retorna tatami con id y orden, `deleteTatami` no lanza error
- [ ] T004 Implementar `src/lib/tatamis.js` con funciones `fetchTatamis(torneoId)`, `insertTatami({torneo_id, nombre, orden})`, `verificarCategoriasEnTatami(tatamiId)`, `deleteTatami(tatamiId)` según `contracts/supabase-queries.md`
- [ ] T005 Agregar función `fetchTorneoById(id)` en `src/lib/torneos.js` (ya existe el archivo)
- [ ] T006 Implementar `src/stores/useTatamiStore.js` con Zustand: estado `tatamis`, `loading`, `error`, acciones `fetchTatamis`, `addTatami`, `removeTatami`

**Checkpoint**: `npm run test` verde. Store y lib listos.

---

## Phase 3: User Story 1 — Ver tatamis del torneo (Priority: P1) 🎯 MVP

**Goal**: El organizador accede a `/torneo/:id` y ve la lista de tatamis del torneo con nombre, orden y árbitro. Si no hay tatamis, ve estado vacío.

**Independent Test**: Navegar a `/torneo/:id` con un torneo existente → ver lista de tatamis o estado vacío.

- [ ] T007 [P] [US1] Crear `src/components/tatamis/TatamiEmptyState.jsx` — estado vacío con mensaje y botón "Agregar tatami"
- [ ] T008 [P] [US1] Crear `src/components/tatamis/TatamiCard.jsx` — tarjeta con nombre, orden, árbitro (o "Sin árbitro asignado") y botón eliminar
- [ ] T009 [US1] Crear `src/pages/torneo/TorneoDashboard.jsx` — página `/torneo/:id`: carga torneo y tatamis al montar, muestra nombre del torneo, lista de TatamiCard o TatamiEmptyState (depende de T006, T007, T008)
- [ ] T010 [US1] Actualizar `src/App.jsx` — agregar ruta `/torneo/:id` que carga `TorneoDashboard`
- [ ] T011 [US1] Actualizar `src/components/torneos/TorneoCard.jsx` — agregar enlace al dashboard del torneo (`/torneo/:id`) en el nombre o botón "Ver torneo"

**Checkpoint**: US1 funcional. La lista de torneos enlaza al dashboard y se ven los tatamis.

---

## Phase 4: User Story 2 — Crear tatami (Priority: P2)

**Goal**: El organizador agrega un tatami con nombre y árbitro opcional. El orden se asigna automáticamente.

**Independent Test**: En el dashboard del torneo → "Agregar tatami" → completar nombre → guardar → el tatami aparece con orden correcto.

- [ ] T012 [US2] Crear `src/components/tatamis/TatamiForm.jsx` — formulario inline con campo nombre (obligatorio) y árbitro (opcional); usa validación de nombre de tatami
- [ ] T013 [US2] Agregar función `calcularOrden(tatamis)` en `src/lib/tatamis.js` — retorna `max(orden) + 1` o `1` si la lista está vacía
- [ ] T014 [US2] Integrar `TatamiForm` en `src/pages/torneo/TorneoDashboard.jsx` — mostrar formulario al hacer clic en "Agregar tatami"; al guardar llama a `addTatami` del store (depende de T012, T013)

**Checkpoint**: US2 funcional. Se puede crear tatamis con orden automático.

---

## Phase 5: User Story 3 — Eliminar tatami (Priority: P3)

**Goal**: El organizador elimina un tatami sin categorías con confirmación. Si tiene categorías, el sistema bloquea con mensaje explicativo.

**Independent Test**: Crear tatami → eliminar → desaparece. Con categorías asignadas → mensaje de bloqueo.

- [ ] T015 [US3] Agregar lógica de eliminación en `src/components/tatamis/TatamiCard.jsx` — botón "Eliminar" abre modal de confirmación; llama a `verificarCategoriasEnTatami` y luego a `removeTatami` o muestra mensaje bloqueante (depende de T006, T008)

**Checkpoint**: US3 funcional con verificación de categorías y modal de confirmación.

---

## Phase 6: Polish

- [ ] T016 [P] Agregar loading state en `src/pages/torneo/TorneoDashboard.jsx` — spinner mientras carga el torneo y los tatamis
- [ ] T017 [P] Bloquear botón "Agregar tatami" y eliminar cuando `torneo.estado === 'en_curso' || 'finalizado'` en `TorneoDashboard.jsx`
- [ ] T018 Validar escenarios de `specs/002-gestion-tatamis/quickstart.md` en el navegador
- [ ] T019 [P] Ejecutar `npm run test` — confirmar todos los tests de `src/lib/tatamis.test.js` en verde

---

## Dependencies & Execution Order

- **Phase 1**: Sin dependencias
- **Phase 2**: Depende de Phase 1 — bloquea US1, US2, US3
- **Phase 3 (US1)**: T007, T008 en paralelo → T009 → T010 → T011
- **Phase 4 (US2)**: T012, T013 en paralelo → T014
- **Phase 5 (US3)**: T015 (depende de T008 ya existente)
- **Phase 6**: Depende de US1-3

---

## Parallel Example: US1

```
T007: TatamiEmptyState.jsx    ← en paralelo
T008: TatamiCard.jsx          ← en paralelo
        ↓
T009: TorneoDashboard.jsx
T010: App.jsx (ruta)
T011: TorneoCard.jsx (enlace)
```

---

## Implementation Strategy

### MVP (solo US1 — 5 tareas tras Foundational)

1. Phase 1 + Phase 2 (foundation)
2. Phase 3 (US1): lista de tatamis funcional
3. **VALIDAR**: navegar a `/torneo/:id` y ver tatamis

### Entrega incremental

1. Setup + Foundational → base lista
2. US1 → dashboard con lista de tatamis (MVP)
3. US2 → crear tatamis
4. US3 → eliminar tatamis
5. Polish → loading, bloqueos por estado

---

## Notes

- EDD obligatorio en `src/lib/tatamis.js` — T003 antes de T004
- `calcularOrden` es lógica de negocio → vive en `src/lib/tatamis.js`, no en el componente
- La ruta `/torneo/:id` ya es la prevista en CLAUDE.md como punto de entrada al dashboard
