# Data Model: Marcador Kata Individual

**Feature**: 008-marcador-kata-individual

---

## Cambios en tabla existente: `combate`

No se crea tabla nueva. Se extiende `combate` con 12 columnas opcionales (nullable = no ingresado aún).

### Columnas nuevas

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `kata_anunciado_rojo` | `TEXT` | `NULL` | Kata anunciado por competidor rojo antes de actuar |
| `kata_anunciado_azul` | `TEXT` | `NULL` | Kata anunciado por competidor azul antes de actuar |
| `j1_rojo` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 1 para AKA. NULL = no ingresado |
| `j2_rojo` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 2 para AKA |
| `j3_rojo` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 3 para AKA |
| `j4_rojo` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 4 para AKA |
| `j5_rojo` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 5 para AKA |
| `j1_azul` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 1 para AO. NULL = no ingresado |
| `j2_azul` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 2 para AO |
| `j3_azul` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 3 para AO |
| `j4_azul` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 4 para AO |
| `j5_azul` | `DECIMAL(4,1)` | `NULL` | Puntaje del juez 5 para AO |

### Valores válidos por columna de puntaje

- `NULL` → puntaje no ingresado aún
- `0.0` → descalificación (DQ)
- `5.0` a `10.0` con step `0.1` → puntaje válido WKF
- Cualquier otro valor es inválido (validar en cliente, no en DB)

### Columnas existentes reutilizadas sin cambios

| Columna | Uso en kata individual |
|---------|----------------------|
| `estado` | `pendiente` → `en_curso` → `finalizado` (mismo flujo que kumite) |
| `ganador_id` | UUID del `competidor_id` ganador del bout |
| `competidor_rojo_id` | AKA |
| `competidor_azul_id` | AO |
| `categoria_id`, `tatami_id`, `ronda`, `orden_en_ronda` | Sin cambios |

### Columnas existentes ignoradas en kata

Las siguientes columnas existen en la tabla pero no se usan para kata individual:
`puntos_rojo`, `puntos_azul`, `penalizaciones_rojo`, `penalizaciones_azul`, `amon_rojo`, `amon_azul`, `shikkaku_rojo`, `shikkaku_azul`, `senshu`, `timer_seg_restantes`, `timer_activo`, `timer_inicio_ts`.

---

## SQL de migración

```sql
-- Ejecutar en Supabase SQL Editor
ALTER TABLE combate
  ADD COLUMN IF NOT EXISTS kata_anunciado_rojo  TEXT,
  ADD COLUMN IF NOT EXISTS kata_anunciado_azul  TEXT,
  ADD COLUMN IF NOT EXISTS j1_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j2_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j3_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j4_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j5_rojo  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j1_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j2_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j3_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j4_azul  DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS j5_azul  DECIMAL(4,1);
```

---

## Consulta de historial de katas

Para la validación de repetición de kata, se consultan los combates finalizados del mismo competidor en la misma categoría:

```js
// Historial de katas para el competidor que pelea como ROJO (AKA)
const { data: histRojo } = await supabase
  .from('combate')
  .select('kata_anunciado_rojo')
  .eq('competidor_rojo_id', competidorRojoId)
  .eq('categoria_id', catId)
  .eq('estado', 'finalizado')
  .order('created_at', { ascending: true })

// Historial de katas para el competidor que pelea como AZUL (AO)
const { data: histAzul } = await supabase
  .from('combate')
  .select('kata_anunciado_azul')
  .eq('competidor_azul_id', competidorAzulId)
  .eq('categoria_id', catId)
  .eq('estado', 'finalizado')
  .order('created_at', { ascending: true })
```

El historial resultante es un array de strings: `['Bassai Dai', 'Kanku Dai', ...]`.

---

## Inferencia de fase al recargar

Al cargar `MesaKataPage`, la fase actual se infiere del estado de la fila en DB:

```
combate.estado === 'finalizado'  →  fase = 'resultado'
combate.j1_rojo !== null         →  fase = 'azul_performance'  (AKA ya confirmado)
else                             →  fase = 'anuncio'
```

Esto permite recuperar el panel tras un reload sin perder el progreso.

---

## Validación de reglas WKF (en cliente, scoring.js)

Las siguientes reglas se validan en el cliente usando `scoring.js`:

1. `calcularVotosJuez({ aka, ao })` — lanza error si `aka === ao`
2. `determinarGanadorKataBout(votos)` — lanza error si array vacío o longitud par
3. `validarKataPermitido(kata, historial)`:
   - `false` si `historial[historial.length - 1] === kata` (repetición consecutiva)
   - `false` si `historial.filter(k => k === kata).length >= 2` (ya usado 2 veces)
   - `true` en cualquier otro caso

Ninguna de estas validaciones se implementa en DB triggers ni RLS.
