# Quickstart — Validación end-to-end: Gestión de Torneos

**Feature**: 001-crear-torneo | **Date**: 2026-06-03

## Prerequisitos

1. App corriendo: `npm run dev` → `http://localhost:5173`
2. Supabase proyecto activo con tabla `torneo` creada
3. Bucket `logos` creado en Supabase Storage (público)
4. Variables de entorno en `.env` configuradas

## Escenario 1 — Lista vacía (P1)

1. Abrir `http://localhost:5173`
2. **Esperado**: pantalla de estado vacío con botón "Crear torneo"
3. No debe aparecer ninguna tarjeta de torneo

## Escenario 2 — Crear torneo sin logo (P2)

1. Hacer clic en "Crear torneo"
2. **Esperado**: navegar a `/torneos/nuevo`
3. Completar el formulario:
   - Nombre: `Torneo Prueba 2026`
   - Fecha inicio: `2026-08-01`
   - Fecha fin: `2026-08-03`
   - Lugar: `Gimnasio Municipal`
   - Logo: dejar vacío
4. Hacer clic en "Guardar"
5. **Esperado**: redirigir a lista, el torneo aparece con estado "borrador"

## Escenario 3 — Crear torneo con logo (P2)

1. Repetir Escenario 2 pero subir una imagen < 2 MB en el campo Logo
2. **Esperado**: el torneo aparece en la lista con la imagen del logo visible

## Escenario 4 — Validaciones de formulario (FR-004, FR-005)

| Acción | Esperado |
|---|---|
| Guardar sin nombre | Error: "El nombre es obligatorio" |
| Guardar sin lugar | Error: "El lugar es obligatorio" |
| Fecha fin < fecha inicio | Error: "La fecha de fin debe ser posterior a la de inicio" |
| Logo > 2 MB | Error: "El logo no puede superar 2 MB" |
| Logo no es imagen | Error: "El archivo debe ser una imagen" |

## Escenario 5 — Tests de validaciones (Vitest)

```bash
npm run test
```

**Esperado**: todos los tests en `src/lib/validaciones.test.js` pasan en verde

## Escenario 6 — Supabase Dashboard

1. Abrir Supabase → Table Editor → `torneo`
2. **Esperado**: el torneo creado en Escenario 2 aparece con `estado = 'borrador'`
3. Si se subió logo: ir a Storage → logos → torneos → verificar que el archivo existe
