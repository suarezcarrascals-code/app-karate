# Data Model: Inscripción de Competidores

## Migraciones SQL requeridas

Ejecutar en el SQL Editor de Supabase **en este orden**:

### 1. Tabla `competidor`

```sql
CREATE TABLE IF NOT EXISTS competidor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  torneo_id uuid NOT NULL REFERENCES torneo(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  club text,
  pais text,
  fecha_nacimiento date,
  peso numeric(5,2),
  cinturon text,
  estado text NOT NULL DEFAULT 'inscrito'
    CHECK (estado IN ('inscrito', 'confirmado', 'descalificado')),
  inscripcion_manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE competidor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura publica competidores" ON competidor FOR SELECT USING (true);
CREATE POLICY "escritura publica competidores" ON competidor FOR INSERT WITH CHECK (true);
CREATE POLICY "modificacion publica competidores" ON competidor FOR UPDATE USING (true);
CREATE POLICY "eliminacion publica competidores" ON competidor FOR DELETE USING (true);
```

### 2. Tabla `equipo` (P3 — puede ejecutarse después)

```sql
CREATE TABLE IF NOT EXISTS equipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  club text,
  miembro_1_id uuid NOT NULL REFERENCES competidor(id),
  miembro_2_id uuid NOT NULL REFERENCES competidor(id),
  miembro_3_id uuid NOT NULL REFERENCES competidor(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lectura publica equipos" ON equipo FOR SELECT USING (true);
CREATE POLICY "escritura publica equipos" ON equipo FOR INSERT WITH CHECK (true);
CREATE POLICY "eliminacion publica equipos" ON equipo FOR DELETE USING (true);
```

---

## Entidades

### `competidor`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | uuid | auto | PK |
| `torneo_id` | uuid | sí | FK → torneo |
| `categoria_id` | uuid | sí | FK → categoria |
| `nombre` | text | sí | |
| `apellido` | text | sí | |
| `club` | text | no | |
| `pais` | text | no | texto libre |
| `fecha_nacimiento` | date | no | para calcular edad |
| `peso` | numeric(5,2) | no | en kg |
| `cinturon` | text | no | texto libre |
| `estado` | text | sí | `inscrito` \| `confirmado` \| `descalificado` |
| `inscripcion_manual` | boolean | sí | `true` si se confirmó fuera de rango |
| `created_at` | timestamptz | auto | |

### `equipo` (P3)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | uuid | auto | PK |
| `categoria_id` | uuid | sí | FK → categoria |
| `nombre` | text | sí | nombre del equipo |
| `club` | text | no | |
| `miembro_1_id` | uuid | sí | FK → competidor |
| `miembro_2_id` | uuid | sí | FK → competidor |
| `miembro_3_id` | uuid | sí | FK → competidor |

---

## Estado del competidor

```
inscrito → confirmado    (al cerrar inscripciones)
inscrito → descalificado (por árbitro/organizador)
```

Los estados solo avanzan — nunca retroceden.

---

## Relaciones

```
torneo (1) ──── (N) competidor
categoria (1) ── (N) competidor
categoria (1) ── (N) equipo         [solo modalidades _equipo]
competidor (1) ─ (1..3) equipo      [un competidor en máximo 1 equipo por categoría]
```

---

## Lógica de negocio en `src/lib/competidores.js`

- `calcularEdad(fechaNacimiento)` → número entero o `null`
- `estaFueraDeRango` → importada de `categorias.js`, no duplicada
- `fetchCompetidores(categoriaId)` → array de competidores
- `insertCompetidor(datos)` → competidor creado con id
- `deleteCompetidor(id)` → void
- `fetchEquipos(categoriaId)` → array con miembros expandidos (P3)
- `insertEquipo(datos)` → equipo creado (P3)
