# Supabase Queries: Links de Acceso para Mesa Técnica

## `src/lib/linksMesaTecnica.js`

### fetchLinksMesaTecnica(torneoId)
Devuelve todos los links del torneo con nombre del tatami.

```js
supabase
  .from('link_mesa_tecnica')
  .select('*, tatami:tatami_id(id, nombre)')
  .eq('torneo_id', torneoId)
  .order('created_at', { ascending: true })
```

### generarLinkMesaTecnica(torneoId, tatamiId)
Desactiva el link activo anterior del mismo tatami, luego inserta uno nuevo.

```js
// 1. Desactivar anterior
supabase
  .from('link_mesa_tecnica')
  .update({ estado: 'inactivo' })
  .eq('torneo_id', torneoId)
  .eq('tatami_id', tatamiId)
  .eq('estado', 'activo')

// 2. Insertar nuevo
supabase
  .from('link_mesa_tecnica')
  .insert({ torneo_id: torneoId, tatami_id: tatamiId })
  .select('*, tatami:tatami_id(id, nombre)')
  .single()
```

### fetchLinkMesaTecnicaByToken(token)
Devuelve el link con torneo y tatami. Retorna null si no existe o está inactivo.

```js
supabase
  .from('link_mesa_tecnica')
  .select(`
    *,
    tatami:tatami_id(id, nombre),
    torneo:torneo_id(id, nombre, estado, lugar, fecha_inicio)
  `)
  .eq('token', token)
  .eq('estado', 'activo')
  .single()
// Si error → return null (no lanzar)
```

### desactivarLinkMesaTecnica(linkId)
```js
supabase
  .from('link_mesa_tecnica')
  .update({ estado: 'inactivo' })
  .eq('id', linkId)
```

---

## Queries de contexto para MarcadorPublico

### Categorías del tatami (para el selector)
```js
supabase
  .from('categoria')
  .select('id, nombre, modalidad, estado')
  .eq('tatami_id', tatamiId)
  .in('estado', ['cerrada', 'en_curso'])
  .order('orden_en_tatami', { ascending: true })
```

### Combates de una categoría (para operar)
```js
supabase
  .from('combate')
  .select(`
    *,
    competidor_rojo:competidor_rojo_id(id, nombre, apellido, club),
    competidor_azul:competidor_azul_id(id, nombre, apellido, club)
  `)
  .eq('categoria_id', categoriaId)
  .order('ronda', { ascending: true })
  .order('orden_en_ronda', { ascending: true })
```
