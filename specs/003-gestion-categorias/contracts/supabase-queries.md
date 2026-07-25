# Contratos de Queries — Categorías

**Feature**: 003-gestion-categorias

## Listar categorías de un torneo

```js
const { data, error } = await supabase
  .from('categoria')
  .select('*, tatami:tatami_id(id, nombre)')
  .eq('torneo_id', torneoId)
  .order('created_at', { ascending: true })
```

---

## Crear categoría

```js
const { data, error } = await supabase
  .from('categoria')
  .insert({ torneo_id, nombre, modalidad, genero, edad_min, edad_max, peso_min, peso_max, cinturon_min, cinturon_max, estado: 'abierta' })
  .select()
  .single()
```

---

## Asignar/mover categoría a tatami

```js
// Paso 1: actualizar categoría
const { data, error } = await supabase
  .from('categoria')
  .update({ tatami_id: nuevoTatamiId, orden_en_tatami: nuevoOrden })
  .eq('id', categoriaId)
  .select()
  .single()

// Paso 2: registrar en historial
const { error: histError } = await supabase
  .from('movimiento_categoria')
  .insert({ categoria_id: categoriaId, tatami_id_anterior, tatami_id_nuevo: nuevoTatamiId, motivo })
```

---

## Órdenes ocupados en un tatami

```js
const { data, error } = await supabase
  .from('categoria')
  .select('orden_en_tatami')
  .eq('tatami_id', tatamiId)
  .not('orden_en_tatami', 'is', null)
```

---

## Historial de movimientos de una categoría

```js
const { data, error } = await supabase
  .from('movimiento_categoria')
  .select('*, tatami_anterior:tatami_id_anterior(nombre), tatami_nuevo:tatami_id_nuevo(nombre)')
  .eq('categoria_id', categoriaId)
  .order('created_at', { ascending: false })
```

---

## Categorías por tatami (cronograma del día)

```js
const { data, error } = await supabase
  .from('categoria')
  .select('*')
  .eq('tatami_id', tatamiId)
  .not('orden_en_tatami', 'is', null)
  .order('orden_en_tatami', { ascending: true })
```
