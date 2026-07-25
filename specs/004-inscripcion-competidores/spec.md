# Feature Specification: Inscripción de Competidores

**Feature Branch**: `feature/004-inscripcion-competidores`

**Created**: 2026-06-03

**Status**: Draft

**Input**: El organizador puede registrar competidores en el torneo, asignándolos a una categoría. Cada competidor tiene: nombre, apellido, club, país, fecha de nacimiento, peso, cinturón. Un competidor solo puede estar en una categoría por torneo. El sistema debe validar si el competidor está fuera del rango de edad o peso de la categoría y advertir (pero permitir inscripción manual con confirmación). El estado del competidor empieza en "inscrito". Para modalidades de equipo, los competidores se agrupan en equipos de 3 dentro de la misma categoría.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Registrar un competidor en una categoría (Priority: P1)

El organizador navega a la lista de competidores de una categoría y registra a un nuevo competidor completando sus datos personales. Si los datos están dentro del rango de edad y peso de la categoría, el competidor queda inscrito de inmediato.

**Why this priority**: Es el flujo central del feature. Sin inscripción no hay competencia.

**Independent Test**: Ir a una categoría con inscripciones abiertas → agregar competidor con datos válidos → el competidor aparece en la lista con estado "inscrito".

**Acceptance Scenarios**:

1. **Given** una categoría en estado "abierta", **When** el organizador completa el formulario con datos dentro del rango, **Then** el competidor aparece en la lista de esa categoría con estado "inscrito".
2. **Given** el formulario de inscripción, **When** se deja vacío el nombre o apellido, **Then** el sistema muestra error y no guarda.
3. **Given** una categoría cerrada o en curso, **When** el organizador intenta inscribir, **Then** el sistema no permite la acción y explica el motivo.

---

### User Story 2 — Inscripción fuera de rango con confirmación (Priority: P1)

El organizador intenta inscribir a un competidor cuya edad o peso no coincide con los rangos definidos en la categoría. El sistema advierte claramente pero permite continuar si el organizador confirma explícitamente.

**Why this priority**: Torneo locales frecuentemente necesitan excepciones. Bloquear sin opción de override haría inutilizable el sistema.

**Independent Test**: Intentar inscribir competidor con edad fuera de rango → aparece advertencia con motivos → confirmar → competidor queda inscrito con marca de "inscripción manual".

**Acceptance Scenarios**:

1. **Given** un competidor con edad fuera del rango de la categoría, **When** se intenta inscribir, **Then** aparece advertencia con el motivo específico (edad, peso, o ambos).
2. **Given** la advertencia de fuera de rango, **When** el organizador confirma, **Then** el competidor queda inscrito con una marca visual de "inscripción manual".
3. **Given** la advertencia de fuera de rango, **When** el organizador cancela, **Then** no se guarda nada.

---

### User Story 3 — Ver y gestionar la lista de competidores de una categoría (Priority: P2)

El organizador puede ver todos los competidores inscritos en una categoría, con sus datos y estado, y puede eliminar una inscripción si el torneo aún no comenzó.

**Why this priority**: Sin visibilidad de la lista, el organizador no puede gestionar las inscripciones ni detectar duplicados o errores.

**Independent Test**: Ir a la lista de competidores de una categoría → ver nombre, club, edad, peso, estado → eliminar uno → desaparece de la lista.

**Acceptance Scenarios**:

1. **Given** una categoría con competidores inscritos, **When** el organizador abre la lista, **Then** ve nombre completo, club, edad calculada, peso, cinturón y estado de cada competidor.
2. **Given** un competidor inscrito y torneo no iniciado, **When** el organizador lo elimina con confirmación, **Then** el competidor desaparece de la lista.
3. **Given** un torneo en curso, **When** el organizador intenta eliminar un competidor, **Then** el sistema bloquea la acción.

---

### User Story 4 — Agrupar competidores en equipos (modalidades de equipo) (Priority: P3)

Para categorías de kumite equipo o kata equipo, el organizador forma equipos de 3 competidores a partir de los inscritos en esa categoría, asignando un nombre al equipo.

**Why this priority**: Necesario para modalidades de equipo, pero las inscripciones individuales deben funcionar primero.

**Independent Test**: En una categoría de kata equipo con 6 competidores inscritos → crear 2 equipos de 3 → cada equipo aparece en la lista con sus miembros.

**Acceptance Scenarios**:

1. **Given** una categoría de equipo con al menos 3 competidores inscritos, **When** el organizador crea un equipo, **Then** el equipo aparece con nombre y sus 3 miembros.
2. **Given** un competidor ya asignado a un equipo, **When** se intenta asignarlo a otro equipo en la misma categoría, **Then** el sistema lo impide.
3. **Given** una categoría individual, **When** el organizador abre la vista, **Then** no aparece la sección de equipos.

---

### Edge Cases

- ¿Qué pasa si se intenta inscribir al mismo competidor (mismo nombre/club) dos veces en la misma categoría? → El sistema no tiene un ID único externo; se permite porque puede haber homónimos. No se bloquea.
- ¿Qué pasa si una categoría no tiene rangos de edad o peso definidos? → No se valida fuera de rango; se permite inscripción directa.
- ¿Qué pasa si se inscribe un competidor sin fecha de nacimiento? → La edad no se calcula; el campo es opcional pero sin él no se puede validar rango de edad.
- ¿Qué pasa si el torneo pasa a estado "en curso" mientras hay inscripciones abiertas? → Las inscripciones existentes se conservan; no se pueden agregar ni eliminar nuevas.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir inscribir competidores en una categoría con estado "abierta".
- **FR-002**: El sistema DEBE requerir nombre, apellido y categoría de destino como campos obligatorios; el resto son opcionales.
- **FR-003**: El sistema DEBE calcular la edad del competidor a partir de la fecha de nacimiento al momento de la inscripción.
- **FR-004**: El sistema DEBE comparar edad y peso del competidor con los rangos de la categoría y mostrar advertencia si están fuera de rango, indicando qué campo(s) no cumplen.
- **FR-005**: El sistema DEBE permitir confirmar una inscripción fuera de rango; el competidor queda marcado como "inscripción manual".
- **FR-006**: El sistema DEBE impedir inscribir en una categoría con estado distinto a "abierta".
- **FR-007**: El sistema DEBE mostrar la lista de competidores de una categoría con nombre, club, edad calculada, peso, cinturón y estado.
- **FR-008**: El sistema DEBE permitir eliminar un competidor inscrito cuando el torneo está en estado "borrador" o "inscripciones".
- **FR-009**: Para categorías de equipo, el sistema DEBE permitir agrupar competidores inscritos en equipos de exactamente 3 miembros con un nombre de equipo.
- **FR-010**: El sistema DEBE impedir asignar el mismo competidor a más de un equipo dentro de la misma categoría.

### Key Entities

- **Competidor**: Persona que participa en el torneo. Atributos: nombre, apellido, club, país, fecha de nacimiento, peso, cinturón, estado (inscrito | confirmado | descalificado), inscripcion_manual (bool).
- **Categoría**: Ya existente. Tiene modalidad, rangos de edad y peso, estado.
- **Equipo** (solo modalidades de equipo): Agrupación de exactamente 3 competidores de la misma categoría. Atributos: nombre, club, miembros (3 referencias a competidor).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El organizador puede inscribir a un competidor dentro de rango en menos de 60 segundos.
- **SC-002**: El sistema muestra la advertencia de fuera de rango antes de guardar, sin pérdida de los datos ya ingresados.
- **SC-003**: La lista de competidores de una categoría es visible sin demora perceptible al abrir la pantalla.
- **SC-004**: El 100% de los intentos de inscripción en categorías cerradas o en curso son bloqueados con mensaje explicativo.
- **SC-005**: La formación de equipos (P3) no requiere más de 3 pasos para crear un equipo completo.

---

## Assumptions

- La autenticación de usuarios no está implementada aún; el organizador opera sin login en esta etapa.
- Un competidor se identifica por sus datos (no hay ID externo); homónimos son posibles y permitidos.
- La edad se calcula como años cumplidos a la fecha actual al momento de inscribir.
- El cinturón se ingresa como texto libre (ej: "cinta negra 1er dan") — no hay catálogo cerrado en esta etapa.
- El país se ingresa como texto libre — no hay selector de países en esta etapa.
- La modalidad de equipo con 4 miembros rotativos (reglamento WKF) queda fuera de esta iteración; se implementa equipo fijo de 3.
- Las inscripciones de entrenadores (rol futuro) quedan fuera de este feature.
