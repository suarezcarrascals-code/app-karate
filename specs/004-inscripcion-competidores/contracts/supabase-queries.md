# Contracts: Supabase Queries — Inscripción de Competidores

## `fetchCompetidores(categoriaId)`

```js
supabase
  .from('competidor')
  .select('*')
  .eq('categoria_id', categoriaId)
  .order('created_at', { ascending: true })
```

**Returns**: `Competidor[]`
**Throws**: si error de red o RLS

---

## `insertCompetidor(datos)`

```js
// datos: { torneo_id, categoria_id, nombre, apellido, club?, pais?,
//           fecha_nacimiento?, peso?, cinturon?, inscripcion_manual }
supabase
  .from('competidor')
  .insert({ ...datos, estado: 'inscrito' })
  .select()
  .single()
```

**Returns**: `Competidor` con id generado
**Throws**: si campos obligatorios faltantes o error de red

---

## `deleteCompetidor(id)`

```js
supabase
  .from('competidor')
  .delete()
  .eq('id', id)
```

**Returns**: void
**Throws**: si error de red

---

## `fetchEquipos(categoriaId)` — P3

```js
supabase
  .from('equipo')
  .select(`
    *,
    miembro_1:miembro_1_id(id, nombre, apellido, club),
    miembro_2:miembro_2_id(id, nombre, apellido, club),
    miembro_3:miembro_3_id(id, nombre, apellido, club)
  `)
  .eq('categoria_id', categoriaId)
  .order('created_at', { ascending: true })
```

**Returns**: `Equipo[]` con miembros expandidos

---

## `insertEquipo(datos)` — P3

```js
// datos: { categoria_id, nombre, club?, miembro_1_id, miembro_2_id, miembro_3_id }
supabase
  .from('equipo')
  .insert(datos)
  .select(`
    *,
    miembro_1:miembro_1_id(id, nombre, apellido),
    miembro_2:miembro_2_id(id, nombre, apellido),
    miembro_3:miembro_3_id(id, nombre, apellido)
  `)
  .single()
```

**Returns**: `Equipo` con miembros expandidos
**Throws**: si algún miembro_id no existe en la misma categoría

---

## Notas

- Todos los queries de escritura confían en RLS permisivo (sin auth en esta etapa)
- `inscripcion_manual: false` por defecto — solo se pasa `true` si el organizador confirma fuera de rango
- La categoría origen del competidor se obtiene de la ruta (`:catId`) — no hay riesgo de cross-category
