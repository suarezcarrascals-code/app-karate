# Research: Marcador Kata Individual para Mesa Técnica

**Feature**: 008-marcador-kata-individual | **Date**: 2026-07-23

---

## Decision 1: Almacenamiento de puntajes por juez

**Decision**: Agregar 12 columnas nuevas a la tabla `combate` existente.

**Columns**:
- `kata_anunciado_rojo TEXT`, `kata_anunciado_azul TEXT`
- `j1_rojo`, `j2_rojo`, `j3_rojo`, `j4_rojo`, `j5_rojo` — `DECIMAL(4,1)`
- `j1_azul`, `j2_azul`, `j3_azul`, `j4_azul`, `j5_azul` — `DECIMAL(4,1)`

**Rationale**:
- Consistente con el patrón de `MesaKumitePage` que usa la tabla `combate` como fuente de verdad
- Evita JOINs adicionales — el polling de TV puede leer todo de una sola fila
- Cardinality fija: exactamente 5 jueces, no es un número variable
- El patrón de extensión con columnas opcionales (`amon_rojo`, `shikkaku_rojo`) ya está probado en feature 007

**Alternatives considered**:
- **Tabla separada `evaluacion_kata_bout`**: más normalizada pero requiere JOIN en TV display y complica el polling. Rechazada — la simplicidad gana en este contexto de baja escala.
- **JSONB column `scores_rojo`**: flexible pero dificulta queries y la UI de Supabase. Rechazada.

---

## Decision 2: TV display — ruta separada vs reutilizar MesaTVPage

**Decision**: Crear `MesaKataTVPage.jsx` separado en ruta `/kata-tv`.

**Rationale**:
- `MesaTVPage` tiene lógica específica de kumite (amon badges, senshu, etc.) que no aplica a kata
- Kata TV necesita mostrar una grilla de puntajes por juez con votos — layout completamente diferente
- El tamaño de ambas páginas sería grande si se combina — mejor separadas
- Misma ruta raíz `/mesa/:token/categoria/:catId/combate/:combateId` con sufijo distinto (`/tv` vs `/kata-tv`)

**Alternatives considered**:
- **Un solo TvDisplay con prop `modalidad`**: generaría un componente con demasiadas ramas condicionales. Rechazado.

---

## Decision 3: Cálculo de votos — dónde vive la lógica

**Decision**: Toda la lógica de votos vive en `src/lib/scoring.js` con tests EDD.

**Functions**:
```js
export function calcularVotosJuez({ aka, ao })        // → 'aka' | 'ao' | throws
export function determinarGanadorKataBout(votos)       // → 'aka' | 'ao' | throws
export function validarKataPermitido(kata, historial)  // → boolean
```

**Rationale**:
- Obligatorio por CLAUDE.md: "toda aritmética en `scoring.js`"
- EDD: los tests de estas funciones ya están especificados en CLAUDE.md (ver sección EDD)
- Sin efectos secundarios — funciones puras, trivial de testear

---

## Decision 4: Recuperación de historial de katas

**Decision**: Al cargar `MesaKataPage`, consultar combates anteriores del torneo para el competidor.

**Query**:
```js
// Para el competidor que pelea en lado rojo:
const { data } = await supabase
  .from('combate')
  .select('kata_anunciado_rojo')
  .eq('competidor_rojo_id', competidor.id)
  .eq('categoria_id', catId)  // misma categoría, misma ronda anterior
  .eq('estado', 'finalizado')
  .order('created_at', { ascending: true })

// Construir historial = [kata_anunciado_rojo de cada combate finalizado]
```

**Note**: El historial se consulta a nivel de categoría (mismos bouts) no de todo el torneo — en WKF, la restricción de "máx 2 veces" aplica dentro de la misma competencia/categoría.

**Rationale**: Consulta simple, no requiere tabla nueva ni agregaciones complejas.

---

## Decision 5: Flujo de fases en MesaKataPage

**Decision**: Máquina de estados de 4 fases con estado local en React.

```
'anuncio' → 'rojo_performance' → 'azul_performance' → 'resultado'
```

**Rationale**:
- El flujo es lineal y no retrocede — igual que el flujo de kumite
- Estado local es suficiente (mismo patrón que MesaKumitePage)
- La fase se recupera del estado de DB al recargar: si `j1_rojo` tiene valor → skip a `azul_performance`

**Recovery logic**:
```js
// Al cargar el combate desde DB, inferir la fase:
if (combate.estado === 'finalizado') → 'resultado'
else if (combate.j1_azul !== null) → 'resultado' (ambos confirmados)
else if (combate.j1_rojo !== null) → 'azul_performance'
else → 'anuncio'
```

---

## Decision 6: Routing en MesaBracketPage

**Decision**: Leer `categoria.modalidad` para determinar la ruta del combate.

```js
const esKata = ['kata_individual', 'kata_equipo'].includes(categoria?.modalidad)
const rutaCombate = `/mesa/${token}/categoria/${catId}/combate/${combate.id}${esKata ? '/kata' : ''}`
navigate(rutaCombate)
```

**Rationale**: Ya está disponible el objeto `categoria` en `MesaBracketPage`. El sufijo `/kata` diferencia las dos páginas de forma limpia sin cambiar la estructura base de la URL.

---

## Unknowns resueltos

| Unknown | Resolución |
|---------|-----------|
| ¿3 ó 5 ó 7 jueces? | Fijo en 5 para v1. CLAUDE.md especifica J1–J5. |
| ¿Kata por texto libre o lista WKF? | Texto libre en v1. Lista WKF en v2. |
| ¿Bloquear o advertir en kata repetido? | Advertir (warning), no bloquear. |
| ¿Historial por categoría o por torneo? | Por categoría (misma competencia). |
| ¿TV unificado o separado? | Separado (`/kata-tv`). |
