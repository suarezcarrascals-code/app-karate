# Implementation Plan: Links de Acceso para Mesa Técnica

**Branch**: `feature/007-links-mesa-tecnica` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-links-mesa-tecnica/spec.md`

---

## Summary

El organizador genera un link único por tatami que la mesa técnica abre sin login para operar el marcador. El link puede regenerarse en segundos si falla. Solo funciona mientras el torneo está activo. Reutiliza el patrón de `link_inscripcion` ya probado en feature 005.

---

## Technical Context

**Language/Version**: JavaScript (React 19 + Vite 8)

**Primary Dependencies**: Supabase JS v2, Zustand 5, React Router 7, Tailwind CSS 4, @phosphor-icons/react

**Storage**: Supabase PostgreSQL — tabla `link_mesa_tecnica` ya existe (feature 006)

**Testing**: Vitest — funciones de `src/lib/linksMesaTecnica.js` son queries Supabase puras; sin aritmética nueva. Sin tests unitarios nuevos (mismo precedente que `src/lib/links.js`).

**Target Platform**: Navegador desktop — organizador en panel admin, mesa técnica en laptop del tatami

**Performance Goals**: Link carga en < 5 segundos. Regeneración invalida el anterior en < 1 segundo.

**Constraints**: Mesa técnica opera sin login. Link no expira por tiempo — solo por regeneración manual o torneo finalizado.

**Scale/Scope**: 1 link activo por tatami. Torneos locales en Santander — concurrencia baja (< 10 tatamis simultáneos).

---

## Constitution Check

- **EDD `src/lib/`**: `linksMesaTecnica.js` son queries Supabase puras sin aritmética. Sin tests unitarios nuevos — mismo precedente que `src/lib/links.js`. ✅
- **Aritmética en scoring.js**: Este feature no agrega lógica de puntuación. ✅
- **Estado global Zustand**: `useLinkMesaTecnicaStore.js` sigue el patrón de `useLinkStore.js`. ✅
- **Jerarquía Torneo → Tatami**: Respetada — link va de torneo a tatami. ✅
- **RLS sin recursión**: Verificación de torneo activo se hace en el cliente, no en RLS con join. ✅

---

## Project Structure

### Documentation (this feature)

```text
specs/007-links-mesa-tecnica/
├── plan.md              ← este archivo
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── supabase-queries.md
└── tasks.md             ← generado por /speckit-tasks
```

### Source Code

```text
src/
  lib/
    linksMesaTecnica.js              ← nuevo
  stores/
    useLinkMesaTecnicaStore.js       ← nuevo
  components/
    mesatecnica/
      MesaTecnicaLinkCard.jsx        ← nuevo
  pages/
    MarcadorPublico.jsx              ← nuevo (ruta pública /marcador/:token)
    torneo/
      InscripcionesPage.jsx          ← actualizar: agregar sección "Mesa técnica"
  App.jsx                            ← agregar ruta /marcador/:token
```

---

## Phase 1: Setup — Verificar DB

**Purpose**: Confirmar que `link_mesa_tecnica` existe con RLS correctas antes de escribir código.

### SQL de verificación (ejecutar en Supabase SQL Editor)

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'link_mesa_tecnica';
```

Si no retorna filas → ejecutar SQL de creación en `research.md`.

### SQL de verificación de políticas

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'link_mesa_tecnica';
```

Las 4 políticas necesarias están en `research.md`.

---

## Phase 2: Lib y Store

### `src/lib/linksMesaTecnica.js`

Cuatro funciones siguiendo el patrón de `src/lib/links.js`:

- `fetchLinksMesaTecnica(torneoId)` — lista todos los links con nombre del tatami
- `generarLinkMesaTecnica(torneoId, tatamiId)` — desactiva el anterior, inserta nuevo
- `fetchLinkMesaTecnicaByToken(token)` — retorna `null` si inactivo o no existe (nunca lanza)
- `desactivarLinkMesaTecnica(linkId)` — desactiva manualmente

Queries exactas en `contracts/supabase-queries.md`.

### `src/stores/useLinkMesaTecnicaStore.js`

Estado Zustand:
- `links` (array), `loading`, `error`
- `fetchLinks(torneoId)` — carga todos los links del torneo
- `generarLink(torneoId, tatamiId)` — genera nuevo link, actualiza el array (reemplaza el del mismo tatami)
- `desactivarLink(linkId)` — desactiva y actualiza el array

---

## Phase 3: Panel del Organizador

### `src/components/mesatecnica/MesaTecnicaLinkCard.jsx`

Una card por tatami:
- Nombre del tatami
- Estado: "Sin generar" (zinc badge) / "Activo" (emerald badge)
- Sin link → botón "Generar link"
- Con link activo → botón "Copiar" (con feedback "¡Copiado!" por 2s) + botón "Regenerar"
- Al regenerar → modal de confirmación "¿Regenerar link? El link actual dejará de funcionar inmediatamente."

### Actualizar `src/pages/torneo/InscripcionesPage.jsx`

Agregar sección "Mesa técnica" debajo de los links de club:
- Título "Mesa técnica" con descripción "Un link por tatami para operar el marcador el día del evento"
- Lista todos los tatamis del torneo con su `MesaTecnicaLinkCard`
- Carga tatamis y links de mesa técnica al montar

---

## Phase 4: Página Pública — MarcadorPublico

### `src/pages/MarcadorPublico.jsx`

Ruta pública: `/marcador/:token` — sin `AuthGuard`.

**Estados de la página**:

| Estado | Condición | Pantalla |
|--------|-----------|----------|
| Cargando | Inicial | Spinner |
| Link inválido | `fetchLinkMesaTecnicaByToken` retorna null | Error con instrucción |
| Torneo no iniciado | `torneo.estado` es `borrador` o `inscripciones` | Espera con nombre del torneo |
| Torneo finalizado | `torneo.estado` es `finalizado` | Finalizado |
| Válido | `torneo.estado` es `en_curso` | Selector de categorías |

**Vista principal (torneo en_curso)**:
- Header: nombre del torneo + nombre del tatami
- Lista de categorías en estado `cerrada` o `en_curso` del tatami, ordenadas por `orden_en_tatami`
- Cada categoría tiene botón "Operar →" que abre la vista de combates
- Vista de combates: lista de combates de la categoría con su estado (pendiente / en_curso / finalizado)
- Al seleccionar un combate: renderiza el panel de marcador inline según modalidad (kumite o kata)

### Actualizar `src/App.jsx`

```jsx
<Route path="/marcador/:token" element={<MarcadorPublico />} />
```

Va junto a `/inscripcion/:token` y `/torneo/:id/marcador/:combateId/tv` — fuera de `AuthGuard`.

---

## Dependencies & Execution Order

```
Phase 1 (SQL verificación)    → sin dependencias, ejecutar primero
Phase 2 (lib + store)         → depende de Phase 1
Phase 3 (UI organizador)      → depende de Phase 2
Phase 4 (MarcadorPublico)     → depende de Phase 2, paralelo con Phase 3
```

## MVP mínimo

**Phase 1 + 2 + 3** = el organizador puede generar, copiar y regenerar links por tatami.

**Phase 4** = la mesa técnica puede abrir el link y seleccionar combates para operar.

El feature completo son las 4 phases.
