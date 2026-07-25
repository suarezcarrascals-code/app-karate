# Contratos de Queries — Supabase

**Feature**: 001-crear-torneo

## Listar torneos

```js
// src/lib/torneos.js
const { data, error } = await supabase
  .from('torneo')
  .select('*')
  .order('created_at', { ascending: false })
```

**Returns**: Array de objetos `torneo` ordenados del más reciente al más antiguo.
**Error**: Si `error` no es null, propagar al store para mostrar mensaje al usuario.

---

## Insertar torneo nuevo

```js
// src/lib/torneos.js
const { data, error } = await supabase
  .from('torneo')
  .insert({
    nombre,
    fecha_inicio,   // string 'YYYY-MM-DD'
    fecha_fin,      // string 'YYYY-MM-DD'
    lugar,
    logo_url,       // null si no hay logo
    estado: 'borrador'
  })
  .select()
  .single()
```

**Returns**: El objeto `torneo` recién creado con su `id` generado.
**Error**: Si `error` no es null, no redirigir — mostrar error en formulario.

---

## Actualizar estado del torneo (P3 — implementación futura)

```js
// src/lib/torneos.js
const { data, error } = await supabase
  .from('torneo')
  .update({ estado: nuevoEstado })
  .eq('id', torneoId)
  .select()
  .single()
```

**Precondición**: Validar en cliente que el torneo tiene al menos un tatami con categoría antes de llamar.
