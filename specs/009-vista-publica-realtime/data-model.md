# Data Model: Vista Pública en Tiempo Real

**Feature**: 009-vista-publica-realtime

## Entidades consumidas (todas ya existen en Supabase)

### `torneo`

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| id | uuid | Parámetro de URL |
| nombre | text | Header de la página |
| fecha_inicio | date | Subtítulo |
| lugar | text | Subtítulo |
| estado | enum | Guard: solo mostrar si `en_curso` o `finalizado` |

### `tatami`

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| id | uuid | Key para filtro por tatami |
| nombre | text | Chip de filtro y título de sección |
| orden | integer | Orden de los chips de filtro |
| torneo_id | uuid | FK para fetch |

### `categoria`

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| id | uuid | Navegación → `/publico/categoria/:catId` |
| nombre | text | Display en tarjeta de tatami y en bracket |
| modalidad | enum | Determina display (kumite: score, kata: fase) |
| estado | enum | Filtrar `en_curso` para sección activa; `finalizada` para podio |
| tatami_id | uuid | Agrupar por tatami |
| torneo_id | uuid | FK para fetch |

### `combate`

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| id | uuid | Key |
| categoria_id | uuid | FK, usado para agrupar y para fetch cross-tatami |
| tatami_id | uuid | Disponible en la fila (para queries directas si se necesita) |
| estado | enum | Filtrar `en_curso` |
| competidor_rojo_id | uuid | Lookup de nombre del competidor |
| competidor_azul_id | uuid | Lookup de nombre del competidor |
| puntos_rojo | integer | Score kumite |
| puntos_azul | integer | Score kumite |
| ganador_id | uuid | Winner highlight en bracket |
| ronda | integer | Posición en bracket |
| orden_en_ronda | integer | Posición dentro de ronda; `0` = 3er puesto |
| j1_rojo | decimal | Inferencia de fase kata (null = no confirmado) |
| j1_azul | decimal | Inferencia de fase kata (null = no confirmado) |
| kata_anunciado_rojo | text | Display kata en fase pública (si aplica) |
| kata_anunciado_azul | text | Display kata en fase pública |

### `competidor`

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| id | uuid | Key |
| nombre | text | Display en combate activo y bracket |
| apellido | text | Display en combate activo y bracket |
| dojo_id | uuid | FK (cargado para mostrar nombre del club opcionalmente) |

## No hay SQL migration

Todas las entidades ya existen. Esta feature es puramente de lectura (read-only) — no agrega ni modifica tablas.

## Nuevo acceso de datos

**`fetchCombatesByCategoriasIds(catIds: string[]): Promise<Combate[]>`**

- Agrega un query a `combates.js` (función existente) usando `.in('categoria_id', catIds)`  
- Filtra por `.eq('estado', 'en_curso')` para obtener solo combates activos
- Usado en el polling de la vista principal para actualizar los combates en curso

## Diagrama de flujo de datos (vista principal)

```
URL /torneo/:id/publico?tatami=<opt>
        ↓
fetchTorneoById(id)         → guard: estado ∈ {en_curso, finalizado}
fetchTatamis(id)            → chips de filtro (estático)
fetchCategorias(id)         → lista de categorías con tatami_id, estado
fetchCompetidores(id)       → mapa id → {nombre, apellido} (estático)
        ↓
[POLLING 2000ms]
fetchCombatesByCategoriasIds(catIds)  → combates en_curso
        ↓
Render:
  Por tatami (filtrado):
    - Categorías en_curso → combate activo con score/fase
    - Categorías finalizadas → lista compacta con icono ganador
```

## Diagrama de flujo de datos (vista bracket)

```
URL /torneo/:id/publico/categoria/:catId
        ↓
fetchTorneoById(id)         → header (estático)
fetchCategorias(id)         → encontrar categoria específica (nombre, modalidad)
fetchCompetidores(id)       → nombres de competidores (estático)
        ↓
[POLLING 3000ms]
fetchCombates(catId)        → todos los combates de la categoría
        ↓
Render:
  <BracketView combates={...} competidores={...} onDeclararGanador={null} />
  [si categoria.estado === 'finalizada']: <PodioSection>
```
