# Tasks: Gestión de Categorías

**Input**: Design documents from `/specs/003-gestion-categorias/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Incluidos para `src/lib/` — obligatorio por convención EDD (CLAUDE.md).

---

## Phase 1: Setup — Migraciones de DB y carpetas

**Purpose**: Preparar la base de datos y estructura de carpetas antes de cualquier código

- [ ] T001 Ejecutar SQL de migración en Supabase SQL Editor (ver `data-model.md`): `ALTER TABLE categoria ADD COLUMN IF NOT EXISTS orden_en_tatami int; ALTER TABLE competidor ADD COLUMN IF NOT EXISTS inscripcion_manual boolean NOT NULL DEFAULT false;`
- [ ] T002 Ejecutar SQL de tabla nueva en Supabase: crear `movimiento_categoria` con permisos RLS (ver `data-model.md`)
- [ ] T003 Ejecutar SQL de permisos para `categoria`: `grant select, insert, update, delete on categoria to anon; create policy "escritura publica categorias" on categoria for insert with check (true); create policy "modificacion publica categorias" on categoria for update using (true); create policy "eliminacion publica categorias" on categoria for delete using (true);`
- [ ] T004 [P] Crear carpetas `src/components/categorias/` y `src/pages/torneo/[id]/categorias/`

---

## Phase 2: Foundational — Lib y store

**Purpose**: Lógica de negocio y acceso a datos. EDD obligatorio — tests primero.

- [ ] T005 Escribir tests en `src/lib/categorias.test.js` — deben fallar (red): `fetchCategorias` retorna array, `insertCategoria` retorna categoría con id, `asignarTatami` actualiza tatami_id y registra movimiento, `calcularOrdenesOcupados` retorna array de números
- [ ] T006 Implementar `src/lib/categorias.js` con funciones: `fetchCategorias(torneoId)`, `insertCategoria(datos)`, `asignarTatami(categoriaId, tatamiId, orden, tatamiAnteriorId, motivo)`, `calcularOrdenesOcupados(tatamiId)`, `fetchHistorialMovimientos(categoriaId)` según `contracts/supabase-queries.md`
- [ ] T007 Implementar `src/stores/useCategoriaStore.js` con Zustand: estado `categorias`, `loading`, `error`, acciones `fetchCategorias`, `addCategoria`, `asignarTatami`

**Checkpoint**: `npm run test` verde. Lib y store listos.

---

## Phase 3: User Story 1 — Crear y listar categorías (Priority: P1) 🎯 MVP

**Goal**: El organizador puede crear categorías al nivel del torneo y verlas en una lista con su tatami asignado.

**Independent Test**: Ir a `/torneo/:id/categorias` → crear una categoría → aparece en la lista con "Sin tatami asignado".

- [ ] T008 [P] [US1] Crear `src/components/categorias/CategoriaEmptyState.jsx` — estado vacío con botón "Crear categoría"
- [ ] T009 [P] [US1] Crear `src/components/categorias/CategoriaForm.jsx` — formulario con campos: nombre, modalidad (select), género (select), edad_min, edad_max, peso_min, peso_max (solo si modalidad es kumite), cinturon_min, cinturon_max
- [ ] T010 [US1] Crear `src/components/categorias/CategoriaCard.jsx` — tarjeta con nombre, modalidad, género, tatami asignado (o "Sin tatami asignado"), orden en tatami, estado, botón "Asignar tatami"
- [ ] T011 [US1] Crear `src/pages/torneo/CategoriasPage.jsx` — página `/torneo/:id/categorias`: carga categorías al montar, muestra lista o empty state, botón "Crear categoría" abre CategoriaForm inline (depende de T007, T008, T009, T010)
- [ ] T012 [US1] Actualizar `src/App.jsx` — agregar ruta `/torneo/:id/categorias` que carga `CategoriasPage`
- [ ] T013 [US1] Actualizar `src/pages/torneo/TorneoDashboard.jsx` — agregar enlace "Ver categorías" que navega a `/torneo/:id/categorias`

**Checkpoint**: US1 funcional — se pueden crear y ver categorías.

---

## Phase 4: User Story 2 — Asignar categoría a tatami (Priority: P2)

**Goal**: El organizador asigna una categoría a un tatami con un orden en el cronograma. El sistema valida que el orden no esté ocupado.

**Independent Test**: Categoría sin tatami → "Asignar tatami" → elegir tatami y orden → la categoría muestra el tatami asignado.

- [ ] T014 [P] [US2] Crear `src/components/categorias/AsignarTatamiForm.jsx` — modal/panel con: selector de tatami (lista los tatamis del torneo), campo de orden numérico, muestra órdenes ya ocupados para el tatami seleccionado, campo motivo (opcional), validación de unicidad antes de guardar
- [ ] T015 [US2] Integrar `AsignarTatamiForm` en `src/components/categorias/CategoriaCard.jsx` — botón "Asignar tatami" abre el formulario; si ya tiene tatami, el botón dice "Mover tatami"; si la categoría está en_curso, agrega advertencia adicional en el modal (depende de T014)
- [ ] T016 [US2] Actualizar vista pública en `src/pages/torneo/TorneoDashboard.jsx` — mostrar cronograma por tatami: lista de categorías asignadas ordenadas por `orden_en_tatami`, con leyenda global "Los tatamis están sujetos a cambios"

**Checkpoint**: US2 funcional — asignación con validación de orden y vista de cronograma.

---

## Phase 5: User Story 3 — Mover categoría entre tatamis (Priority: P2)

**Goal**: El organizador puede mover una categoría de tatami con confirmación. El movimiento queda en el historial.

**Independent Test**: Categoría en Tatami A → "Mover tatami" → elegir Tatami B → confirmar → aparece en Tatami B; historial registra el movimiento.

- [ ] T017 [P] [US3] Crear `src/components/categorias/HistorialMovimientos.jsx` — lista de movimientos de una categoría con tatami origen, destino, timestamp y motivo
- [ ] T018 [US3] Integrar historial en `src/components/categorias/CategoriaCard.jsx` — botón "Ver historial" expande/muestra `HistorialMovimientos` (depende de T017)

**Checkpoint**: US3 funcional — movimiento con historial visible.

---

## Phase 6: User Story 4 — Inscripción manual fuera de rango (Priority: P3)

**Goal**: El organizador puede agregar un competidor a una categoría fuera de su rango con confirmación explícita. El competidor queda marcado como "inscripción manual".

**Nota**: Esta US depende del feature de competidores (futuro). En esta fase solo se implementa la lógica de validación fuera de rango (`estaFueraDeRango`) en `src/lib/categorias.js` y el campo `inscripcion_manual` en DB.

- [ ] T019 [US4] Agregar función `estaFueraDeRango(competidor, categoria)` en `src/lib/categorias.js` — compara edad y peso del competidor con los rangos de la categoría, retorna `{ fueraDeRango: bool, motivos: string[] }`
- [ ] T020 [US4] Agregar test en `src/lib/categorias.test.js` para `estaFueraDeRango` — competidor dentro de rango retorna false, fuera de rango retorna true con motivos

**Checkpoint**: Lógica de validación lista para cuando se implemente el feature de competidores.

---

## Phase 7: Polish

- [ ] T021 [P] Agregar loading states en `src/pages/torneo/CategoriasPage.jsx`
- [ ] T022 [P] Mostrar campos de peso solo cuando modalidad es kumite en `src/components/categorias/CategoriaForm.jsx`
- [ ] T023 Validar todos los escenarios de `specs/003-gestion-categorias/quickstart.md` en el navegador
- [ ] T024 [P] Ejecutar `npm run test` — confirmar todos los tests de `src/lib/categorias.test.js` en verde

---

## Dependencies & Execution Order

- **Phase 1**: Sin dependencias — ejecutar primero (DB)
- **Phase 2**: Depende de Phase 1 — bloquea todo lo demás
- **Phase 3 (US1)**: T008, T009 en paralelo → T010 → T011 → T012, T013
- **Phase 4 (US2)**: T014 → T015, T016
- **Phase 5 (US3)**: T017 → T018
- **Phase 6 (US4)**: T019, T020 en paralelo (solo lógica, no UI)
- **Phase 7**: Depende de US1-US3

---

## Parallel Example: US1

```
T008: CategoriaEmptyState.jsx  ← paralelo
T009: CategoriaForm.jsx        ← paralelo
        ↓
T010: CategoriaCard.jsx
T011: CategoriasPage.jsx
T012: App.jsx (ruta)
T013: TorneoDashboard (enlace)
```

---

## Implementation Strategy

### MVP (US1 — 7 tareas tras Foundational)

1. Phase 1 (DB migrations)
2. Phase 2 (EDD lib + store)
3. Phase 3 (US1): lista y creación de categorías
4. **VALIDAR**: crear categoría en `/torneo/:id/categorias`

### Entrega incremental

1. Phase 1+2 → base lista
2. US1 → crear y ver categorías (MVP)
3. US2 → asignar a tatamis con cronograma
4. US3 → mover entre tatamis con historial
5. US4 → lógica fuera de rango (conectar en feature competidores)

---

## Notes

- EDD obligatorio: T005 (tests) antes de T006 (implementación)
- `AsignarTatamiForm` sirve tanto para asignar (primera vez) como para mover (ya tiene tatami) — la diferencia es el modal de confirmación
- US4 es parcial — solo lógica de validación; la UI de inscripción manual va en el feature de competidores
