# Data Model: Links de Inscripción por Club

## Tabla nueva: `link_inscripcion`

```sql
CREATE TABLE link_inscripcion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token         uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),  -- el identificador público en la URL
  torneo_id     uuid NOT NULL REFERENCES torneo(id) ON DELETE CASCADE,
  dojo_id       uuid NOT NULL REFERENCES dojo(id) ON DELETE CASCADE,
  limite_atletas int  NOT NULL CHECK (limite_atletas > 0),
  estado        text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (torneo_id, dojo_id)  -- un link activo por club por torneo
);
```

**Notas**:
- `token` es el UUID que va en la URL pública (`/inscripcion/:token`). Es diferente del `id` interno.
- La constraint `UNIQUE (torneo_id, dojo_id)` garantiza un solo link por club por torneo. Si se genera uno nuevo, el anterior se desactiva primero (lógica en la app, no en DB).
- `estado` solo puede ser `activo` o `inactivo`. Cuando el organizador cierra inscripciones del torneo, se actualiza masivamente a `inactivo`.

---

## Modificación tabla existente: `competidor`

```sql
ALTER TABLE competidor
  ADD COLUMN link_inscripcion_id uuid REFERENCES link_inscripcion(id) ON DELETE SET NULL;
```

**Notas**:
- Nullable — los competidores inscritos manualmente por el organizador no tienen `link_inscripcion_id`.
- Permite contar exactamente cuántos atletas se inscribieron por cada link: `COUNT(*) WHERE link_inscripcion_id = :id`.
- `ON DELETE SET NULL`: si se elimina el link, los competidores quedan en el sistema sin la referencia.

---

## RLS (Row Level Security)

### `link_inscripcion`

```sql
-- El organizador puede hacer todo sobre los links de sus torneos
CREATE POLICY "organizador_full" ON link_inscripcion
  FOR ALL USING (
    torneo_id IN (SELECT id FROM torneo WHERE creado_por = auth.uid())
  );

-- Anónimo puede leer un link activo por su token (para la página pública)
CREATE POLICY "anon_read_by_token" ON link_inscripcion
  FOR SELECT USING (estado = 'activo');
-- (el filtro por token lo hace la query, no la policy)
```

### `competidor` (adición a las políticas existentes)

```sql
-- Anónimo puede insertar un competidor si:
-- 1. El link_inscripcion_id corresponde a un link activo
-- 2. El conteo actual < limite_atletas
CREATE POLICY "anon_insert_via_link" ON competidor
  FOR INSERT WITH CHECK (
    link_inscripcion_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM link_inscripcion li
      WHERE li.id = link_inscripcion_id
        AND li.estado = 'activo'
        AND (
          SELECT COUNT(*) FROM competidor c
          WHERE c.link_inscripcion_id = li.id
        ) < li.limite_atletas
    )
  );

-- Anónimo puede leer solo los competidores de su link (para mostrar la lista)
CREATE POLICY "anon_read_via_link" ON competidor
  FOR SELECT USING (
    link_inscripcion_id IS NOT NULL
  );
```

### `categoria`, `dojo`, `torneo`

```sql
-- Anónimo puede leer categorías activas de cualquier torneo (para la página de inscripción)
CREATE POLICY "anon_read_categorias" ON categoria
  FOR SELECT USING (estado = 'abierta');

-- Anónimo puede leer dojos (nombre del club para mostrar en la página)
CREATE POLICY "anon_read_dojos" ON dojo
  FOR SELECT USING (true);

-- Anónimo puede leer torneos (nombre del torneo para mostrar en la página)
CREATE POLICY "anon_read_torneos" ON torneo
  FOR SELECT USING (true);
```

---

## Estado del link — transiciones

```
no_generado → activo      (organizador genera el link)
activo      → inactivo    (organizador desactiva, o se cierran inscripciones del torneo)
inactivo    → activo      (organizador reactiva — genera uno nuevo para el mismo club)
```

Cuando se genera un nuevo link para un club que ya tiene uno activo:
1. Se desactiva el link anterior (`UPDATE link_inscripcion SET estado = 'inactivo' WHERE dojo_id = :id AND torneo_id = :id`)
2. Se inserta el nuevo link

---

## Relaciones

```
torneo (1) ──── (N) link_inscripcion (N) ──── (1) dojo
                         │
                         └── (N) competidor
```

Un torneo tiene muchos links (uno por club participante).
Un dojo tiene un solo link activo por torneo.
Un link tiene muchos competidores inscritos a través de él.
