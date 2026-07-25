# Tasks: Inscripción de Competidores

**Input**: Design documents from `/specs/004-inscripcion-competidores/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Incluidos para `src/lib/` — obligatorio por convención EDD (CLAUDE.md).

---

## Phase 1: Setup — Migraciones de DB y carpetas

**Purpose**: Preparar la base de datos y estructura de carpetas antes de cualquier código

- [x] T001 Ejecutar SQL de migración en Supabase SQL Editor: crear tabla `competidor` con RLS (ver `data-model.md`)
- [ ] T002 Ejecutar SQL de migración en Supabase SQL Editor: crear tabla `equipo` con RLS (ver `data-model.md`) — puede hacerse en Phase 6
- [x] T003 [P] Crear carpeta `src/components/competidores/`
- [x] T004 [P] Crear carpeta `src/pages/torneo/categoria/`

---

## Phase 2: Foundational — Lib y store

**Purpose**: Lógica de negocio y acceso a datos. EDD obligatorio — tests primero.

- [x] T005 Escribir tests en `src/lib/competidores.test.js` — deben fallar (red):
  - `calcularEdad` retorna edad correcta, retorna null sin fecha, descuenta si el cumpleaños no pasó
  - `fetchCompetidores` retorna array
  - `insertCompetidor` retorna competidor con id y estado `inscrito`
  - `deleteCompetidor` no lanza error

- [x] T006 Implementar `src/lib/competidores.js` con: `calcularEdad(fechaNacimiento)`, `fetchCompetidores(categoriaId)`, `insertCompetidor(datos)`, `deleteCompetidor(id)` según `contracts/supabase-queries.md`

- [x] T007 Implementar `src/stores/useCompetidorStore.js` con Zustand: estado `competidores`, `loading`, `error`, acciones `fetchCompetidores`, `addCompetidor`, `removeCompetidor`

**Checkpoint**: `npm run test` verde. Lib y store listos.

---

## Phase 3: User Story 1 — Registrar competidor en una categoría (Priority: P1) 🎯 MVP

**Goal**: El organizador puede abrir la lista de competidores de una categoría e inscribir uno nuevo con sus datos.

**Independent Test**: Ir a `/torneo/:id/categoria/:catId/competidores` → inscribir competidor con datos válidos → aparece en la lista con estado "inscrito".

- [x] T008 [P] [US1] Crear `src/components/competidores/CompetidorEmptyState.jsx` — estado vacío con botón "Inscribir competidor"
- [x] T009 [P] [US1] Crear `src/components/competidores/CompetidorForm.jsx` — campos: nombre*, apellido*, club, país, fecha_nacimiento, peso, cinturón; nombre y apellido obligatorios
- [x] T010 [US1] Crear `src/components/competidores/CompetidorCard.jsx` — muestra nombre completo, club, edad calculada (usando `calcularEdad`), peso, cinturón, estado; badge "Manual" si `inscripcion_manual` es true
- [x] T011 [US1] Crear `src/pages/torneo/categoria/CompetidoresPage.jsx` — ruta `/torneo/:id/categoria/:catId/competidores`: carga torneo y categoría, si categoría no está "abierta" muestra lista de solo lectura, botón "+ Inscribir" abre `CompetidorForm` inline (depende de T007, T008, T009, T010)
- [x] T012 [US1] Actualizar `src/App.jsx` — agregar ruta `/torneo/:id/categoria/:catId/competidores` que carga `CompetidoresPage`
- [x] T013 [US1] Actualizar `src/components/categorias/CategoriaCard.jsx` — agregar botón "Ver competidores" que navega a `/torneo/:id/categoria/:catId/competidores`

**Checkpoint**: US1 funcional — se pueden inscribir y ver competidores.

---

## Phase 4: User Story 2 — Inscripción fuera de rango con confirmación (Priority: P1)

**Goal**: Si los datos del competidor no cumplen los rangos de la categoría, el sistema advierte antes de guardar y permite confirmar o cancelar.

**Independent Test**: Inscribir competidor con edad fuera de rango → aparece `FueraDeRangoModal` con el motivo → confirmar → competidor queda con badge "Manual".

- [x] T014 [P] [US2] Crear `src/components/competidores/FueraDeRangoModal.jsx` — modal con lista de motivos ("Edad X mayor al máximo Y"), botones "Confirmar de todas formas" y "Cancelar"; no pierde los datos del formulario
- [x] T015 [US2] Integrar detección fuera de rango en `src/pages/torneo/categoria/CompetidoresPage.jsx` — en el submit del form: calcular edad con `calcularEdad`, llamar `estaFueraDeRango` (importada de `src/lib/categorias.js`); si hay fuera de rango mostrar `FueraDeRangoModal`; al confirmar llamar `addCompetidor` con `inscripcion_manual: true`; al cancelar cerrar modal sin guardar (depende de T014)

**Checkpoint**: US2 funcional — advertencia con confirmación explícita antes de guardar.

---

## Phase 5: User Story 3 — Ver y gestionar lista de competidores (Priority: P2)

**Goal**: El organizador puede ver todos los competidores inscritos y eliminar uno mientras el torneo no esté en curso.

**Independent Test**: Lista con competidores → eliminar uno con confirmación → desaparece; con torneo en curso el botón eliminar no aparece.

- [x] T016 [P] [US3] Actualizar `src/components/competidores/CompetidorCard.jsx` — agregar botón "Eliminar" con modal de confirmación; el botón solo aparece si el torneo está en `borrador` o `inscripciones`
- [x] T017 [US3] Actualizar `src/stores/useCompetidorStore.js` — acción `removeCompetidor(id)` ya definida en T007; verificar que se elimina del estado local tras delete exitoso (depende de T016)

**Checkpoint**: US3 funcional — gestión completa de la lista.

---

## Phase 6: User Story 4 — Agrupar en equipos (Priority: P3)

**Goal**: Para categorías de equipo, el organizador forma equipos de 3 competidores inscritos.

**Independent Test**: Categoría `kata_equipo` con 6 competidores → crear 2 equipos de 3 → cada equipo aparece en la sección "Equipos" con sus miembros.

- [ ] T018 Agregar tests en `src/lib/competidores.test.js` para `fetchEquipos` y `insertEquipo` — deben fallar antes de implementar
- [ ] T019 [P] [US4] Implementar `fetchEquipos(categoriaId)` e `insertEquipo(datos)` en `src/lib/competidores.js` según `contracts/supabase-queries.md` (depende de T018)
- [ ] T020 [P] [US4] Agregar acciones `fetchEquipos` y `addEquipo` en `src/stores/useCompetidorStore.js`
- [ ] T021 [P] [US4] Crear `src/components/competidores/EquipoForm.jsx` — nombre del equipo + 3 selectores de competidores inscritos (filtra los ya asignados a otro equipo)
- [ ] T022 [P] [US4] Crear `src/components/competidores/EquipoCard.jsx` — nombre del equipo con sus 3 miembros (nombre + club de cada uno)
- [ ] T023 [US4] Integrar sección "Equipos" en `src/pages/torneo/categoria/CompetidoresPage.jsx` — visible solo si `categoria.modalidad` contiene `_equipo`; lista equipos existentes y botón "Crear equipo" (depende de T019, T020, T021, T022)

**Checkpoint**: US4 funcional — formación de equipos completa.

---

## Phase 7: Polish

- [x] T024 [P] Agregar loading states en `src/pages/torneo/categoria/CompetidoresPage.jsx`
- [x] T025 [P] Ejecutar `npm run test` — confirmar todos los tests de `src/lib/competidores.test.js` en verde
- [ ] T026 Validar todos los escenarios de `specs/004-inscripcion-competidores/quickstart.md` en el navegador

---

## Dependencies & Execution Order

- **Phase 1**: Sin dependencias — ejecutar primero (DB)
- **Phase 2**: Depende de Phase 1 — bloquea todo lo demás
- **Phase 3 (US1)**: T008, T009 en paralelo → T010 → T011 → T012, T013
- **Phase 4 (US2)**: T014 en paralelo → T015
- **Phase 5 (US3)**: T016 en paralelo → T017
- **Phase 6 (US4)**: T018 → T019, T020, T021, T022 en paralelo → T023
- **Phase 7**: Depende de US1–US3 mínimo

---

## Parallel Example: US1

```
T008: CompetidorEmptyState.jsx  ← paralelo
T009: CompetidorForm.jsx        ← paralelo
        ↓
T010: CompetidorCard.jsx
T011: CompetidoresPage.jsx
T012: App.jsx (ruta)            ← paralelo
T013: CategoriaCard (botón)     ← paralelo
```

---

## Implementation Strategy

### MVP (US1 + US2 — 10 tareas tras Foundational)

1. Phase 1 (DB migrations)
2. Phase 2 (EDD lib + store)
3. Phase 3 (US1): inscribir y ver competidores
4. Phase 4 (US2): advertencia fuera de rango
5. **VALIDAR**: inscribir competidor en `/torneo/:id/categoria/:catId/competidores`

### Entrega incremental

1. Phase 1+2 → base lista
2. US1 → inscribir y ver (MVP)
3. US2 → validación fuera de rango
4. US3 → eliminar inscripciones
5. US4 → equipos (P3, puede ir en siguiente iteración)

---

## Notes

- EDD obligatorio: T005 (tests) antes de T006 (implementación), T018 antes de T019
- `estaFueraDeRango` se importa desde `src/lib/categorias.js` — no duplicar
- `calcularEdad` va en `src/lib/competidores.js` y se testea con EDD
- US4 (equipos) es completamente independiente — puede diferirse sin afectar US1–US3
