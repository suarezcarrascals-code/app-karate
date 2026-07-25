# Contratos de Queries — Tatamis

**Feature**: 002-gestion-tatamis

## Listar tatamis de un torneo

```js
// src/lib/tatamis.js
const { data, error } = await supabase
  .from('tatami')
  .select('*')
  .eq('torneo_id', torneoId)
  .order('orden', { ascending: true })
```

**Returns**: Array de tatamis ordenados por orden ascendente.

---

## Insertar tatami

```js
// src/lib/tatamis.js
const { data, error } = await supabase
  .from('tatami')
  .insert({ torneo_id, nombre, orden })
  .select()
  .single()
```

**Returns**: El tatami recién creado con su `id`.

---

## Verificar si tatami tiene categorías

```js
// src/lib/tatamis.js
const { count, error } = await supabase
  .from('categoria')
  .select('*', { count: 'exact', head: true })
  .eq('tatami_id', tatamiId)
```

**Returns**: `count` — número de categorías asociadas. Si > 0, bloquear eliminación.

---

## Eliminar tatami

```js
// src/lib/tatamis.js
const { error } = await supabase
  .from('tatami')
  .delete()
  .eq('id', tatamiId)
```

**Precondición**: verificar que count de categorías sea 0 antes de llamar.

---

## Obtener torneo por id

```js
// src/lib/torneos.js (ya existe — agregar función)
const { data, error } = await supabase
  .from('torneo')
  .select('*')
  .eq('id', torneoId)
  .single()
```

**Returns**: El objeto torneo con su estado actual.
