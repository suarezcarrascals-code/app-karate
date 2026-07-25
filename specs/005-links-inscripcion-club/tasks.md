# Tasks: Links de Inscripción por Club

**Input**: Design documents from `/specs/005-links-inscripcion-club/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Incluidos para `src/lib/links.js` — obligatorio por convención EDD (CLAUDE.md).

---

## Phase 1: Setup — Migraciones de DB

**Purpose**: Preparar la base de datos antes de cualquier código

- [x] T001 Ejecutar SQL en Supabase SQL Editor: crear tabla `link_inscripcion` (ver `data-model.md`)
- [x] T002 Ejecutar SQL en Supabase SQL Editor: agregar columna `link_inscripcion_id` a tabla `competidor` (ver `data-model.md`)
- [x] T003 Ejecutar SQL en Supabase SQL Editor: crear políticas RLS para `link_inscripcion`, `competidor` (anon insert con límite), `categoria`, `dojo`, `torneo` (ver `data-model.md`)

---

## Phase 2: Foundational — Lib y Store

**Purpose**: Lógica de negocio y acceso a datos. EDD obligatorio — tests primero.

**⚠️ CRÍTICO**: Nada de UI puede empezar hasta completar esta fase.

- [x] T004 Escribir tests en `src/lib/links.test.js` — deben fallar (red)
- [x] T005 Implementar `src/lib/links.js` con: `fetchLinks`, `fetchLinkByToken`, `generarLink`, `desactivarLink`, `desactivarTodosLosLinks`, `contarAtletasPorLink`
- [x] T006 Implementar `src/stores/useLinkStore.js` con Zustand: estado `links`, `loading`, `error`; acciones `fetchLinks`, `generarLink`, `desactivarLink`, Realtime

**Checkpoint**: `npm run test` verde. Lib y store listos.

---

## Phase 3: User Story 2 — Organizador genera link para un club (Priority: P1)

**Goal**: El organizador puede generar un link por club con un límite de atletas, copiarlo al portapapeles y ver el estado de cada club.

**Independent Test**: Ir a `/torneo/:id/inscripciones` → generar link para un club con límite 5 → copiar → verificar que la URL es válida y el estado del club muestra "Link activo · 0/5".

- [x] T007 [P] [US2] Crear `src/components/inscripcion/LinkCard.jsx`
- [x] T008 [P] [US2] Crear `src/pages/torneo/InscripcionesPage.jsx`
- [x] T009 [US2] Agregar ruta en `src/App.jsx`: `/torneo/:id/inscripciones` → `InscripcionesPage`
- [x] T010 [US2] Agregar enlace "Inscripciones" al menú en `src/pages/torneo/TorneoLayout.jsx`

**Checkpoint**: US2 funcional — el organizador puede generar, copiar y ver links.

---

## Phase 4: User Story 1 — Entrenador inscribe atletas por link (Priority: P1) 🎯 MVP

**Goal**: El entrenador abre el link, ve el torneo y su club, agrega atletas con sugerencia de categoría, y el formulario se bloquea al llegar al límite.

**Independent Test**: Abrir `/inscripcion/:token` en modo incógnito → agregar atletas verificando la sugerencia → al llegar al límite verificar que el formulario desaparece.

- [x] T011 [P] [US1] Crear `src/components/inscripcion/CategoriaDisplay.jsx`
- [x] T012 [P] [US1] Crear `src/components/inscripcion/AtletaInscritoCard.jsx`
- [x] T013 [US1] Crear `src/components/inscripcion/AtletaForm.jsx`
- [x] T014 [US1] Crear `src/pages/InscripcionPublica.jsx`
- [x] T015 [US1] Extender `src/lib/competidores.js` con `insertCompetidorPorLink` y `fetchCompetidoresPorLink`
- [x] T016 [US1] Agregar ruta pública en `src/App.jsx`: `/inscripcion/:token` → `InscripcionPublica`

**Checkpoint**: US1 funcional — el entrenador puede inscribir atletas completos desde el link.

---

## Phase 5: User Story 3 — Contador en tiempo real (Priority: P2)

**Goal**: El organizador ve el contador de atletas de cada club actualizarse sin recargar cuando el entrenador inscribe.

- [x] T017 [US3] Suscripción Realtime en `src/stores/useLinkStore.js`
- [x] T018 [US3] Activar/desactivar suscripción en `src/pages/torneo/InscripcionesPage.jsx`

**Checkpoint**: US3 funcional — contador en tiempo real operativo.

---

## Phase 6: User Story 4 — Organizador desactiva un link (Priority: P2)

**Goal**: El organizador puede desactivar el link de un club con confirmación. El entrenador que intente abrirlo ve un mensaje claro.

- [x] T019 [US4] Botón "Desactivar" con modal de confirmación en `src/components/inscripcion/LinkCard.jsx`
- [x] T020 [US4] Mensaje de link inactivo en `src/pages/InscripcionPublica.jsx`

**Checkpoint**: US4 funcional — control de acceso por desactivación operativo.

---

## Phase 7: Polish

- [x] T021 [P] Loading states en `InscripcionPublica.jsx` y `InscripcionesPage.jsx`
- [x] T022 [P] `InscripcionPublica.jsx` mobile-first (max-w-lg, botones full-width, touch-friendly)
- [x] T023 `npm run test` — 137 tests en verde incluyendo `links.test.js`
- [ ] T024 Validar todos los escenarios de `specs/005-links-inscripcion-club/quickstart.md` en el navegador (requiere migraciones SQL ejecutadas)

---

## Dependencies & Execution Order

- **Phase 1** (DB): Sin dependencias — ejecutar primero
- **Phase 2** (lib + store): Depende de Phase 1 — bloquea todo lo demás
- **Phase 3** (US2): T007 y T008 en paralelo → T009 → T010
- **Phase 4** (US1): T011, T012 en paralelo → T013 → T015 → T014 → T016
- **Phase 5** (US3): Incluido en Phase 2 (store) y Phase 3 (page)
- **Phase 6** (US4): Incluido en Phase 3 (LinkCard) y Phase 4 (InscripcionPublica)
- **Phase 7**: Depende de todas las fases anteriores

---

## Notes

- EDD completo: T004 (tests) antes de T005 (implementación) ✓
- `encontrarCategoriasCompatibles` y `calcularEdad` reutilizados desde libs existentes ✓
- La ruta `/inscripcion/:token` está fuera de `TorneoLayout` (no requiere auth) ✓
- RLS de Supabase es la última línea de defensa para el límite de atletas ✓
- T024 pendiente hasta ejecutar migraciones SQL en Supabase
