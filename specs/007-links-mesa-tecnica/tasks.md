# Tasks: Links de Acceso para Mesa Técnica

**Input**: Design documents from `/specs/007-links-mesa-tecnica/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: No tests unitarios nuevos — las funciones de `linksMesaTecnica.js` son queries Supabase puras, sin aritmética de negocio (mismo precedente que `src/lib/links.js`).

---

## Phase 1: Setup — Verificar DB

**Purpose**: Confirmar que la tabla `link_mesa_tecnica` existe con RLS correctas antes de escribir código.

- [x] T001 Ejecutar en Supabase SQL Editor: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'link_mesa_tecnica';`
- [x] T002 Si T001 no retorna filas — ejecutar el SQL de creación completo de `research.md` (tabla + RLS + GRANT)
- [x] T003 Ejecutar en Supabase SQL Editor: `SELECT policyname FROM pg_policies WHERE tablename = 'link_mesa_tecnica';` — verificar que existen las 4 políticas (org lee, org inserta, org actualiza, anon lee activo)

**Checkpoint**: La tabla existe con RLS. Las queries de `contracts/supabase-queries.md` funcionan.

---

## Phase 2: Foundational — Lib y Store

**Purpose**: Lógica de acceso a datos. Bloquea todo lo demás.

- [x] T004 Crear `src/lib/linksMesaTecnica.js` con las 4 funciones: `fetchLinksMesaTecnica`, `generarLinkMesaTecnica`, `fetchLinkMesaTecnicaByToken`, `desactivarLinkMesaTecnica` — queries exactas en `contracts/supabase-queries.md`. `fetchLinkMesaTecnicaByToken` retorna `null` si error (nunca lanza).
- [x] T005 Crear `src/stores/useLinkMesaTecnicaStore.js` con Zustand: estado `links`, `loading`, `error`; acciones `fetchLinks(torneoId)`, `generarLink(torneoId, tatamiId)` (reemplaza el link del mismo tatami en el array), `desactivarLink(linkId)` — seguir el patrón de `src/stores/useLinkStore.js`

**Checkpoint**: `fetchLinksMesaTecnica` y `generarLinkMesaTecnica` funcionan contra Supabase real.

---

## Phase 3: User Story 1 — Organizador genera y gestiona links (Priority: P1) 🎯 MVP

**Goal**: El organizador ve todos los tatamis con su estado de link, puede generar, copiar y regenerar en segundos.

**Independent Test**: Ir a `/torneo/:id/inscripciones` → sección "Mesa técnica" → generar link para Tatami A → copiarlo → pegar en el navegador → URL en formato `/marcador/[UUID]`.

- [x] T006 [P] [US1] Crear carpeta `src/components/mesatecnica/` y componente `MesaTecnicaLinkCard.jsx`: recibe props `tatami`, `link` (puede ser null), `onGenerar`, `onRegenerar`. Muestra nombre del tatami, badge de estado (Sin generar / Activo), botón "Generar link" si no hay link, o botones "Copiar" + "Regenerar" si hay link activo. Al copiar: usa `navigator.clipboard.writeText` y muestra "¡Copiado!" por 2 segundos. Al regenerar: abre modal de confirmación "¿Regenerar link? El link actual dejará de funcionar inmediatamente."
- [x] T007 [US1] Actualizar `src/pages/torneo/InscripcionesPage.jsx`: importar `useLinkMesaTecnicaStore` y `useTatamiStore`; agregar sección "Mesa técnica" debajo de los links de club con título, descripción "Un link por tatami para operar el marcador el día del evento", y lista de `MesaTecnicaLinkCard` uno por tatami; cargar tatamis y links de mesa técnica en el `useEffect` del montaje.

**Checkpoint**: El organizador puede generar, ver, copiar y regenerar links por tatami desde `/torneo/:id/inscripciones`.

---

## Phase 4: User Story 2 — Mesa técnica accede sin login (Priority: P1)

**Goal**: La persona de mesa técnica abre el link en su laptop y ve el marcador del tatami sin crear cuenta.

**Independent Test**: Abrir link en ventana incógnito → con torneo en `en_curso` → ver selector de categorías del tatami.

- [x] T008 [US2] Crear `src/pages/MarcadorPublico.jsx`: al montar, llama `fetchLinkMesaTecnicaByToken(token)` desde `useParams`. Implementar los 5 estados de la página: (1) cargando — spinner, (2) link inválido/inactivo — mensaje "Este link no es válido. Pedile al organizador un link actualizado.", (3) torneo borrador/inscripciones — "El torneo aún no ha comenzado. [nombre torneo] · [nombre tatami]", (4) torneo finalizado — "El torneo ha finalizado. [nombre torneo]", (5) torneo en_curso — header con nombre del torneo y tatami, luego selector de categorías.
- [x] T009 [US2] Agregar ruta pública en `src/App.jsx`: `<Route path="/marcador/:token" element={<MarcadorPublico />} />` — fuera de `AuthGuard`, junto a `/inscripcion/:token`.
- [x] T010 [US2] Completar la vista principal de `MarcadorPublico.jsx` (estado torneo en_curso): cargar categorías del tatami en estado `cerrada` o `en_curso` ordenadas por `orden_en_tatami`; mostrar cada categoría con nombre, modalidad y botón "Operar →"; al hacer click, mostrar lista de combates de esa categoría con su estado (pendiente/en_curso/finalizado); al seleccionar un combate, renderizar el panel de marcador inline usando `useMarcadorStore` — kumite si `modalidad` incluye `kumite`, kata si incluye `kata`.

**Checkpoint**: La mesa técnica abre el link sin login, ve las categorías del tatami y puede seleccionar un combate para operar.

---

## Phase 5: User Story 3 — Recuperación ante fallas (Priority: P2)

**Goal**: El organizador regenera un link en segundos y la mesa técnica ve un mensaje claro cuando el link anterior deja de funcionar.

**Independent Test**: Abrir link → regenerar desde panel del organizador → refrescar la pestaña → ver mensaje de link inválido con instrucciones.

- [x] T011 [US3] Verificar que el mensaje de link inválido en `MarcadorPublico.jsx` (estado 2 del T008) incluye: ícono de advertencia, texto "Este link ya no es válido", instrucción clara "Pedile al organizador el link actualizado para este tatami", y no hay ningún botón que lleve a login ni a rutas protegidas.
- [x] T012 [US3] Verificar que `generarLinkMesaTecnica` en `src/lib/linksMesaTecnica.js` desactiva el link anterior ANTES de insertar el nuevo (operación secuencial, no paralela) para garantizar que no haya ventana de dos links activos simultáneos.

**Checkpoint**: Link regenerado invalida el anterior. La mesa técnica con link viejo ve instrucciones claras.

---

## Phase 6: Polish

- [x] T013 Validar Escenario 1 de `quickstart.md` en navegador: generar link → copiar → pegar → URL correcta
- [x] T014 Validar Escenario 2 de `quickstart.md`: abrir link en ventana incógnito → pantalla de espera → cambiar torneo a en_curso → refrescar → ver categorías
- [x] T015 Validar Escenario 3 de `quickstart.md`: abrir link → regenerar desde organizador → refrescar → mensaje de link inválido
- [x] T016 Validar Escenario 4 de `quickstart.md`: abrir link con UUID inventado → mensaje de error claro (no pantalla en blanco)
- [x] T017 Verificar que la sección "Mesa técnica" en InscripcionesPage no aparece si el torneo no tiene tatamis (empty state o mensaje "Primero crea los tatamis del torneo")

---

## Dependencies & Execution Order

- **Phase 1** (SQL): Sin dependencias — ejecutar primero
- **Phase 2** (lib + store): Depende de Phase 1
- **Phase 3** (US1 — organizador): Depende de Phase 2
- **Phase 4** (US2 — mesa técnica): Depende de Phase 2; puede ir en paralelo con Phase 3
- **Phase 5** (US3 — recuperación): Depende de Phase 3 y Phase 4
- **Phase 6** (polish): Depende de todo lo anterior

---

## Parallel Example: US1 + US2

```
T006: MesaTecnicaLinkCard.jsx   ← paralelo con
T008: MarcadorPublico.jsx (estados)

        ↓
T007: InscripcionesPage.jsx (usa T006)
T009: App.jsx (ruta para T008)
T010: MarcadorPublico.jsx (vista completa, depende de T008)
```

---

## Implementation Strategy

### MVP (US1 — organizador genera links)

1. Phase 1 (SQL)
2. Phase 2 (lib + store)
3. Phase 3 (US1): panel del organizador
4. **VALIDAR**: el organizador puede generar y copiar un link

### Entrega completa

1. Phase 1 + 2 → base lista
2. US1 (Phase 3) → organizador gestiona links
3. US2 (Phase 4) → mesa técnica accede y opera
4. US3 (Phase 5) → recuperación ante fallas verificada
5. Polish (Phase 6) → quickstart validado

---

## Notes

- `fetchLinkMesaTecnicaByToken` NUNCA lanza — retorna `null` para cualquier error. Esto protege `MarcadorPublico` de pantallas en blanco.
- La verificación de `torneo.estado` se hace en el cliente (no en RLS) para evitar el patrón de recursión que afectó feature 006.
- `generarLinkMesaTecnica` es secuencial: desactivar anterior → insertar nuevo. No usar `Promise.all` aquí.
- El panel inline de marcador en `MarcadorPublico` NO tiene navegación de vuelta al torneo (eso requiere sesión). Solo el panel de puntuación.
