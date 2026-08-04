# UI Contracts: Vista Pública en Tiempo Real

## Rutas nuevas (agregar a `src/App.jsx`)

```jsx
/* Rutas públicas — sin login */
<Route path="/torneo/:id/publico" element={<TorneoPublicoPage />} />
<Route path="/torneo/:id/publico/categoria/:catId" element={<CategoriaPublicoPage />} />
```

---

## Ruta 1: `/torneo/:id/publico`

**Componente**: `src/pages/publico/TorneoPublicoPage.jsx`

**Parámetros URL**:
- `:id` — UUID del torneo

**Query params**:
- `?tatami=<tatamiId>` — (opcional) filtra la vista al tatami indicado

**Estado mínimo del componente**:

```js
const [torneo, setTorneo] = useState(null)
const [tatamis, setTatamis] = useState([])
const [categorias, setCategorias] = useState([])
const [competidores, setCompetidores] = useState({})  // mapa id→{nombre,apellido}
const [combatesActivos, setCombatesActivos] = useState([])  // estado=en_curso
const [filtroTatami, setFiltroTatami] = useState(null)  // tatamiId | null
const [online, setOnline] = useState(navigator.onLine)
const [loading, setLoading] = useState(true)
```

**Ciclo de vida**:

```
mount:
  1. fetchTorneoById(id)
  2. fetchTatamis(id)
  3. fetchCategorias(id)     → catIds = data.map(c => c.id)
  4. fetchCompetidores(id)   → reducir a mapa {[id]: {nombre, apellido}}
  5. fetchCombatesByCategoriasIds(catIds)  → primer snapshot
  6. leer query param ?tatami → setFiltroTatami
  setLoading(false)

  setInterval(2000):
    fetchCombatesByCategoriasIds(catIds) → setCombatesActivos

unmount: clearInterval
```

**Render (secciones)**:

1. **Guard**: si torneo.estado === 'borrador' || 'inscripciones' → mostrar "La competencia aún no ha comenzado"
2. **Header**: `<nombre del torneo>` (grande) + `<lugar · fecha_inicio>` (pequeño)
3. **Chips de filtro**: `[Todos]` + un chip por tatami. El seleccionado aparece resaltado. Al presionar → `setFiltroTatami(id)` + actualizar URL query param.
4. **Grid de tatamis** (filtrado):
   - Un bloque por tatami (o solo el filtrado si `filtroTatami` está seteado)
   - Título del tatami
   - Si hay una categoría `en_curso` en ese tatami: `<TarjetaCombateActivo>`
   - Lista de otras categorías del tatami (compacta: nombre + badge de estado)
5. **Indicador online/offline** (esquina inferior derecha, igual al patrón de Mesa)

**`<TarjetaCombateActivo>` (subcomponente inline)**:

Props: `{ combate, categoria, competidores }`

- Si `categoria.modalidad` incluye 'kumite':
  - Layout: `[AKA nombre]  [score_rojo] — [score_azul]  [AO nombre]` en grande
  - Estado: badge "En curso"
- Si `categoria.modalidad` incluye 'kata':
  - Layout: `[AKA nombre]` vs `[AO nombre]`
  - Fase: inferir de `combate.j1_rojo` y `combate.j1_azul` (ver Decision 6 en research.md)
  - Mostrar badge de fase: "En anuncio" / "AO actuando" / "Evaluando"
- Siempre: nombre de la categoría arriba, badge "En curso" (amber)
- Al presionar la tarjeta → navegar a `/torneo/:id/publico/categoria/:catId`

---

## Ruta 2: `/torneo/:id/publico/categoria/:catId`

**Componente**: `src/pages/publico/CategoriaPublicoPage.jsx`

**Parámetros URL**:
- `:id` — UUID del torneo
- `:catId` — UUID de la categoría

**Estado mínimo**:

```js
const [torneo, setTorneo] = useState(null)
const [categoria, setCategoria] = useState(null)
const [combates, setCombates] = useState([])
const [competidores, setCompetidores] = useState([])  // array (BracketView espera array)
const [loading, setLoading] = useState(true)
const [online, setOnline] = useState(navigator.onLine)
```

**Ciclo de vida**:

```
mount:
  1. fetchTorneoById(id)
  2. fetchCategorias(id)   → encontrar la categoría con catId
  3. fetchCompetidores(id)
  4. fetchCombates(catId)
  setLoading(false)

  setInterval(3000):
    fetchCombates(catId) → setCombates

unmount: clearInterval
```

**Render**:

1. **Header**: botón atrás → `/torneo/:id/publico` + nombre categoría + nombre torneo
2. **Bracket**: `<BracketView combates={combates} competidores={competidores} onDeclararGanador={null} />`
3. **Podio** (si `categoria.estado === 'finalizada'`):
   - Sección "Podio" con 1°, 2°, 3° derivados de los ganadores del bracket:
     - 1°: ganador de la Final
     - 2°: perdedor de la Final
     - 3°: ganador del combate de 3er puesto (orden_en_ronda = 0)
4. **Indicador online/offline**

---

## Modificación en `src/lib/combates.js`

```js
// Nueva función — sin tests (es un fetch simple, no lógica de negocio)
export async function fetchCombatesByCategoriasIds(catIds) {
  if (!catIds || catIds.length === 0) return []
  const { data, error } = await supabase
    .from('combate')
    .select('*')
    .in('categoria_id', catIds)
    .eq('estado', 'en_curso')
  if (error) throw error
  return data ?? []
}
```

---

## Estilos y diseño

- Fondo `bg-zinc-950` (igual que el resto de la app)
- Nombres de competidores en combate activo: `text-3xl font-black` mínimo (legible a 3m)
- Scores kumite: `text-5xl font-black tabular-nums`
- Badges de estado: colores existentes (`amber` = en_curso, `emerald` = finalizado)
- El filtro de tatami destaca el chip seleccionado con `bg-rose-600 text-white`
