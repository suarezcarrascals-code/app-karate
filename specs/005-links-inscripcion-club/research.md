# Research: Links de Inscripción por Club

## Decisión 1 — Generación del token del link

**Decision**: UUID v4 generado por PostgreSQL (`gen_random_uuid()`) como token del link.

**Rationale**: UUID v4 tiene 122 bits de entropía — imposible de adivinar por fuerza bruta. Supabase lo soporta nativamente sin dependencias externas. La URL queda así: `/inscripcion/550e8400-e29b-41d4-a716-446655440000`.

**Alternatives considered**:
- Token alfanumérico corto (ej: `ABC123`): más fácil de transcribir, pero menos seguro y no necesario (el link se comparte por WhatsApp, no se tipea manualmente).
- JWT firmado: overkill para este caso — el token no necesita cargar claims, solo ser un identificador opaco.

---

## Decisión 2 — Acceso anónimo a la página del entrenador

**Decision**: Usar el anon key de Supabase con RLS restrictivo. La página `/inscripcion/:token` carga datos usando el cliente Supabase sin autenticación.

**Rationale**: Supabase tiene dos roles integrados: `authenticated` (usuarios logueados) y `anon` (sin login). Con RLS bien configurado, el anon key solo puede leer/escribir exactamente lo que las políticas permiten. No se expone ningún dato fuera de lo necesario.

**RLS rules necesarias**:
- `link_inscripcion`: anon puede SELECT solo si `token = :token AND estado = 'activo'`
- `competidor`: anon puede INSERT solo si el link asociado existe, está activo, y el conteo actual < límite
- `competidor`: anon puede SELECT solo los registrados bajo su `link_inscripcion_id`
- `categoria`: anon puede SELECT de categorías del torneo (para mostrar la lista)
- `dojo`: anon puede SELECT el dojo del link (para mostrar el nombre del club)
- `torneo`: anon puede SELECT el torneo del link (para mostrar el nombre del torneo)

**Alternatives considered**:
- Token en query param (`?token=...`): funciona igual, pero UUID en path es más limpio.
- Auth con magic link: innecesario — el entrenador no necesita una sesión persistente.

---

## Decisión 3 — Control del límite de atletas

**Decision**: El límite se valida en dos lugares: cliente (bloquea el botón cuando contador = límite) y servidor (RLS en Supabase cuenta los registros antes de permitir INSERT).

**Rationale**: La validación en cliente da UX inmediato. La validación en servidor previene race conditions (dos entrenadores usando el mismo link simultáneamente). Sin la validación server-side, el límite sería fácil de bypassear.

**RLS policy para el límite**:
```sql
-- En INSERT de competidor vía link:
WITH conteo AS (
  SELECT COUNT(*) as total
  FROM competidor
  WHERE link_inscripcion_id = NEW.link_inscripcion_id
)
SELECT conteo.total < (SELECT limite_atletas FROM link_inscripcion WHERE id = NEW.link_inscripcion_id)
FROM conteo
```

---

## Decisión 4 — Realtime para el contador del organizador

**Decision**: Supabase Realtime con `postgres_changes` en la tabla `competidor` filtrado por `torneo_id`.

**Rationale**: El organizador ve cuántos atletas va inscribiendo cada club en tiempo real. El cliente del organizador se suscribe al canal del torneo y recibe eventos INSERT de `competidor`. El contador se recalcula localmente filtrando por `link_inscripcion_id`.

**Alternatives considered**:
- Polling cada N segundos: más simple pero menos inmediato; descartado porque Realtime ya está en el stack.
- Contador desnormalizado en `link_inscripcion`: más rápido de leer pero introduce drift si hay errores. Se prefiere contar desde `competidor`.

---

## Decisión 5 — Sugerencia de categoría

**Decision**: Reusar `encontrarCategoriasCompatibles` de `src/lib/categorias.js` — ya implementada y testeada.

**Rationale**: La función ya cruza modalidad, género, edad (calculada con `calcularEdad`) y peso del competidor contra los rangos de la categoría. No hay que reimplementar nada.

**Diferencia con el flujo manual**: En el flujo manual el organizador elige la modalidad explícitamente. En el link, el entrenador no sabe de modalidades — el sistema sugiere basándose en todas las categorías disponibles del torneo. Si hay múltiples sugerencias, se muestran todas resaltadas.

---

## Decisión 6 — Prerequisito para generar el link

**Decision**: El botón "Generar link" en el panel del organizador está deshabilitado si el torneo no tiene al menos 1 tatami, 1 categoría y 1 club (dojo). La validación es en cliente con mensaje explicativo.

**Rationale**: Evita que el organizador comparta un link antes de que la infraestructura esté lista, lo que resultaría en que el entrenador no vea categorías disponibles.

**Implementation**: Al cargar `InscripcionesPage`, se verifican los conteos. Si alguno es 0, el panel muestra un banner con los pasos pendientes.
