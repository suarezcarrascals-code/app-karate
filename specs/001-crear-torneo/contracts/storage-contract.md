# Contrato de Storage — Logos de Torneo

**Feature**: 001-crear-torneo

## Configuración del bucket

Crear manualmente en Supabase Dashboard → Storage → New bucket:
- **Nombre**: `logos`
- **Public bucket**: sí (para generar URLs públicas sin autenticación)

## Upload de logo

```js
// src/lib/torneos.js
const path = `torneos/${torneoId}/${Date.now()}-${file.name}`

const { data, error } = await supabase.storage
  .from('logos')
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

// Obtener URL pública
const { data: { publicUrl } } = supabase.storage
  .from('logos')
  .getPublicUrl(path)
```

**Returns**: `publicUrl` — string con la URL pública del archivo subido.
**Error**: Si `error` no es null, abortar la creación del torneo y mostrar mensaje.

## Validaciones previas al upload (en src/lib/validaciones.js)

```js
// Tipo de archivo
file.type.startsWith('image/')   // debe ser true

// Tamaño
file.size <= 2 * 1024 * 1024    // <= 2 MB
```

## Flujo completo con logo

```
1. Validar archivo (tipo + tamaño) en cliente
2. Crear el torneo en DB sin logo_url (o con null)
3. Subir logo a Storage usando el id del torneo recién creado
4. Actualizar torneo con la publicUrl obtenida
```

Nota: el upload ocurre DESPUÉS de crear el torneo para usar el `id` como parte del path.
