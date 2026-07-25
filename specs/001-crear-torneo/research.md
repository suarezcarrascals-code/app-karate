# Research: Gestión de Torneos — Lista y Creación

**Feature**: 001-crear-torneo | **Date**: 2026-06-03

## Decisiones técnicas

### 1. Upload de logos — Supabase Storage

**Decision**: Usar Supabase Storage con bucket público `logos`.

**Rationale**: Supabase Storage está incluido en el plan gratuito, se integra nativamente con supabase-js, y genera URLs públicas que se guardan directamente en `torneo.logo_url`. No requiere un servidor propio.

**Flow**:
1. El usuario selecciona una imagen en el `<input type="file">`
2. Se valida tamaño (≤ 2 MB) y tipo (image/*) antes de subir
3. Se sube a Storage: `supabase.storage.from('logos').upload(path, file)`
4. Se obtiene la URL pública y se guarda en el campo `logo_url` del torneo

**Alternatives considered**:
- Base64 en la DB — rechazado: infla el tamaño de la tabla y complica las queries
- Servicio externo (Cloudinary) — rechazado: agrega dependencia externa innecesaria en esta etapa

---

### 2. Estado global de torneos — Zustand

**Decision**: Un store `useTorneoStore` con la lista de torneos y acciones `fetchTorneos`, `addTorneo`.

**Rationale**: La lista se necesita en la página de lista y potencialmente en el dashboard. Zustand evita prop drilling y refetching innecesario.

**Store shape**:
```js
{
  torneos: [],
  loading: false,
  error: null,
  fetchTorneos: async () => {},
  addTorneo: async (data) => {},
}
```

**Alternatives considered**:
- React Query — rechazado: añade dependencia; para este scope Zustand es suficiente
- Context API — rechazado: más verboso y limitado que Zustand para actualizaciones

---

### 3. Validaciones de formulario — client-side en lib/

**Decision**: Funciones puras en `src/lib/validaciones.js`, testeadas con Vitest.

**Rationale**: El CLAUDE.md exige que toda lógica de negocio viva en `src/lib/`. Las validaciones son lógica de negocio (reglas de fechas, límites de tamaño). Al ser funciones puras son fácilmente testeables.

**Reglas a implementar**:
- `nombre` no vacío
- `fecha_inicio` válida
- `fecha_fin` válida y >= `fecha_inicio`
- `logo` (si presente): tipo image/*, tamaño <= 2 MB

**Alternatives considered**:
- Validación inline en el componente — rechazado: viola la convención del proyecto
- Librería de forms (react-hook-form, zod) — diferido: añade complejidad; las validaciones actuales son simples y se manejan con funciones puras

---

### 4. Rutas

**Decision**: `/` para lista de torneos, `/torneos/nuevo` para formulario de creación.

**Rationale**: La lista es la pantalla raíz del organizador. El formulario es una ruta separada (no modal) para permitir navegación directa y botón "atrás" del navegador.

**Alternatives considered**:
- Modal de creación en la lista — diferido: más compleja de implementar y limita el espacio para el formulario en mobile
