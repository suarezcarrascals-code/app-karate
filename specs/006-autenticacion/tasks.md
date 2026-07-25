# Tasks: Autenticación y Control de Acceso

**Input**: Conversación de diseño — ver CLAUDE.md sección "Autenticación y acceso"

**Resumen**: Login con email + contraseña. Registro libre pero con aprobación manual del admin. Aislamiento total entre organizadores por RLS. Mesa técnica accede por link temporal que expira al cerrar el torneo. Rutas protegidas por AuthGuard.

---

## Phase 1: Setup — DB en Supabase

**Purpose**: Tablas, triggers y políticas antes de cualquier código.

- [ ] T001 Ejecutar SQL: crear tabla `profiles` (id, user_id references auth.users, nombre, email, estado: `pendiente|activo|rechazado`, role: `organizador|admin`, created_at)
- [ ] T002 Ejecutar SQL: habilitar RLS en `profiles` + políticas:
  - authenticated puede leer y actualizar su propio perfil (`user_id = auth.uid()`)
  - service_role puede leer y actualizar cualquier perfil (para el admin)
- [ ] T003 Ejecutar SQL: crear trigger en `auth.users` que inserta un `profile` con `estado = 'pendiente'` automáticamente al registrarse un usuario
- [ ] T004 Ejecutar SQL: crear tabla `link_mesa_tecnica` (id, token uuid unique default gen_random_uuid(), torneo_id, tatami_id, estado: `activo|inactivo`, created_at). El link expira automáticamente cuando el torneo pasa a `finalizado`.
- [ ] T005 Ejecutar SQL: RLS en `link_mesa_tecnica`:
  - organizador puede CRUD sobre links de sus torneos
  - anon puede SELECT solo si el link está activo Y el torneo está `en_curso`
- [ ] T006 Ejecutar SQL: actualizar RLS en `link_inscripcion` para que las políticas del organizador usen `auth.uid()` correctamente (ya están definidas, verificar que funcionan post-auth)
- [ ] T007 Ejecutar SQL: habilitar RLS en tablas que aún no lo tengan (`torneo`, `tatami`, `categoria`, `dojo`, `competidor`) y agregar políticas `FOR ALL TO authenticated USING (... auth.uid() ...)` donde falten

---

## Phase 2: Foundational — Lib y Store de Auth (EDD)

**Purpose**: Lógica de autenticación. Tests primero.

- [ ] T008 Escribir tests en `src/lib/auth.test.js`:
  - `signIn(email, password)` retorna sesión o lanza error
  - `signUp(email, password, nombre)` retorna usuario con estado `pendiente`
  - `signOut()` no lanza error
  - `fetchProfile(userId)` retorna perfil con `estado` y `role`
- [ ] T009 Implementar `src/lib/auth.js`: `signIn`, `signUp`, `signOut`, `fetchProfile`, `approveUser`, `rejectUser`
- [ ] T010 Implementar `src/stores/useAuthStore.js` con Zustand: estado `user`, `profile`, `loading`, `error`; acciones `signIn`, `signUp`, `signOut`, `fetchProfile`; inicializar sesión existente al montar (`supabase.auth.getSession`)

**Checkpoint**: `npm run test` verde.

---

## Phase 3: Páginas de Auth

**Goal**: El organizador puede registrarse, iniciar sesión y ver el estado de su cuenta.

- [ ] T011 [P] Crear `src/pages/auth/LoginPage.jsx` — formulario email + contraseña, botón "Iniciar sesión", link a registro. Al iniciar sesión redirige al dashboard o a PendingPage si el perfil está pendiente.
- [ ] T012 [P] Crear `src/pages/auth/RegisterPage.jsx` — formulario nombre + email + contraseña, botón "Crear cuenta". Al registrarse muestra PendingPage.
- [ ] T013 [P] Crear `src/pages/auth/PendingPage.jsx` — pantalla "Tu cuenta está siendo revisada. Te avisamos por email cuando esté lista." Sin botones de navegación al torneo.
- [ ] T014 Agregar rutas en `src/App.jsx`: `/login`, `/registro`, `/pendiente` (fuera de TorneoLayout, sin protección)

**Checkpoint**: El organizador puede registrarse y ver la pantalla de pendiente.

---

## Phase 4: Protección de Rutas

**Goal**: Nadie sin cuenta aprobada puede acceder a las páginas del torneo.

- [ ] T015 Crear `src/components/auth/AuthGuard.jsx` — wrapper que verifica sesión activa + perfil `estado === 'activo'`; si no hay sesión redirige a `/login`; si hay sesión pero está pendiente redirige a `/pendiente`; si está activo renderiza los hijos
- [ ] T016 Actualizar `src/App.jsx`: envolver todas las rutas bajo `/torneo/*` y `/torneos/nuevo` con `AuthGuard`
- [ ] T017 Actualizar `src/pages/torneo/TorneoLayout.jsx`: agregar botón "Cerrar sesión" en el header/sidebar, mostrar nombre del organizador logueado

**Checkpoint**: Si no estás logueado, todas las rutas del torneo redirigen a `/login`.

---

## Phase 5: Panel de Admin — Aprobación de Usuarios

**Goal**: El admin puede ver los registros pendientes y aprobarlos o rechazarlos.

- [ ] T018 [P] Crear `src/pages/admin/AdminPage.jsx` — lista de usuarios con `estado = 'pendiente'`, botones "Aprobar" y "Rechazar" por usuario. Solo accesible si el perfil tiene `role = 'admin'`.
- [ ] T019 Agregar ruta en `src/App.jsx`: `/admin` → `AdminPage` (protegida por AuthGuard + verificación de role admin)
- [ ] T020 Crear en Supabase: **un usuario admin manual** — registrar `sansuca.ia@gmail.com` y actualizar su `profile.role = 'admin'` y `profile.estado = 'activo'` directamente en el SQL Editor

**Checkpoint**: El admin puede entrar a `/admin`, ver pendientes y aprobarlos.

---

## Phase 6: Notificación al Admin por Email

**Goal**: El admin recibe un email cuando alguien se registra para poder aprobarlo.

- [ ] T021 Configurar en Supabase Dashboard → Edge Functions o Database Webhooks: al insertar en `profiles` con `estado = 'pendiente'`, enviar email a `sansuca.ia@gmail.com` con nombre y email del nuevo usuario y link directo a `/admin`
- [ ] T022 Configurar en Supabase Dashboard → Auth → Email Templates: personalizar el email de confirmación que recibe el organizador al registrarse (indicar que su cuenta será revisada)

---

## Phase 7: Acceso Mesa Técnica por Link

**Goal**: El organizador genera un link por tatami; la mesa técnica lo abre sin login y opera el marcador mientras el torneo esté activo.

- [ ] T023 Crear `src/lib/linksMesaTecnica.js`: `fetchLinksMesaTecnica(torneoId)`, `generarLinkMesaTecnica(torneoId, tatamiId)`, `desactivarLinkMesaTecnica(linkId)`, `fetchLinkMesaTecnicaByToken(token)` — solo válido si torneo está `en_curso`
- [ ] T024 Actualizar `src/pages/torneo/TorneoLayout.jsx` o la página de tatamis: agregar sección para generar y copiar links de mesa técnica por tatami
- [ ] T025 Crear `src/pages/MarcadorPublico.jsx` — abre el marcador del tatami vía `/marcador/:token` sin login; verifica que el token sea válido y el torneo esté activo; muestra el panel de puntuación correspondiente (kumite o kata según la modalidad del combate activo)
- [ ] T026 Agregar ruta pública en `src/App.jsx`: `/marcador/:token` → `MarcadorPublico`

**Checkpoint**: El organizador genera el link, la mesa técnica lo abre sin login y puede operar el marcador.

---

## Phase 8: Polish

- [ ] T027 Ejecutar `npm run test` — todos los tests en verde
- [ ] T028 Verificar flujo completo: registro → pendiente → aprobación → login → crear torneo → generar links → cerrar sesión
- [ ] T029 Verificar que un organizador NO puede ver torneos de otro (probar con dos cuentas)
- [ ] T030 Verificar que el link de mesa técnica deja de funcionar al finalizar el torneo

---

## Dependencies & Execution Order

- **Phase 1** (DB): Sin dependencias — ejecutar primero
- **Phase 2** (lib + store): Depende de Phase 1
- **Phase 3** (páginas auth): T011, T012, T013 en paralelo → T014
- **Phase 4** (protección): Depende de Phase 2 + Phase 3
- **Phase 5** (admin): Depende de Phase 2 → T018, T019 en paralelo → T020
- **Phase 6** (email): Independiente, puede hacerse en cualquier momento post Phase 1
- **Phase 7** (mesa técnica): Depende de Phase 4 → T023 → T024, T025 en paralelo → T026
- **Phase 8** (polish): Depende de todo lo anterior

## MVP mínimo

Phase 1 + 2 + 3 + 4 + 5 (T020) = el organizador puede registrarse, el admin aprueba manualmente desde `/admin`, y las rutas están protegidas. Sin email automático ni mesa técnica por link.
