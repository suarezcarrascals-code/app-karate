# Supabase Queries & Schema: Marcador Kata Individual

**Feature**: 008-marcador-kata-individual

---

## Migración SQL

```sql
-- Ejecutar en Supabase SQL Editor antes de implementar
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

## Queries en MesaKataPage

### Cargar combate al montar

```js
const { data: combate } = await supabase
  .from('combate')
  .select('*')
  .eq('id', combateId)
  .single()
```

### Cargar historial de katas del competidor AKA

```js
const { data } = await supabase
  .from('combate')
  .select('kata_anunciado_rojo')
  .eq('competidor_rojo_id', combate.competidor_rojo_id)
  .eq('categoria_id', combate.categoria_id)
  .eq('estado', 'finalizado')
  .order('created_at', { ascending: true })

const historialAka = (data ?? [])
  .map(r => r.kata_anunciado_rojo)
  .filter(Boolean)
```

### Cargar historial de katas del competidor AO

```js
const { data } = await supabase
  .from('combate')
  .select('kata_anunciado_azul')
  .eq('competidor_azul_id', combate.competidor_azul_id)
  .eq('categoria_id', combate.categoria_id)
  .eq('estado', 'finalizado')
  .order('created_at', { ascending: true })

const historialAo = (data ?? [])
  .map(r => r.kata_anunciado_azul)
  .filter(Boolean)
```

### Confirmar puntajes AKA (guardar en DB)

```js
await supabase.from('combate').update({
  estado: 'en_curso',
  kata_anunciado_rojo: kataRojo,
  j1_rojo: scoresRojo.j1,
  j2_rojo: scoresRojo.j2,
  j3_rojo: scoresRojo.j3,
  j4_rojo: scoresRojo.j4,
  j5_rojo: scoresRojo.j5,
}).eq('id', combateId)
```

### Confirmar puntajes AO (guardar en DB)

```js
await supabase.from('combate').update({
  kata_anunciado_azul: kataAzul,
  j1_azul: scoresAzul.j1,
  j2_azul: scoresAzul.j2,
  j3_azul: scoresAzul.j3,
  j4_azul: scoresAzul.j4,
  j5_azul: scoresAzul.j5,
}).eq('id', combateId)
```

### Finalizar bout

```js
await supabase.from('combate').update({
  estado: 'finalizado',
  ganador_id: ganadorId,  // competidor_rojo_id | competidor_azul_id
}).eq('id', combateId)
```

### KIKEN

```js
await supabase.from('combate').update({
  estado: 'finalizado',
  ganador_id: lado === 'rojo' ? combate.competidor_azul_id : combate.competidor_rojo_id,
}).eq('id', combateId)
```

---

## Queries en MesaKataTVPage

### Polling cada 500ms

```js
const { data } = await supabase
  .from('combate')
  .select('*')
  .eq('id', combateId)
  .single()
```

Campos leídos del resultado:
- `competidor_rojo_id`, `competidor_azul_id` → resolver nombres
- `kata_anunciado_rojo`, `kata_anunciado_azul`
- `j1_rojo`–`j5_rojo`, `j1_azul`–`j5_azul`
- `ganador_id`, `estado`

---

## Cálculo de votos (en cliente, scoring.js)

```js
import { calcularVotosJuez, determinarGanadorKataBout } from '../../lib/scoring'

const JUECES = ['j1', 'j2', 'j3', 'j4', 'j5']

function calcularResultado(combate) {
  const votos = JUECES.map(j =>
    calcularVotosJuez({
      aka: combate[`${j}_rojo`],
      ao:  combate[`${j}_azul`],
    })
  )
  const ganador = determinarGanadorKataBout(votos)
  return { votos, ganador }
}
```

---

## Validación antes de confirmar (en cliente)

```js
function validarSinEmpates(scoresRojo, scoresAzul) {
  const JUECES = ['j1', 'j2', 'j3', 'j4', 'j5']
  const conflictos = JUECES.filter(j => scoresRojo[j] === scoresAzul[j] && scoresRojo[j] !== null)
  return conflictos // array vacío = sin conflictos
}
```

Esta validación solo se ejecuta cuando ambos lados están confirmados (antes de mostrar el resultado). No se puede validar antes porque los puntajes de AO aún no existen cuando se confirman los de AKA.
