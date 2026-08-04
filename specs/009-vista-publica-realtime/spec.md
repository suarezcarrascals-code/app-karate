# Feature Specification: Vista Pública en Tiempo Real del Torneo

**Feature Branch**: `009-vista-publica-realtime`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Vista pública en tiempo real del torneo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Panel de actividad en tiempo real (Priority: P1)

Un espectador (familiar, entrenador, competidor) abre la URL pública del torneo y ve, en tiempo real, qué combates o evaluaciones están ocurriendo ahora mismo en cada tatami. La vista se actualiza automáticamente sin recargar la página. Fuentes grandes y alto contraste permiten leerla en un proyector o TV a distancia.

**Why this priority**: Es el valor central de la vista pública. Sin esto, los espectadores no saben qué está pasando en el torneo.

**Independent Test**: Abrir `/torneo/:id/publico` con un torneo en estado `en_curso` → ver una tarjeta por cada tatami activo con el combate en curso (nombres de competidores, categoría, puntaje si es kumite) → esperar 2 segundos sin recargar → el puntaje o estado se actualiza al cambiar desde el panel de mesa técnica.

**Acceptance Scenarios**:

1. **Given** un torneo en estado `en_curso` con 2 tatamis activos, **When** el espectador abre la URL pública, **Then** ve una tarjeta por cada tatami con la categoría activa y los nombres de los competidores en el combate en curso.
2. **Given** el panel de mesa técnica suma un punto en kumite, **When** pasan menos de 3 segundos, **Then** el marcador en la vista pública refleja el nuevo puntaje sin que el espectador recargue la página.
3. **Given** un tatami sin combate en curso, **When** el espectador ve la vista pública, **Then** ese tatami aparece como "En espera" o no aparece.
4. **Given** un torneo en estado `finalizado`, **When** el espectador abre la URL pública, **Then** ve los resultados finales de todas las categorías.

---

### User Story 2 — Filtrar vista por tatami (Priority: P2)

El espectador puede seleccionar un tatami específico para ver únicamente la actividad de ese espacio. Útil cuando el recinto tiene varios tatamis simultáneos y el espectador sólo le interesa uno.

**Why this priority**: Torneos grandes tienen 3–6 tatamis en paralelo. Sin filtro, la vista queda sobrecargada e ilegible en proyector.

**Independent Test**: En la vista pública con 3 tatamis activos → presionar el chip "Tatami B" → solo aparece la información del Tatami B → presionar "Todos" → vuelven los 3 tatamis.

**Acceptance Scenarios**:

1. **Given** un torneo con 3 tatamis activos, **When** el espectador selecciona "Tatami A", **Then** solo se muestra la información del Tatami A.
2. **Given** un filtro de tatami activo, **When** el espectador presiona "Todos", **Then** se muestran todos los tatamis nuevamente.
3. **Given** un filtro de tatami activo, **When** la URL se comparte, **Then** el receptor abre la vista con ese mismo tatami filtrado (filtro en query string).

---

### User Story 3 — Bracket y resultados de una categoría (Priority: P3)

El espectador puede ver el bracket completo de una categoría específica: quién ganó en cada ronda, quiénes se enfrentan en las rondas siguientes, y el podio final cuando la categoría termina.

**Why this priority**: Los entrenadores necesitan seguir el avance de sus atletas en el bracket entre combate y combate.

**Independent Test**: En la vista pública → presionar una categoría (ej: "Kumite -60 kg Senior Masculino") → ver el árbol de rondas con los nombres y los ganadores resaltados → ver "Podio: 1° Juan García — 2° Pedro López — 3° Carlos Ruiz" cuando la categoría está finalizada.

**Acceptance Scenarios**:

1. **Given** una categoría con combates generados, **When** el espectador navega a la categoría, **Then** ve el bracket completo con los nombres de los competidores y el estado de cada combate (pendiente, en curso, finalizado).
2. **Given** una categoría finalizada, **When** el espectador ve el bracket, **Then** se muestra el podio (1°, 2°, 3°) con nombres y club.
3. **Given** un combate en curso dentro de la categoría, **When** el espectador ve el bracket, **Then** ese combate aparece resaltado como "En curso".

---

### Edge Cases

- ¿Qué ocurre si el torneo no existe o está en estado `borrador`? → Mostrar mensaje "Torneo no disponible" (sin exponer datos internos).
- ¿Qué ocurre si no hay conexión a internet? → Mostrar indicador "Sin conexión" y mantener los últimos datos vistos.
- ¿Qué ocurre si no hay combates generados para ninguna categoría? → Mostrar "La competencia aún no ha comenzado".
- ¿Qué ocurre cuando la categoría es kata (no tiene puntuación kumite)? → Mostrar estado "Actuando" o "En evaluación" en lugar de marcador numérico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La vista pública DEBE ser accesible sin login en la ruta `/torneo/:id/publico`.
- **FR-002**: La vista DEBE mostrar los combates activos (`estado = 'en_curso'`) de cada tatami del torneo en tiempo real.
- **FR-003**: El puntaje de combates kumite en curso DEBE actualizarse automáticamente en el cliente con un retraso máximo de 3 segundos.
- **FR-004**: El estado de combates kata en curso DEBE actualizarse automáticamente (fase anuncio, actuando, resultado).
- **FR-005**: La vista DEBE permitir filtrar el contenido por tatami mediante chips o botones de selección rápida.
- **FR-006**: El filtro de tatami DEBE persistir en la URL (query string) para que sea compartible.
- **FR-007**: La vista DEBE ser legible en pantalla grande (proyector / TV) con fuentes grandes y alto contraste.
- **FR-008**: La vista DEBE funcionar correctamente en móvil (espectadores con celular).
- **FR-009**: Al presionar una categoría, la vista DEBE navegar a la vista del bracket de esa categoría.
- **FR-010**: El bracket de categoría DEBE mostrar: nombres de competidores, rondas, ganadores, y podio si la categoría está finalizada.
- **FR-011**: La vista DEBE mostrar un indicador de estado de conexión (online / offline).
- **FR-012**: Cuando el torneo está en estado `finalizado`, la vista DEBE mostrar los resultados finales de todas las categorías.
- **FR-013**: La vista NO DEBE mostrar información de torneos en estado `borrador` — mostrar mensaje "No disponible".

### Key Entities

- **Torneo**: Identificado por ID en la URL. Tiene nombre, fecha, lugar, estado.
- **Tatami**: Espacios físicos del torneo, usados como filtro. Tienen nombre y orden.
- **Categoria**: Agrupa competidores por modalidad/edad/peso. Tiene nombre, modalidad, estado. Es la unidad navegable hacia el bracket.
- **Combate**: Enfrentamiento o evaluación kata dentro de una categoría. Tiene estado, puntajes (kumite), fase (kata), y referencias a los competidores.
- **Competidor**: Participante con nombre, apellido y club. Se muestra en el combate activo y en el bracket.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un espectador puede abrir la URL pública y ver los combates activos en menos de 3 segundos de carga inicial.
- **SC-002**: Un cambio de puntaje operado desde la mesa técnica aparece reflejado en la vista pública en menos de 3 segundos.
- **SC-003**: La vista es legible sin zoom en una TV de 42 pulgadas a 3 metros de distancia (fuentes ≥ 24px para nombres, ≥ 48px para puntajes).
- **SC-004**: El filtro por tatami reduce visualmente el contenido en menos de 0.5 segundos (sin petición al servidor).
- **SC-005**: La vista funciona sin errores visibles cuando la lista de combates activos está vacía.
- **SC-006**: La navegación al bracket de una categoría carga en menos de 2 segundos.

## Assumptions

- El torneo puede tener de 1 a 6 tatamis simultáneos; el diseño debe manejar ambos extremos sin romper el layout.
- Los espectadores acceden mayormente desde móvil, aunque la vista debe ser óptima también en TV/proyector.
- No se requiere autenticación de ningún tipo para la vista pública.
- El torneo debe estar en estado `en_curso` o `finalizado` para mostrar contenido útil.
- El organizador comparte la URL directamente (no hay página de descubrimiento público de torneos).
- La sincronización en tiempo real se implementa con polling periódico (igual al patrón de MesaTVPage), ya que Supabase Realtime Channels requiere configuración adicional.
- La vista del bracket público es de solo lectura — ninguna acción disponible.
