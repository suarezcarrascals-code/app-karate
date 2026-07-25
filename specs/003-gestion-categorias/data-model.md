# Data Model: Gestión de Categorías

**Feature**: 003-gestion-categorias | **Date**: 2026-06-03

## Entidad: Categoria (tabla existente + columnas nuevas)

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `id` | uuid | auto | generado |
| `torneo_id` | uuid | sí | FK a torneo.id |
| `tatami_id` | uuid | no | FK a tatami.id (nullable — sin asignar hasta que el organizador lo asigne) |
| `orden_en_tatami` | int | no | nullable; único por `(tatami_id, orden_en_tatami)` |
| `nombre` | text | sí | no vacío |
| `modalidad` | text | sí | kata_individual / kata_equipo / kumite_individual / kumite_equipo |
| `genero` | text | sí | masculino / femenino / mixto |
| `edad_min` | int | no | nullable |
| `edad_max` | int | no | nullable |
| `peso_min` | numeric | no | nullable (solo kumite) |
| `peso_max` | numeric | no | nullable (solo kumite) |
| `cinturon_min` | text | no | nullable |
| `cinturon_max` | text | no | nullable |
| `estado` | text | sí | abierta / cerrada / en_curso / finalizada |
| `created_at` | timestamptz | auto | |

**SQL de migración necesario**:
```sql
alter table categoria add column if not exists orden_en_tatami int;
alter table categoria add constraint if not exists uq_tatami_orden unique (tatami_id, orden_en_tatami);
```

---

## Entidad: Movimiento_categoria (tabla nueva)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | uuid | auto | generado |
| `categoria_id` | uuid | sí | FK a categoria.id |
| `tatami_id_anterior` | uuid | no | nullable si era la primera asignación |
| `tatami_id_nuevo` | uuid | no | nullable si se desasigna |
| `motivo` | text | no | campo libre, opcional |
| `created_at` | timestamptz | auto | inmutable |

**SQL de creación**:
```sql
create table movimiento_categoria (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categoria(id) on delete cascade,
  tatami_id_anterior uuid references tatami(id) on delete set null,
  tatami_id_nuevo uuid references tatami(id) on delete set null,
  motivo text,
  created_at timestamptz not null default now()
);
alter table movimiento_categoria enable row level security;
create policy "lectura publica movimientos" on movimiento_categoria for select using (true);
create policy "escritura publica movimientos" on movimiento_categoria for insert with check (true);
grant select, insert on movimiento_categoria to anon;
grant all on movimiento_categoria to authenticated;
```

---

## Entidad: Competidor (campo nuevo)

```sql
alter table competidor add column if not exists inscripcion_manual boolean not null default false;
```

---

## Estado de Categoria — transiciones

```
abierta → cerrada → en_curso → finalizada
```

Solo avanza. El movimiento de tatami no afecta el estado — son dimensiones independientes.

---

## Flujo: Asignar categoría a tatami

```
Organizador elige categoría + tatami + orden
        ↓
verificarOrdenDisponible(tatami_id, orden) → client-side
        ↓ (orden ocupado)
Mostrar órdenes disponibles → usuario elige otro
        ↓ (orden libre)
supabase.from('categoria').update({ tatami_id, orden_en_tatami }).eq('id', categoriaId)
        ↓
supabase.from('movimiento_categoria').insert({ categoria_id, tatami_id_anterior: null, tatami_id_nuevo: tatami_id })
        ↓
Store actualiza categoria local → vista pública se actualiza vía Realtime
```

---

## Flujo: Mover categoría entre tatamis

```
Organizador elige categoría + nuevo tatami + nuevo orden
        ↓ (si estado === 'en_curso')
Modal: "Esta categoría está en competencia activa. ¿Confirmás el movimiento?"
        ↓ (confirma)
supabase.from('categoria').update({ tatami_id: nuevoTatamiId, orden_en_tatami: nuevoOrden })
        ↓
supabase.from('movimiento_categoria').insert({ categoria_id, tatami_id_anterior, tatami_id_nuevo, motivo })
        ↓
Store actualiza local → vista pública actualiza en tiempo real
```

---

## Relaciones

```
torneo (1) ──── (N) categoria ──── (N) movimiento_categoria
                     │
              (0..1) tatami
```
