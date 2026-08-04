# Implementation Plan: Vista Pública en Tiempo Real del Torneo

**Branch**: `009-vista-publica-realtime` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-vista-publica-realtime/spec.md`

## Summary

Crear una vista pública sin login (`/torneo/:id/publico`) que muestre en tiempo real los combates en curso de cada tatami del torneo. Usa polling cada 2 segundos sobre datos ya disponibles en Supabase (sin SQL migration). Una sub-ruta (`/publico/categoria/:catId`) muestra el bracket completo en modo lectura reutilizando el componente `BracketView` existente.

## Technical Context

**Language/Version**: JavaScript (ES2022) con JSX — Vite + React 18

**Primary Dependencies**:
- `react-router-dom` v7 (ya instalado) — routing
- `@supabase/supabase-js` (ya instalado) — fetch de datos
- Tailwind CSS (ya instalado) — estilos
- `@phosphor-icons/react` (ya instalado) — íconos
- `src/components/brackets/BracketView.jsx` (existente) — bracket read-only

**Storage**: Supabase PostgreSQL — tablas: `torneo`, `tatami`, `categoria`, `combate`, `competidor`. **Sin migración SQL.**

**Testing**: No aplica — solo componentes de display; sin lógica de negocio nueva en `src/lib/`

**Target Platform**: Navegador web — mobile-first para espectadores; legible en TV/proyector

**Project Type**: Web application — React SPA, rutas públicas sin autenticación

**Performance Goals**: Carga inicial < 3s; refresh automático cada 2s; cambio visible en pantalla < 3s tras actualización en mesa técnica

**Constraints**: Sin login requerido — ruta totalmente pública. Solo lectura — ninguna escritura a Supabase desde estas rutas.

**Scale/Scope**: 1 torneo, hasta 6 tatamis, hasta 20 categorías, hasta 100 competidores.

## Constitution Check

El constitution.md del proyecto es un template en blanco — no hay gates específicos definidos. El feature cumple todas las convenciones del proyecto (CLAUDE.md):

- ✅ Rutas anidadas bajo `/torneo/:id/`
- ✅ Sin lógica de aritmética inline — solo display de datos ya calculados
- ✅ Nombres en español para dominio (`torneo`, `tatami`, `categoria`, `combate`), inglés para código
- ✅ Sin prop drilling más de 2 niveles
- ✅ Jerarquía Torneo → Tatami → Categoría respetada

## Project Structure

### Documentation (this feature)

```text
specs/009-vista-publica-realtime/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas (polling, filtro, reutilización)
├── data-model.md        # Entidades consumidas y flujo de datos
├── contracts/
│   └── ui-routes.md     # Contratos de rutas, estados y componentes
├── quickstart.md        # Escenarios de validación end-to-end
└── tasks.md             # Generado por /speckit-tasks
```

### Source Code (new and modified files)

```text
src/
├── pages/
│   └── publico/
│       ├── TorneoPublicoPage.jsx     # NUEVO — US1 + US2 (vista principal + filtro tatami)
│       └── CategoriaPublicoPage.jsx  # NUEVO — US3 (bracket read-only + podio)
├── lib/
│   └── combates.js                   # MODIFICAR — agregar fetchCombatesByCategoriasIds
└── App.jsx                           # MODIFICAR — agregar 2 rutas públicas sin AuthGuard
```

**Archivos reutilizados (sin modificar)**:

```text
src/components/brackets/BracketView.jsx   # bracket visual — pasar onDeclararGanador={null}
src/lib/torneos.js                        # fetchTorneoById
src/lib/tatamis.js                        # fetchTatamis
src/lib/categorias.js                     # fetchCategorias
src/lib/combates.js                       # fetchCombates (bracket page)
src/lib/competidores.js                   # fetchCompetidores
```

**Structure Decision**: Directorio `src/pages/publico/` separado de `src/pages/torneo/` (autenticado) para mantener clara la separación de acceso.

## Complexity Tracking

No hay violaciones de constitution. No hay complejidad injustificada.
