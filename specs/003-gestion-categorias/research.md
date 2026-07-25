# Research: Gestión de Categorías

**Feature**: 003-gestion-categorias | **Date**: 2026-06-03

## 1. Migración de la tabla `categoria`

**Decision**: Agregar columnas `tatami_id` (nullable, FK), `orden_en_tatami` (int nullable) a la tabla existente. La tabla ya existe en DB sin estas columnas.

**Rationale**: La tabla fue creada con `tatami_id` y `torneo_id` en el SQL original. Verificar si `orden_en_tatami` ya existe; si no, se agrega con `ALTER TABLE`.

**SQL necesario**:
```sql
alter table categoria add column if not exists orden_en_tatami int;
```

---

## 2. Nueva tabla `movimiento_categoria`

**Decision**: Tabla append-only de historial. Solo INSERT, nunca UPDATE ni DELETE.

**Rationale**: La trazabilidad es inmutable por diseño — el organizador no puede editar el historial.

**Schema**:
```sql
create table movimiento_categoria (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categoria(id) on delete cascade,
  tatami_id_anterior uuid references tatami(id) on delete set null,
  tatami_id_nuevo uuid references tatami(id) on delete set null,
  motivo text,
  created_at timestamptz not null default now()
);
```

---

## 3. Unicidad de orden en tatami

**Decision**: Validar unicidad de `(tatami_id, orden_en_tatami)` en cliente antes de insertar. Constraint en DB como respaldo.

**Rationale**: La validación en cliente da mejor UX (mensaje inmediato). El constraint en DB previene inconsistencias si hay requests concurrentes.

**SQL**:
```sql
alter table categoria add constraint uq_tatami_orden unique (tatami_id, orden_en_tatami);
```

**En cliente**: antes de asignar, consultar qué órdenes ya están ocupados en ese tatami y mostrar los disponibles.

---

## 4. Movimiento de categoría — flujo optimista vs conservador

**Decision**: Flujo conservador — primero actualizar en DB, luego actualizar el store local.

**Rationale**: El movimiento afecta datos visibles al público en tiempo real. Un fallo silencioso causaría inconsistencia entre la vista del organizador y la vista pública.

---

## 5. Competidor fuera de rango — campo `inscripcion_manual`

**Decision**: Agregar columna `inscripcion_manual boolean default false` a la tabla `competidor`.

**Rationale**: Necesario para mostrar el marcador visual en UI y para auditoría. No es un estado de la categoría sino del vínculo competidor→categoría.

**SQL**:
```sql
alter table competidor add column if not exists inscripcion_manual boolean not null default false;
```

---

## 6. Cronograma del tatami en el dashboard

**Decision**: El dashboard `/torneo/:id` existente muestra los tatamis. Agregar enlace desde cada tatami a su cronograma de categorías ordenado por `orden_en_tatami`.

**Rationale**: El organizador necesita ver el cronograma del día por tatami desde el dashboard principal.
