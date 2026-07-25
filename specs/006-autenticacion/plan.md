# Implementation Plan: Autenticación y Control de Acceso

**Branch**: `006-autenticacion` | **Date**: 2026-06-06

## Summary

Login con email + contraseña. Registro con aprobación manual del admin. Aislamiento total entre organizadores por RLS. Mesa técnica accede por link temporal. Ver CLAUDE.md sección "Autenticación y acceso".

## Technical Context

**Language/Version**: JavaScript ES2022 — React 19 + Vite 8

**Primary Dependencies**: Supabase Auth (built-in), Zustand 5, React Router 7, Tailwind CSS 4

**Storage**: Supabase — tabla `profiles` nueva; `link_mesa_tecnica` nueva; RLS en todas las tablas existentes

**Testing**: Vitest 4 — EDD para `src/lib/auth.js`

**Target Platform**: Web SPA — desktop para organizador y admin; mobile para vistas públicas

## Project Structure

```text
src/
  pages/
    auth/
      LoginPage.jsx
      RegisterPage.jsx
      PendingPage.jsx
    admin/
      AdminPage.jsx
    MarcadorPublico.jsx      ← marcador vía link mesa técnica (sin login)

  components/
    auth/
      AuthGuard.jsx          ← protege rutas

  lib/
    auth.js
    auth.test.js
    linksMesaTecnica.js

  stores/
    useAuthStore.js

App.jsx                      ← rutas auth + admin + marcador público
```
