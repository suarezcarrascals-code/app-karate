# Data Model: Gestión de Tatamis

**Feature**: 002-gestion-tatamis | **Date**: 2026-06-03

## Entidad: Tatami

### Campos

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `id` | uuid | auto | generado por Supabase |
| `torneo_id` | uuid | sí | FK a torneo.id |
| `nombre` | text | sí | no vacío |
| `orden` | int | auto | `max(orden en torneo) + 1` |
| `arbitro_id` | text | no | nombre libre (nullable) — será FK a users cuando haya Auth |
| `created_at` | timestamptz | auto | generado por Supabase |

> Nota: el campo `arbitro_id` en la DB es `uuid nullable` (referencia a auth.users). En esta fase sin Auth, se almacena como texto en un campo auxiliar o se deja null. Ver sección de assumptions.

### Restricciones

- Un tatami pertenece a exactamente un torneo (`torneo_id` NOT NULL)
- El orden es único por torneo (no hay dos tatamis con el mismo orden en el mismo torneo)
- No hay restricción de nombre único por torneo

---

## Flujo de datos — Listar tatamis del torneo

```
Montar dashboard /torneo/:id
        ↓
useTatamiStore.fetchTatamis(torneoId)
        ↓
supabase.from('tatami').select('*').eq('torneo_id', torneoId).order('orden')
        ↓
Guardar en store → renderizar TatamiCard por cada tatami
        ↓ (si vacío)
Renderizar TatamiEmptyState con CTA
```

---

## Flujo de datos — Crear tatami

```
Organizador completa nombre (+ árbitro opcional) → submit
        ↓
validarNombreTatami(nombre) → src/lib/tatamis.js
        ↓ (si válido)
calcularOrden(tatamis actuales del store)
        ↓
supabase.from('tatami').insert({ torneo_id, nombre, orden, arbitro_id: null })
        ↓
useTatamiStore.addTatami(nuevoTatami)
        ↓
Formulario se limpia → nuevo tatami aparece en la lista
```

---

## Flujo de datos — Eliminar tatami

```
Organizador hace clic en "Eliminar"
        ↓
Modal de confirmación
        ↓ (confirma)
supabase.from('categoria').select('count').eq('tatami_id', id)
        ↓ (count > 0)
Mostrar mensaje: "Primero eliminá las categorías del tatami"
        ↓ (count = 0)
supabase.from('tatami').delete().eq('id', id)
        ↓
useTatamiStore.removeTatami(id)
        ↓
Tatami desaparece de la lista
```

---

## Relación con Torneo

```
torneo (1) ──── (N) tatami
                     └── (N) categoria (feature 003)
```

El dashboard en `/torneo/:id` necesita cargar tanto el torneo (para mostrar nombre y verificar estado) como los tatamis (lista editable).
