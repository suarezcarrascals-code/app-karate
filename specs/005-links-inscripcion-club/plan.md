# Implementation Plan: Links de Inscripción por Club

**Branch**: `005-links-inscripcion-club` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-links-inscripcion-club/spec.md`

## Summary

El organizador genera un link único por club (dojo) con un límite de atletas acordado. El entrenador abre ese link sin crear cuenta, ve las categorías del torneo, y registra sus atletas uno por uno con sugerencia automática de categoría. Los atletas inscritos van a la misma tabla `competidor` existente. El sistema bloquea el formulario cuando se alcanza el límite. La pantalla del entrenador es mobile-first; el panel del organizador es desktop.

## Technical Context

**Language/Version**: JavaScript ES2022 — React 19 + Vite 8

**Primary Dependencies**: Supabase JS v2 (anon key + Realtime), Zustand 5, Tailwind CSS 4, React Router 7

**Storage**: PostgreSQL vía Supabase — tabla `link_inscripcion` nueva; `competidor` extendida con `link_inscripcion_id` nullable

**Testing**: Vitest 4 — EDD obligatorio para `src/lib/links.js`

**Target Platform**: Web SPA — mobile-first para `/inscripcion/:token`; desktop para panel del organizador

**Performance Goals**: Contador en panel del organizador actualizado en < 3 segundos vía Supabase Realtime

**Constraints**: `/inscripcion/:token` accesible sin login usando Supabase anon key; RLS valida token activo y límite no superado antes de permitir INSERT en `competidor`

**Scale/Scope**: 5–20 clubs por torneo, 50–300 atletas por torneo

## Constitution Check

Convenciones de CLAUDE.md aplicadas:
- ✅ EDD: tests en `links.test.js` antes de implementar `links.js`
- ✅ Lógica de negocio en `src/lib/`, nunca inline en componentes
- ✅ Estado global en Zustand (`useLinkStore`)
- ✅ Dominio en español (`link_inscripcion`, `dojo`, `competidor`), código en inglés
- ✅ RLS en Supabase controla acceso anónimo — no lógica de seguridad en el cliente

## Project Structure

### Documentation (this feature)

```text
specs/005-links-inscripcion-club/
├── plan.md              ← este archivo
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
  pages/
    InscripcionPublica.jsx             ← /inscripcion/:token (sin login, mobile-first)
    torneo/
      InscripcionesPage.jsx            ← panel del organizador — gestión de links por club

  components/
    inscripcion/
      AtletaForm.jsx                   ← formulario de un atleta con sugerencia de categoría
      AtletaInscritoCard.jsx           ← fila de atleta en la lista de inscritos
      CategoriaDisplay.jsx             ← lista de categorías disponibles del torneo
      LinkCard.jsx                     ← tarjeta de un club con su link y contador

  lib/
    links.js                           ← CRUD link_inscripcion + validaciones
    links.test.js                      ← tests EDD (primero)

  stores/
    useLinkStore.js                    ← Zustand: links, generación, desactivación, realtime

App.jsx                                ← ruta pública /inscripcion/:token (fuera de TorneoLayout)
```
