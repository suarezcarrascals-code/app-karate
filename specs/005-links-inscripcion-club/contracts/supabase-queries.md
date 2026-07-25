# Contracts: Supabase Queries — Links de Inscripción

## `src/lib/links.js`

### `fetchLinks(torneoId)`
```js
supabase
  .from('link_inscripcion')
  .select('*, dojo:dojo_id(id, nombre)')
  .eq('torneo_id', torneoId)
  .order('created_at', { ascending: true })
// Retorna: array de links con dojo anidado
// Error: lanza si falla la query
```

### `fetchLinkByToken(token)`
```js
supabase
  .from('link_inscripcion')
  .select(`
    *,
    dojo:dojo_id(id, nombre),
    torneo:torneo_id(id, nombre, fecha_inicio, lugar)
  `)
  .eq('token', token)
  .eq('estado', 'activo')
  .single()
// Retorna: link con dojo y torneo anidados, o null si no existe/inactivo
// Usado por: InscripcionPublica.jsx
```

### `generarLink(torneoId, dojoId, limiteAtletas)`
```js
// 1. Desactivar link anterior si existe
supabase
  .from('link_inscripcion')
  .update({ estado: 'inactivo' })
  .eq('torneo_id', torneoId)
  .eq('dojo_id', dojoId)
  .eq('estado', 'activo')

// 2. Insertar nuevo link
supabase
  .from('link_inscripcion')
  .insert({ torneo_id: torneoId, dojo_id: dojoId, limite_atletas: limiteAtletas })
  .select('*, dojo:dojo_id(id, nombre)')
  .single()
// Retorna: link recién creado con token y dojo
```

### `desactivarLink(linkId)`
```js
supabase
  .from('link_inscripcion')
  .update({ estado: 'inactivo' })
  .eq('id', linkId)
// Retorna: void, lanza si falla
```

### `desactivarTodosLosLinks(torneoId)`
```js
supabase
  .from('link_inscripcion')
  .update({ estado: 'inactivo' })
  .eq('torneo_id', torneoId)
  .eq('estado', 'activo')
// Usado cuando el organizador cierra inscripciones del torneo
```

### `contarAtletasPorLink(linkId)`
```js
supabase
  .from('competidor')
  .select('id', { count: 'exact', head: true })
  .eq('link_inscripcion_id', linkId)
// Retorna: { count: number }
```

---

## `src/lib/competidores.js` (extensión)

### `insertCompetidorPorLink(datos, linkId)`
```js
supabase
  .from('competidor')
  .insert({
    torneo_id: datos.torneo_id,
    categoria_id: datos.categoria_id,
    dojo_id: datos.dojo_id,
    nombre: datos.nombre,
    apellido: datos.apellido,
    fecha_nacimiento: datos.fecha_nacimiento,
    peso: datos.peso,
    genero: datos.genero,
    estado: 'inscrito',
    link_inscripcion_id: linkId,
  })
  .select('*')
  .single()
// Retorna: competidor creado, o error si RLS bloquea (límite superado)
// NOTA: el RLS en Supabase verifica el límite — si falla, lanza error con mensaje claro
```

### `fetchCompetidoresPorLink(linkId)`
```js
supabase
  .from('competidor')
  .select('*, categoria:categoria_id(id, nombre, modalidad)')
  .eq('link_inscripcion_id', linkId)
  .order('created_at', { ascending: true })
// Retorna: lista de atletas inscritos por este link
// Usado por: InscripcionPublica.jsx para mostrar la lista de inscritos
```

---

## `src/lib/categorias.js` (sin cambios — reusar existente)

### `fetchCategorias(torneoId)` — ya implementada
Retorna todas las categorías del torneo. Se usa en la página pública para mostrar la lista y calcular sugerencias.

### `encontrarCategoriasCompatibles(competidor, categorias)` — ya implementada
Calcula qué categorías aplican según edad, peso y género. Se reutiliza sin cambios para la sugerencia automática.

---

## Supabase Realtime — Panel del organizador

```js
// En useLinkStore.js — suscripción para actualizar contadores en tiempo real
supabase
  .channel(`inscripciones-torneo-${torneoId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'competidor',
    filter: `torneo_id=eq.${torneoId}`,
  }, (payload) => {
    // Incrementar contador del link correspondiente en el store local
    const linkId = payload.new.link_inscripcion_id
    if (linkId) dispatch({ type: 'INCREMENT_COUNT', linkId })
  })
  .subscribe()
```
