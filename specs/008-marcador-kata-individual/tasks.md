# Tasks: Marcador Kata Individual para Mesa Técnica

**Input**: Design documents from `/specs/008-marcador-kata-individual/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

---

## Phase 1: Setup (Migración SQL + Rutas)

**Purpose**: Infraestructura que habilita el feature antes de tocar React.

- [ ] T001 Ejecutar migración SQL en Supabase — agregar 12 columnas kata a tabla `combate` (ver `contracts/supabase-schema.md`)
- [X] T002 Agregar 2 rutas nuevas en `src/App.jsx`: `/mesa/:token/categoria/:catId/combate/:combateId/kata` y `/kata-tv`

---

## Phase 2: Foundational — EDD scoring.js

**Purpose**: Las 3 funciones kata son prerequisito de US1, US2 y US4. EDD obligatorio — tests PRIMERO.

**⚠️ CRÍTICO**: Escribir tests, verificar que FALLAN, luego implementar.

- [X] T003 Agregar tests kata en `src/lib/scoring.test.js` — `calcularVotoJuez` (3 casos), `determinarGanadorKataBout` (4 casos), `validarKataPermitido` (5 casos) — ya existían con todos los casos cubiertos
- [X] T004 Implementar `calcularVotoJuez`, `determinarGanadorKataBout` y `validarKataPermitido` en `src/lib/scoring.js` — ya implementadas
- [X] T005 Re-ejecutar tests y confirmar que todos pasan — 54/54 tests en verde

**Checkpoint**: Tests en verde → US1 puede comenzar.

---

## Phase 3: User Story 1 — Bout scoring: ingresar puntajes y declarar ganador (Priority: P1) 🎯 MVP

**Goal**: La mesa puede abrir el panel kata, ingresar 5 puntajes para AKA y 5 para AO, ver los votos por juez, y finalizar el bout guardando el ganador en Supabase.

**Independent Test**: Abrir `/mesa/:token/categoria/:catId/combate/:combateId/kata` → ingresar 5 puntajes AKA → confirmar → ingresar 5 puntajes AO → confirmar → ver tabla de votos y ganador → finalizar bout → verificar en DB que `estado=finalizado` y `ganador_id` tiene valor.

### Implementación US1

- [X] T006 [US1] Crear `src/pages/mesa/MesaKataPage.jsx` con estructura base: imports, params (`token`, `catId`, `combateId`), estados (`combate`, `categoria`, `link`, `loading`, `fase`), y función `cargar()` que fetchea link+categoría+combate al montar
- [X] T007 [US1] Agregar inferencia de fase al cargar desde DB en `src/pages/mesa/MesaKataPage.jsx`: si `j1_rojo !== null` → `azul_performance`; si `estado === 'finalizado'` → `resultado`; else → `anuncio`; restaurar `kataRojo`/`kataAzul` y `scoresRojo` del DB si existen
- [X] T008 [US1] Implementar fase `rojo_performance` en `src/pages/mesa/MesaKataPage.jsx`: grid 5 inputs J1–J5 (number, min=5.0, max=10.0, step=0.1) para AKA, botón "Confirmar puntajes AKA" con validación (todos llenos), guardar en Supabase (`j1_rojo`–`j5_rojo`, `estado='en_curso'`) y avanzar a `azul_performance`
- [X] T009 [US1] Implementar fase `azul_performance` en `src/pages/mesa/MesaKataPage.jsx`: resumen bloqueado de puntajes AKA + grid J1–J5 para AO, al confirmar: detectar empates por juez (error si `scoresRojo[k] === scoresAzul[k]`), guardar `j1_azul`–`j5_azul` en Supabase, calcular votos con `calcularVotosJuez` + `determinarGanadorKataBout`, avanzar a `resultado`
- [X] T010 [US1] Implementar fase `resultado` en `src/pages/mesa/MesaKataPage.jsx`: tabla con columnas Juez / Puntaje AKA / Puntaje AO / Voto; total votos; ganador resaltado; botón "Finalizar bout" que guarda `estado='finalizado'` y `ganador_id` en Supabase y navega de vuelta a `/mesa/:token/categoria/:catId`
- [X] T011 [US1] Agregar header en `src/pages/mesa/MesaKataPage.jsx`: botón atrás al bracket, nombre categoría, ronda, indicador online/offline (mismo patrón que `MesaKumitePage`)

**Checkpoint**: US1 funcional — la mesa puede operar un bout kata completo.

---

## Phase 4: User Story 2 — Anuncio de kata con cronómetro de 35 segundos (Priority: P2)

**Goal**: La mesa registra el kata que cada competidor va a ejecutar antes de la performance, con cronómetro de 35s y advertencias de repetición.

**Independent Test**: Entrar al panel kata → presionar "Iniciar anuncio AKA" → verificar cronómetro de 35s → ingresar "Bassai Dai" y confirmar → ver advertencia si ese kata ya se usó en el bout anterior → avanzar a performance.

### Implementación US2

- [X] T012 [US2] Implementar fase `anuncio` en `src/pages/mesa/MesaKataPage.jsx`: inputs texto para kata AKA y AO, cronómetro regresivo de 35s (con señal visual en últimos 10s), botón "Iniciar performance AKA" habilitado al confirmar los dos katas
- [X] T013 [US2] Agregar carga de historial de katas en `src/pages/mesa/MesaKataPage.jsx`: al montar, consultar combates finalizados del mismo `competidor_rojo_id` y `competidor_azul_id` en la categoría para construir `historialRojo[]` y `historialAzul[]`
- [X] T014 [US2] Mostrar advertencias de repetición usando `validarKataPermitido` en `src/pages/mesa/MesaKataPage.jsx`: si el kata viola reglas, mostrar banner amarillo con el motivo ("usado en bout anterior" o "usado 2 veces"); confirmar es posible igual (advertencia, no bloqueo)

**Checkpoint**: US1 + US2 — el flujo completo de kata individual funciona de inicio a fin.

---

## Phase 5: User Story 3 — KIKEN: competidor no se presenta (Priority: P3)

**Goal**: La mesa puede registrar KIKEN para cualquier competidor, el bout finaliza a favor del rival.

**Independent Test**: Panel kata → presionar "KIKEN AKA" → confirmar en modal → verificar `estado=finalizado`, `ganador_id=competidor_azul_id` en DB.

### Implementación US3

- [X] T015 [US3] Agregar botones "KIKEN AKA" y "KIKEN AO" en `src/pages/mesa/MesaKataPage.jsx` (visibles en fases `anuncio`, `rojo_performance`, `azul_performance`), modal de confirmación con nombre del competidor, lógica que guarda `estado='finalizado'` y `ganador_id` del rival en Supabase

**Checkpoint**: US1 + US2 + US3 — flujo completo incluyendo ausencias.

---

## Phase 6: User Story 4 — TV display para kata individual (Priority: P4)

**Goal**: Una ventana separada muestra en el proyector los puntajes por juez, votos y ganador actualizándose en tiempo real.

**Independent Test**: Abrir `/mesa/:token/categoria/:catId/combate/:combateId/kata-tv` en ventana separada → confirmar puntajes AKA desde el panel → verificar que el TV los muestra en < 1 segundo.

### Implementación US4

- [X] T016 [P] [US4] Crear `src/pages/mesa/MesaKataTVPage.jsx` con estructura base: params (`token`, `catId`, `combateId`), polling cada 500ms a Supabase leyendo fila de `combate`, resolver nombres de competidores, estado `online`
- [X] T017 [US4] Implementar layout TV en `src/pages/mesa/MesaKataTVPage.jsx`: header con torneo/tatami/categoría/ronda; columna AO (izquierda, fondo azul) y AKA (derecha, fondo rojo) con nombre grande, kata anunciado, grilla J1–J5 con puntaje y flecha de voto, total votos; banner "GANADOR" resaltado cuando `ganador_id` tiene valor
- [X] T018 [US4] Agregar botón "TV" en el header de `src/pages/mesa/MesaKataPage.jsx` que abre `/mesa/:token/categoria/:catId/combate/:combateId/kata-tv` en ventana nueva

**Checkpoint**: US1–US4 completos — panel y TV funcionan juntos.

---

## Phase 7: Polish & Integración

**Purpose**: Conectar el panel kata al flujo del bracket y validar edge cases.

- [X] T019 Actualizar `src/pages/mesa/MesaBracketPage.jsx`: detectar `categoria.modalidad === 'kata_individual'` y navegar a `/combate/:id/kata` en lugar de `/combate/:id`; actualizar también el botón TV del header para apuntar a `/kata-tv`
- [X] T020 Agregar guard de modalidad en `src/pages/mesa/MesaKataPage.jsx`: si `categoria.modalidad` no es `kata_individual`, mostrar error "Esta categoría no es kata individual"
- [X] T021 Agregar botón DQ (0.0) con modal de confirmación en las fases de performance de `src/pages/mesa/MesaKataPage.jsx` (para los 5 inputs de cada lado)
- [ ] T022 Commit y push del feature completo al branch `008-marcador-kata-individual`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — ejecutar primero
- **Phase 2 (EDD)**: Sin dependencias — puede ir en paralelo con Phase 1
- **Phase 3 (US1)**: Depende de Phase 1 (SQL + rutas) y Phase 2 (scoring.js)
- **Phase 4 (US2)**: Depende de Phase 3 (MesaKataPage existe)
- **Phase 5 (US3)**: Depende de Phase 3 (MesaKataPage existe)
- **Phase 6 (US4)**: Depende de Phase 1 (SQL) y Phase 2 (scoring.js); paralelo con US2/US3
- **Phase 7 (Polish)**: Depende de todas las phases anteriores

### Within Each Phase

- T003 (tests) DEBE ejecutarse y FALLAR antes de T004 (implementación)
- T006 → T007 → T008 → T009 → T010 en orden (cada uno extiende el mismo archivo)
- T016 (estructura TV) antes de T017 (layout TV)

### Parallel Opportunities

- Phase 1 y Phase 2 pueden ejecutarse en paralelo
- Phase 6 (TV) puede ejecutarse en paralelo con Phase 4 y Phase 5 (son archivos distintos)
- T016 y T019 pueden ejecutarse en paralelo (archivos distintos)

---

## Implementation Strategy

### MVP Mínimo (Phase 1 + 2 + 3)

1. T001 SQL migration
2. T002 App.jsx rutas
3. T003–T005 EDD scoring
4. T006–T011 MesaKataPage core
5. **VALIDAR**: Operar un bout kata completo end-to-end

### Entrega Completa

MVP → + T012–T014 (anuncio + timer) → + T015 (KIKEN) → + T016–T018 (TV) → + T019–T022 (polish)

---

## Notes

- EDD es obligatorio: T003 DEBE fallar antes de T004
- Los 5 inputs J1–J5 usan `type="number"` con `min=5.0 max=10.0 step=0.1`; el botón DQ (T021) es el único camino a 0.0
- La validación de empate por juez ocurre en T009 al confirmar AO (no al confirmar AKA, porque AO aún no existe en ese momento)
- Recuperación tras reload se maneja en T007 — inferir fase desde columnas DB
- El historial de katas (T013) se consulta una sola vez al montar, no en tiempo real
