# Research: Inscripción de Competidores

## Decisión 1: Reutilización de `estaFueraDeRango`

**Decision**: Importar directamente desde `src/lib/categorias.js` — no duplicar.

**Rationale**: Ya implementada, testeada y cubre edad y peso. La función recibe `{ edad, peso }` y la categoría con sus rangos. Solo hay que calcular la edad antes de llamarla.

**How to call**:
```js
import { estaFueraDeRango } from '../categorias'
const edad = calcularEdad(competidor.fecha_nacimiento)
const { fueraDeRango, motivos } = estaFueraDeRango({ edad, peso: competidor.peso }, categoria)
```

---

## Decisión 2: Cálculo de edad

**Decision**: Función `calcularEdad(fechaNacimiento)` en `src/lib/competidores.js`. Devuelve años cumplidos o `null` si no hay fecha.

**Rationale**: Lógica de negocio → va en `lib/`, no en componente. Permite testearla con EDD.

**Algorithm**:
```
edad = año_hoy - año_nac
si mes_hoy < mes_nac → edad--
si mes_hoy === mes_nac y día_hoy < día_nac → edad--
```

---

## Decisión 3: Flujo de confirmación fuera de rango

**Decision**: Modal de confirmación (`FueraDeRangoModal`) que se muestra cuando `estaFueraDeRango` retorna `true` — antes de llamar a Supabase.

**Rationale**: UX: el organizador ya llenó el formulario; no perder los datos. El modal lista los motivos y pide confirmación explícita. Al confirmar, se llama `insertCompetidor` con `inscripcion_manual: true`.

**Flow**:
```
handleSubmit →
  calcularEdad → estaFueraDeRango →
    si fueraDeRango: mostrar FueraDeRangoModal (datos quedan en estado del form)
    si !fueraDeRango: insertar directo con inscripcion_manual: false
  
onConfirmarModal →
  insertCompetidor({ ...datos, inscripcion_manual: true })
```

---

## Decisión 4: Acceso a la página de competidores

**Decision**: Ruta `/torneo/:id/categoria/:catId/competidores` con botón "Ver competidores" en `CategoriaCard`.

**Rationale**: Mantiene la jerarquía de navegación. La página carga la categoría y el torneo para mostrar contexto y validar estado.

**Breadcrumb**: `← [nombre torneo] / Categorías / [nombre categoría]`

---

## Decisión 5: Equipos (P3)

**Decision**: Tabla `equipo` con 3 FKs fijas (`miembro_1_id`, `miembro_2_id`, `miembro_3_id`). Formulario con 3 selectores de competidores inscritos en la categoría.

**Rationale**: El reglamento WKF permite 4 con rotación, pero la spec acota a equipo fijo de 3 para esta iteración. La tabla ya está definida en CLAUDE.md.

**Guard**: Solo visible en categorías con `modalidad` que contenga `_equipo`.

---

## Decisión 6: Store de competidores

**Decision**: `useCompetidorStore` con estado `competidores`, `loading`, `error` y acciones `fetchCompetidores`, `addCompetidor`, `removeCompetidor`. Separado de `useCategoriaStore`.

**Rationale**: Ciclo de vida diferente — los competidores se cargan por categoría, no por torneo. Mantenerlos en un store propio evita contaminación del store de categorías.
