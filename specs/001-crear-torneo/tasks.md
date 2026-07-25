# Tasks: Gestión de Torneos — Lista y Creación

**Input**: Design documents from `/specs/001-crear-torneo/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Incluidos para `src/lib/` — obligatorio por convención EDD del proyecto (CLAUDE.md).

**Organization**: Tareas agrupadas por user story para implementación y testing independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story correspondiente (US1, US2, US3)
- Paths exactos incluidos en cada descripción

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Configuración inicial y estructura de carpetas

- [x] T001 Crear bucket `logos` en Supabase Dashboard → Storage → New bucket (público, nombre: `logos`)
- [x] T002 [P] Crear carpetas `src/components/torneos/` y `src/stores/` en el proyecto

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Lógica de negocio y estado global — deben estar completos antes de implementar cualquier user story

**⚠️ CRÍTICO**: Ninguna user story puede comenzar hasta completar esta fase. Por convención EDD del proyecto, los tests se escriben primero y deben fallar antes de implementar.

- [x] T003 Escribir tests en `src/lib/validaciones.test.js` — deben fallar (red): `validarNombre`, `validarFechas`, `validarLogo`
- [x] T004 Implementar `src/lib/validaciones.js` para que los tests de T003 pasen (green)
- [x] T004b Escribir tests en `src/lib/torneos.test.js` — deben fallar (red): `fetchTorneos` retorna array de torneos, `insertTorneo` devuelve el torneo creado con su id
- [x] T004c [P] Ejecutar `npm run test` — confirmar que T003 y T004b fallan (red) antes de continuar
- [x] T005 [P] Implementar `src/lib/torneos.js` con funciones `fetchTorneos` e `insertTorneo` según contrato en `contracts/supabase-queries.md` (depende de T004b)
- [x] T006 Implementar `src/stores/useTorneoStore.js` con Zustand: estado `torneos`, `loading`, `error` y acciones `fetchTorneos`, `addTorneo`

**Checkpoint**: `npm run test` pasa en verde. Store y lib listos — implementación de user stories puede comenzar.

---

## Phase 3: User Story 1 — Ver lista de torneos (Priority: P1) 🎯 MVP

**Goal**: El organizador ve todos sus torneos en una lista. Si no hay ninguno, ve un estado vacío con un botón para crear el primero.

**Independent Test**: Abrir `http://localhost:5173` → ver lista de torneos o estado vacío. No requiere ninguna otra user story implementada.

- [x] T007 [P] [US1] Crear `src/components/torneos/EstadoBadge.jsx` — badge visual con color por estado (borrador, inscripciones, en_curso, finalizado)
- [x] T008 [P] [US1] Crear `src/components/torneos/EmptyState.jsx` — pantalla vacía con mensaje y botón "Crear torneo"
- [x] T009 [US1] Crear `src/components/torneos/TorneoCard.jsx` — tarjeta con nombre, fechas, lugar y EstadoBadge (depende de T007)
- [x] T010 [US1] Crear `src/pages/torneos/index.jsx` — página principal: llama a `fetchTorneos` al montar, muestra TorneoCard por cada torneo o EmptyState si está vacío (depende de T006, T008, T009)
- [x] T011 [US1] Actualizar `src/App.jsx` — agregar ruta `/` que carga `src/pages/torneos/index.jsx`

**Checkpoint**: US1 completamente funcional. La lista carga torneos de Supabase y muestra estado vacío si no hay ninguno.

---

## Phase 4: User Story 2 — Crear torneo nuevo (Priority: P2)

**Goal**: El organizador completa un formulario con nombre, fechas, lugar y logo opcional. El torneo se crea con estado "borrador" y aparece en la lista.

**Independent Test**: Hacer clic en "Crear torneo" → completar formulario → guardar → el torneo aparece en la lista con estado "borrador".

- [x] T012b [US2] Escribir tests en `src/lib/torneos.test.js` para `uploadLogo` — deben fallar (red): valida tipo de archivo, valida tamaño ≤ 2MB, retorna URL al subir correctamente
- [x] T012 [US2] Implementar `uploadLogo` en `src/lib/torneos.js` según `contracts/storage-contract.md` (depende de T012b)
- [x] T013 [US2] Crear `src/components/torneos/TorneoForm.jsx` — formulario controlado con campos nombre, fecha_inicio, fecha_fin, lugar, logo; usa validaciones de `src/lib/validaciones.js`; muestra errores por campo
- [x] T014 [US2] Crear `src/pages/torneos/NuevoTorneo.jsx` — página de creación: usa TorneoForm, llama a `uploadLogo` + `addTorneo`, redirige a `/` al guardar (depende de T012, T013)
- [x] T015 [US2] Actualizar `src/App.jsx` — agregar ruta `/torneos/nuevo` y botón "Crear torneo" en `src/pages/torneos/index.jsx` que navega a esa ruta

**Checkpoint**: US2 completamente funcional. El formulario valida, sube logo y crea el torneo en Supabase.

---

## Phase 5: User Story 3 — Activar torneo (Priority: P3)

**Goal**: El organizador puede cambiar un torneo de estado "borrador" a "inscripciones" desde la lista, solo si tiene al menos un tatami con una categoría configurada.

**Independent Test**: Con un torneo en borrador (sin tatamis) → botón activar muestra mensaje de prerrequisitos. Con tatamis y categorías → el estado cambia a "inscripciones".

**Nota**: La validación de tatamis/categorías es parcial en esta fase (la lógica completa depende del feature de tatamis). Por ahora se implementa la transición de estado y se muestra un mensaje informativo.

- [x] T016 [US3] Agregar función `cambiarEstadoTorneo(id, nuevoEstado)` en `src/lib/torneos.js` según contrato en `contracts/supabase-queries.md`
- [x] T017 [US3] Agregar acción `activarTorneo(id)` en `src/stores/useTorneoStore.js` que llama a `cambiarEstadoTorneo` y actualiza la lista local
- [x] T018 [US3] Actualizar `src/components/torneos/TorneoCard.jsx` — agregar botón "Activar" visible solo cuando `estado === 'borrador'`; por ahora muestra modal informativo indicando que se requiere al menos un tatami con categoría antes de activar

**Checkpoint**: US3 funcional con validación informativa. El estado visual cambia en la lista.

---

## Phase 6: Polish y cross-cutting concerns

**Purpose**: Estados de carga, manejo de errores y validación final

- [x] T019 [P] Agregar loading state en `src/pages/torneos/index.jsx` — spinner mientras se cargan los torneos
- [x] T020 [P] Agregar loading state en `src/pages/torneos/NuevoTorneo.jsx` — deshabilitar botón "Guardar" mientras se guarda
- [x] T021 [P] Agregar manejo de errores de red en `src/stores/useTorneoStore.js` — mostrar mensaje de error si Supabase falla
- [x] T022 Validar todos los escenarios de `specs/001-crear-torneo/quickstart.md` en el navegador
- [x] T023 [P] Ejecutar `npm run test` — confirmar todos los tests de `src/lib/validaciones.test.js` y `src/lib/torneos.test.js` en verde

---

## Dependencies & Execution Order

### Dependencias de fases

- **Phase 1 (Setup)**: Sin dependencias — comenzar inmediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloquea todas las user stories
- **Phase 3 (US1)**: Depende de Phase 2
- **Phase 4 (US2)**: Depende de Phase 2; integra con US1 (botón en lista)
- **Phase 5 (US3)**: Depende de Phase 2; integra con US1 (botón en tarjeta)
- **Phase 6 (Polish)**: Depende de las user stories deseadas

### Dependencias internas por user story

**US1**: T007, T008 en paralelo → T009 → T010 → T011

**US2**: T012, T013 en paralelo → T014 → T015

**US3**: T016 → T017 → T018

---

## Parallel Example: US1

```
# Ejecutar en paralelo (archivos distintos):
T007: EstadoBadge.jsx
T008: EmptyState.jsx

# Luego secuencialmente:
T009: TorneoCard.jsx (usa EstadoBadge)
T010: pages/torneos/index.jsx (usa TorneoCard y EmptyState)
T011: App.jsx (registra la ruta)
```

---

## Implementation Strategy

### MVP (solo US1 — 5 tareas)

1. Completar Phase 1 + Phase 2
2. Completar Phase 3 (US1): T007 → T008 → T009 → T010 → T011
3. **VALIDAR**: Abrir `http://localhost:5173` y ver la lista funcionar
4. Desplegar si el MVP es suficiente

### Entrega incremental

1. Setup + Foundational → base lista
2. US1 → lista de torneos funcional (MVP!)
3. US2 → formulario de creación funcional
4. US3 → activación de torneo
5. Polish → estados de carga y errores

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- EDD obligatorio en `src/lib/`: tests primero, deben fallar antes de implementar
- Hacer commit después de cada fase o checkpoint
- Parar en cualquier checkpoint para validar independientemente
- US3 (activar torneo) tiene dependencia conceptual con el feature de tatamis — implementar con modal informativo por ahora
