# Feature Specification: Gestión de Categorías en un Torneo

**Feature Branch**: `feature/003-gestion-categorias`

**Created**: 2026-06-03

**Status**: Draft

**Input**: Gestión de categorías en un torneo de karate. Las categorías se crean al nivel del torneo y se asignan a tatamis con un orden en el día. Cuando una categoría termina en un tatami, se puede asignar la siguiente. Las categorías pueden moverse entre tatamis sin perder datos. Los competidores saben desde el inicio en qué tatami están.

## Clarifications

### Session 2026-06-03

- Q: ¿Cómo se modela la relación categoría↔tatami? → A: `categoria.tatami_id` + `categoria.orden_en_tatami` actualizables, con tabla de historial `movimiento_categoria` para trazabilidad completa.
- Q: ¿Cómo se gestiona el orden de categorías dentro de un tatami? → A: Cola planificada con `orden_en_tatami` editable — el organizador define y puede reordenar.
- Q: ¿Cuándo se crean las categorías y cómo se relacionan con los competidores? → A: Las categorías se crean durante inscripciones. Los competidores tienen una categoría oficial pero el organizador puede moverlos o agregarlos manualmente a categorías fuera de su rango (edad/peso) cuando la categoría tiene pocos participantes.
- Q: ¿Se puede reasignar una categoría de tatami mientras está en curso? → A: Sí, en cualquier estado (abierta, cerrada, en curso), con confirmación explícita y registro automático en historial.
- Q: ¿Cuándo es visible el tatami asignado para competidores y público? → A: Visible desde que se asigna, con leyenda visible "sujeto a cambios" en todas las categorías.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y listar categorías del torneo (Priority: P1)

El organizador accede al dashboard del torneo y ve todas las categorías creadas. Puede crear una nueva categoría con nombre, modalidad, género y rangos de edad/peso. Las categorías existen al nivel del torneo, sin tatami asignado inicialmente.

**Why this priority**: Sin categorías no hay nada que asignar a tatamis ni inscribir competidores. Es el primer paso tras crear los tatamis.

**Independent Test**: Acceder a `/torneo/:id/categorias` → ver lista de categorías o estado vacío → crear una categoría → aparece en la lista.

**Acceptance Scenarios**:

1. **Given** un torneo tiene categorías, **When** el organizador accede a la lista, **Then** ve nombre, modalidad, género, rango de edad/peso y tatami asignado (o "Sin asignar") de cada una.
2. **Given** no hay categorías, **When** accede a la lista, **Then** ve estado vacío con botón "Crear categoría".
3. **Given** el formulario está abierto, **When** intenta guardar sin nombre o modalidad, **Then** el sistema muestra error y no guarda.

---

### User Story 2 - Asignar categoría a tatami con orden en el día (Priority: P2)

El organizador asigna una categoría a un tatami y define su orden dentro del cronograma del tatami (ej: 1ª, 2ª, 3ª categoría del día). Puede reordenar las categorías en un tatami sin perder datos.

**Why this priority**: La asignación define en qué tatami competirán los participantes — información visible para competidores y público desde el momento de la asignación.

**Independent Test**: Crear una categoría → asignarla a Tatami A con orden 1 → verificar que aparece en el cronograma del tatami y en la vista pública con leyenda "sujeto a cambios".

**Acceptance Scenarios**:

1. **Given** una categoría sin tatami asignado, **When** el organizador la asigna a un tatami con un orden, **Then** la categoría aparece en el cronograma del tatami en la posición correcta.
2. **Given** un tatami tiene categorías en cola, **When** el organizador reordena, **Then** el orden se actualiza y se refleja inmediatamente.
3. **Given** la categoría está asignada, **When** un competidor o el público consulta la vista del torneo, **Then** ve el tatami asignado con la leyenda "sujeto a cambios".

---

### User Story 3 - Mover categoría entre tatamis (Priority: P2)

El organizador puede mover una categoría de un tatami a otro en cualquier momento (antes, durante o después de que inicie), con confirmación explícita. El movimiento queda registrado en el historial de la categoría.

**Why this priority**: Situaciones imprevistas (tatami roto, árbitro ausente, retraso) requieren flexibilidad total sin perder datos.

**Independent Test**: Asignar categoría a Tatami A → moverla a Tatami B → verificar que aparece en Tatami B, que el historial registra el movimiento, y que los datos de la categoría (competidores, combates) están intactos.

**Acceptance Scenarios**:

1. **Given** una categoría asignada a Tatami A, **When** el organizador la mueve a Tatami B con confirmación, **Then** la categoría aparece en Tatami B y el historial registra el movimiento con timestamp.
2. **Given** la categoría está en estado "en_curso", **When** el organizador intenta moverla, **Then** aparece una confirmación adicional advirtiendo que la categoría está en competencia activa.
3. **Given** la categoría fue movida, **When** el público consulta la vista, **Then** ve el nuevo tatami con la leyenda "sujeto a cambios".
4. **Given** el organizador consulta el historial, **When** hubo movimientos, **Then** ve tatami origen, tatami destino, timestamp y motivo de cada movimiento.

---

### User Story 4 - Inscribir competidor fuera de su rango (Priority: P3)

El organizador puede agregar un competidor a una categoría que no le corresponde por edad o peso (inscripción manual forzada), cuando la categoría de origen tiene muy pocos participantes. Esta acción queda registrada como "inscripción manual" y el organizador debe confirmarla explícitamente.

**Why this priority**: Situación frecuente en torneos locales donde categorías chicas no llegan al mínimo de participantes.

**Independent Test**: Competidor con edad 10 años → agregar manualmente a categoría de 12-13 años → sistema advierte que no corresponde → organizador confirma → competidor aparece en la categoría con marca "inscripción manual".

**Acceptance Scenarios**:

1. **Given** un competidor no cumple los rangos de la categoría, **When** el organizador lo agrega manualmente, **Then** el sistema advierte el incumplimiento y pide confirmación explícita.
2. **Given** el organizador confirma la inscripción manual, **When** el competidor queda agregado, **Then** aparece en la categoría marcado visualmente como "inscripción manual" o "fuera de rango".
3. **Given** una inscripción manual, **When** se genera el bracket, **Then** el competidor participa normalmente junto al resto.

---

### Edge Cases

- Categoría sin competidores: puede existir pero no se puede generar bracket.
- Mover categoría con combates en curso: requiere doble confirmación con advertencia de riesgo.
- Dos categorías en el mismo tatami con el mismo orden: el sistema debe validar unicidad de `(tatami_id, orden_en_tatami)` y reasignar automáticamente.
- Competidor en dos categorías del mismo torneo: el CLAUDE.md define que un competidor solo puede estar en una categoría — la inscripción manual respeta esta regla (se debe quitar de la categoría anterior).
- Tatami sin orden definido aún: la categoría existe pero aparece como "sin tatami asignado" en el cronograma.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir crear categorías al nivel del torneo con: nombre, modalidad (kata_individual, kata_equipo, kumite_individual, kumite_equipo), género (masculino, femenino, mixto), edad_min, edad_max, peso_min, peso_max (solo kumite), cinturon_min, cinturon_max.
- **FR-002**: Cada categoría DEBE poder asignarse a un tatami con un número de orden dentro del cronograma del tatami.
- **FR-003**: El `orden_en_tatami` DEBE ser único por tatami — no puede haber dos categorías en el mismo tatami con el mismo orden.
- **FR-004**: El organizador DEBE poder reordenar las categorías en el cronograma de un tatami.
- **FR-005**: El organizador DEBE poder mover una categoría a otro tatami en cualquier estado, con confirmación explícita. Si la categoría está en estado "en_curso", la confirmación debe incluir una advertencia adicional.
- **FR-006**: Cada movimiento de categoría entre tatamis DEBE quedar registrado en la tabla `movimiento_categoria` con: tatami_origen, tatami_destino, timestamp y campo de motivo opcional.
- **FR-007**: El tatami asignado a una categoría DEBE ser visible en la vista pública desde el momento de la asignación, con la leyenda "El tatami está sujeto a cambios" visible en todas las categorías.
- **FR-008**: El organizador DEBE poder agregar un competidor a una categoría fuera de su rango con confirmación explícita. El competidor queda marcado como "inscripción manual".
- **FR-009**: Un competidor DEBE estar en una sola categoría por torneo — al agregar manualmente a otra, el sistema DEBE preguntar si se quiere mover (quitar de la anterior) o solo agregar (duplicado no permitido).
- **FR-010**: El sistema DEBE mostrar el cronograma del día por tatami: lista ordenada de categorías asignadas al tatami con su estado.

### Key Entities

- **Categoria**: Nombre, modalidad, género, rangos de edad/peso/cinturón, estado, `tatami_id` (nullable), `orden_en_tatami` (nullable), `torneo_id`.
- **Movimiento_categoria**: Registro histórico de cada reasignación. Campos: `categoria_id`, `tatami_id_anterior`, `tatami_id_nuevo`, `motivo` (texto libre, opcional), `created_at`.
- **Competidor** (relación con categoría): campo `inscripcion_manual` (boolean) para marcar inscripciones fuera de rango.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El organizador puede crear y asignar una categoría a un tatami en menos de 1 minuto.
- **SC-002**: El movimiento de una categoría entre tatamis se completa en menos de 5 segundos y el historial queda registrado automáticamente.
- **SC-003**: La vista pública muestra el tatami actualizado en tiempo real (menos de 3 segundos) cuando hay un movimiento.
- **SC-004**: El 100% de los movimientos de categorías quedan registrados en el historial con timestamp.
- **SC-005**: Las inscripciones manuales fuera de rango requieren confirmación explícita en el 100% de los casos — ninguna pasa silenciosamente.

## Assumptions

- Un competidor solo puede estar en una categoría por torneo (regla de CLAUDE.md) — la inscripción manual implica mover, no duplicar.
- El campo `motivo` del movimiento es opcional — el organizador puede dejarlo en blanco.
- La leyenda "sujeto a cambios" aplica a TODAS las categorías, independientemente de si hubo o no movimientos previos.
- La tabla `movimiento_categoria` es solo de lectura para el organizador — no se pueden editar ni borrar registros del historial.
- El `orden_en_tatami` es un número entero positivo; el sistema valida unicidad por tatami pero no requiere que sean consecutivos.
- Las categorías pueden crearse en cualquier momento mientras el torneo esté en estado "borrador" o "inscripciones"; no se pueden crear nuevas categorías si el torneo está "en_curso" o "finalizado".
