# Data Model: Gestión de Torneos — Lista y Creación

**Feature**: 001-crear-torneo | **Date**: 2026-06-03

## Entidad: Torneo

### Campos

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `id` | uuid | auto | generado por Supabase |
| `nombre` | text | sí | no vacío |
| `fecha_inicio` | date | sí | fecha válida |
| `fecha_fin` | date | sí | fecha válida, >= fecha_inicio |
| `lugar` | text | sí | no vacío |
| `logo_url` | text | no | URL pública de Supabase Storage |
| `estado` | text | auto | valor inicial: 'borrador' |
| `creado_por` | uuid | no | user_id del organizador (Auth — fase futura) |
| `created_at` | timestamptz | auto | generado por Supabase |

### Estados válidos y transiciones

```
borrador → inscripciones → en_curso → finalizado
```

- Solo avanza, nunca retrocede
- La transición `borrador → inscripciones` requiere al menos un tatami con una categoría (validado en cliente)
- Las demás transiciones se implementan en features posteriores

### Restricciones

- No hay unicidad por nombre (dos torneos pueden llamarse igual)
- El `estado` solo acepta: `borrador`, `inscripciones`, `en_curso`, `finalizado`

---

## Flujo de datos — Crear torneo con logo

```
Usuario llena formulario
        ↓
validarFormulario() → src/lib/validaciones.js
        ↓ (si válido)
supabase.storage.from('logos').upload(path, file)
        ↓
obtener URL pública del logo
        ↓
supabase.from('torneo').insert({ nombre, fecha_inicio, fecha_fin, lugar, logo_url, estado: 'borrador' })
        ↓
useTorneoStore.addTorneo(nuevoTorneo)
        ↓
Redirigir a lista → torneo aparece al tope
```

---

## Flujo de datos — Listar torneos

```
Montar página lista
        ↓
useTorneoStore.fetchTorneos()
        ↓
supabase.from('torneo').select('*').order('created_at', { ascending: false })
        ↓
Guardar en store → renderizar TorneoCard por cada torneo
        ↓ (si lista vacía)
Renderizar EmptyState con CTA
```

---

## Supabase Storage — Bucket logos

| Propiedad | Valor |
|---|---|
| Nombre bucket | `logos` |
| Acceso | Público (URLs directas sin autenticación) |
| Path de archivo | `torneos/{uuid-torneo}/{timestamp}-{nombre-original}` |
| Tipos permitidos | `image/*` |
| Tamaño máximo | 2 MB |
