# Tasks: Vista Pública en Tiempo Real del Torneo

**Input**: Design documents from `/specs/009-vista-publica-realtime/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

---

## Phase 1: Setup (Rutas + Directorio)

**Purpose**: Infraestructura mínima antes de tocar los componentes.

- [X] T001 Agregar 2 rutas públicas en `src/App.jsx`: `/torneo/:id/publico` → `<TorneoPublicoPage />` y `/torneo/:id/publico/categoria/:catId` → `<CategoriaPublicoPage />` (sin `AuthGuard`, junto a las otras rutas públicas)

---

## Phase 2: Foundational (Función de datos)

**Purpose**: La función de fetch cross-categoría es prerequisito de US1.

- [X] T002 Agregar `fetchCombatesByCategoriasIds(catIds)` en `src/lib/combates.js`: query a tabla `combate` con `.in('categoria_id', catIds).eq('estado', 'en_curso')`; si `catIds.length === 0` retornar `[]` directamente

**Checkpoint**: T002 listo → US1 puede comenzar.

---

## Phase 3: User Story 1 — Panel de actividad en tiempo real (Priority: P1) 🎯 MVP

**Goal**: El espectador abre la URL pública y ve en tiempo real qué combate está ocurriendo en cada tatami, con puntaje kumite o fase kata actualizándose cada 2 segundos.

**Independent Test**: Abrir `/torneo/:id/publico` con torneo en estado `en_curso` y un combate kumite activo → ver nombres + score → esperar 2 segundos con mesa técnica sumando un punto → verificar que el score cambia sin recargar la página.

### Implementación US1

- [X] T003 [US1] Crear `src/pages/publico/TorneoPublicoPage.jsx` con estructura base: imports (`useEffect`, `useState`, `useRef`, `useParams`, `useSearchParams`, `useNavigate`, `supabase`, lib functions), estados (`torneo`, `tatamis`, `categorias`, `competidoresMap`, `combatesActivos`, `loading`, `online`), `useEffect` de carga inicial que llama `fetchTorneoById`, `fetchTatamis`, `fetchCategorias`, `fetchCompetidores` y `fetchCombatesByCategoriasIds` en paralelo, guard de estado (`borrador` / `inscripciones` → mensaje "La competencia aún no ha comenzado"), y `setInterval(2000)` que refresca solo `combatesActivos`
- [X] T004 [US1] Agregar header en `src/pages/publico/TorneoPublicoPage.jsx`: nombre del torneo grande (`text-2xl font-bold`) + lugar y fecha en texto pequeño (`text-sm text-zinc-500`)
- [X] T005 [US1] Agregar sección de tatamis en `src/pages/publico/TorneoPublicoPage.jsx`: iterar sobre `tatamis` (ya ordenados por `orden`), para cada tatami mostrar su nombre + las categorías de ese tatami agrupadas por `tatami_id`; si hay una categoría con `estado === 'en_curso'` y tiene un combate en `combatesActivos` → mostrar `<TarjetaCombateActivo>`; mostrar también una lista compacta del resto de categorías del tatami con su badge de estado
- [X] T006 [US1] Implementar `TarjetaCombateActivo` como subcomponente inline en `src/pages/publico/TorneoPublicoPage.jsx`: props `{ combate, categoria, competidoresMap, torneoId }`; si modalidad incluye 'kumite': layout `[nombre_rojo] [puntos_rojo] — [puntos_azul] [nombre_azul]` con scores en `text-5xl font-black tabular-nums`; si modalidad incluye 'kata': nombres grandes + badge de fase inferida (`j1_rojo != null && j1_azul == null` → "AO Actuando", `j1_azul != null` → "Evaluando", else → "En anuncio"); al presionar toda la tarjeta → `navigate(\`/torneo/${torneoId}/publico/categoria/${categoria.id}\`)`
- [X] T007 [US1] Agregar indicador online/offline en `src/pages/publico/TorneoPublicoPage.jsx`: `useEffect` con listeners `online`/`offline`, punto verde pulsante / rojo en esquina inferior derecha (mismo patrón que `MesaKataTVPage`)

**Checkpoint**: US1 funcional — espectador ve actividad en tiempo real y puede navegar a categorías.

---

## Phase 4: User Story 2 — Filtrar por tatami (Priority: P2)

**Goal**: El espectador puede seleccionar un tatami para ver solo su actividad; el filtro persiste en la URL para que sea compartible.

**Independent Test**: Con 2 tatamis visibles → presionar chip "Tatami A" → solo aparece Tatami A → copiar la URL → abrirla en nueva pestaña → carga con Tatami A ya filtrado.

### Implementación US2

- [X] T008 [US2] Agregar chips de filtro por tatami en `src/pages/publico/TorneoPublicoPage.jsx`: debajo del header, chips `[Todos]` + uno por tatami; leer `?tatami=<id>` al montar con `useSearchParams`, setar estado inicial `filtroTatami`; al presionar chip: `setSearchParams({ tatami: id })` o `setSearchParams({})` para "Todos"; filtrar el array de tatamis a renderizar en la sección principal según `filtroTatami`

**Checkpoint**: US1 + US2 — filtro funciona instantáneamente y la URL es compartible.

---

## Phase 5: User Story 3 — Bracket y resultados de categoría (Priority: P3)

**Goal**: El espectador puede ver el bracket completo de una categoría con ganadores resaltados y podio cuando está finalizada.

**Independent Test**: Navegar a `/torneo/:id/publico/categoria/:catId` con categoría finalizada → ver bracket con todos los resultados → ver podio con 1°/2°/3° → presionar botón atrás → volver a `/torneo/:id/publico`.

### Implementación US3

- [X] T009 [P] [US3] Crear `src/pages/publico/CategoriaPublicoPage.jsx` con estructura base: params (`id`, `catId`), estados (`torneo`, `categoria`, `combates`, `competidores`, `loading`, `online`), carga inicial con `fetchTorneoById` + `fetchCategorias` (buscar la categoría específica) + `fetchCompetidores` + `fetchCombates`, `setInterval(3000)` que refresca solo `combates`, listeners online/offline
- [X] T010 [US3] Agregar header en `src/pages/publico/CategoriaPublicoPage.jsx`: botón atrás (`<ArrowLeft>`) → `navigate(\`/torneo/${id}/publico\`)`, nombre de la categoría (`font-semibold`), nombre del torneo pequeño, indicador online/offline
- [X] T011 [US3] Agregar `<BracketView>` en `src/pages/publico/CategoriaPublicoPage.jsx`: pasar `combates={combates}`, `competidores={competidores}`, `onDeclararGanador={null}` (modo lectura)
- [X] T012 [US3] Agregar sección Podio en `src/pages/publico/CategoriaPublicoPage.jsx`: visible solo si `categoria?.estado === 'finalizada'`; derivar del bracket: 1° = ganador del combate de la final (ronda más alta, `orden_en_ronda > 0`); 2° = perdedor de la final (`competidor_rojo_id` o `competidor_azul_id` distinto del `ganador_id`); 3° = `ganador_id` del combate con `orden_en_ronda === 0`; mostrar con emojis 🥇🥈🥉 y nombre del competidor + club

**Checkpoint**: US1 + US2 + US3 completos.

---

## Phase 6: Polish & Integración

- [X] T013 Agregar imports y export de `TorneoPublicoPage` y `CategoriaPublicoPage` en `src/App.jsx` (completar los imports agregados en T001)
- [X] T014 Commit y push del feature completo al branch `009-vista-publica-realtime`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias — ejecutar primero
- **Phase 2 (Foundational)**: Puede ir en paralelo con Phase 1 (archivo diferente)
- **Phase 3 (US1)**: Depende de Phase 1 (ruta en App.jsx) y Phase 2 (fetchCombatesByCategoriasIds)
- **Phase 4 (US2)**: Depende de Phase 3 (TorneoPublicoPage existe — se modifica el mismo archivo)
- **Phase 5 (US3)**: Puede iniciar junto con Phase 3 — es un archivo nuevo; T009 es marcado [P]
- **Phase 6 (Polish)**: Depende de todas las fases anteriores

### Within Each Phase

- T003 → T004 → T005 → T006 → T007 (mismo archivo, en orden)
- T009 → T010 → T011 → T012 (mismo archivo, en orden)

### Parallel Opportunities

- T001 y T002 pueden ir en paralelo (archivos distintos)
- T009 puede iniciar tan pronto como existan las rutas (T001) — es archivo distinto al de US1

---

## Implementation Strategy

### MVP Mínimo (Phase 1 + 2 + 3)

1. T001 — rutas en App.jsx
2. T002 — fetchCombatesByCategoriasIds
3. T003–T007 — TorneoPublicoPage completa (US1)
4. **VALIDAR**: Abrir `/torneo/:id/publico` y ver actividad en tiempo real

### Entrega Completa

MVP → + T008 (filtro de tatami, US2) → + T009–T012 (bracket y podio, US3) → + T013–T014 (polish + push)

---

## Notes

- No hay SQL migration — todos los datos ya existen en Supabase
- No hay tests EDD — ninguna función nueva de lógica de negocio en `src/lib/`
- `BracketView` recibe `competidores` como array, no como mapa — `fetchCompetidores` ya devuelve array
- La detección de fase kata usa `!= null` (captura `null` Y `undefined`) igual que en `MesaKataPage`
- El podio (T012) se calcula en el componente a partir del array de combates, sin función en lib/
