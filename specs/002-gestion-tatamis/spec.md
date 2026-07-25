# Feature Specification: Gestión de Tatamis dentro de un Torneo

**Feature Branch**: `feature/002-gestion-tatamis`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Gestión de tatamis dentro de un torneo. El organizador puede ver los tatamis de un torneo, crear nuevos tatamis con nombre y árbitro opcional, y eliminarlos si no tienen combates en curso. Los tatamis se crean dentro de un torneo específico y se listan en el dashboard del torneo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver tatamis del torneo (Priority: P1)

El organizador accede al dashboard de un torneo y ve todos los tatamis creados, con su nombre, orden y árbitro asignado (si tiene). Si no hay tatamis, ve un estado vacío con un botón para crear el primero.

**Why this priority**: Sin ver los tatamis existentes no hay punto de entrada para gestionarlos. Es la pantalla base de configuración del torneo.

**Independent Test**: Abrir el dashboard de un torneo → ver la lista de tatamis o estado vacío. No requiere ninguna otra user story implementada.

**Acceptance Scenarios**:

1. **Given** un torneo tiene tatamis creados, **When** el organizador accede al dashboard del torneo, **Then** ve una lista con el nombre y árbitro de cada tatami, ordenados por su número de orden.
2. **Given** un torneo no tiene tatamis, **When** el organizador accede al dashboard, **Then** ve un estado vacío con un mensaje y un botón "Agregar tatami".
3. **Given** un tatami tiene árbitro asignado, **When** se muestra en la lista, **Then** el nombre del árbitro es visible junto al tatami.
4. **Given** un tatami no tiene árbitro asignado, **When** se muestra en la lista, **Then** aparece como "Sin árbitro asignado".

---

### User Story 2 - Crear un tatami (Priority: P2)

El organizador hace clic en "Agregar tatami", ingresa el nombre (ej: "Tatami A") y opcionalmente escribe el nombre del árbitro. Al guardar, el tatami aparece en la lista del torneo.

**Why this priority**: Sin tatamis no se pueden asignar categorías ni competidores. Es el siguiente paso obligatorio tras crear el torneo.

**Independent Test**: Hacer clic en "Agregar tatami" → completar el formulario → guardar → el tatami aparece en la lista del torneo.

**Acceptance Scenarios**:

1. **Given** el organizador está en el dashboard del torneo, **When** hace clic en "Agregar tatami" y completa el nombre, **Then** el tatami se crea y aparece en la lista con el orden correcto.
2. **Given** el formulario está abierto, **When** intenta guardar sin nombre, **Then** el sistema muestra un error y no guarda.
3. **Given** el formulario está abierto, **When** no asigna árbitro, **Then** el tatami se crea igualmente sin árbitro.
4. **Given** ya existen tatamis, **When** se crea uno nuevo, **Then** el orden del nuevo tatami es el siguiente número disponible (ej: si hay 2, el nuevo es el 3).
5. **Given** el tatami fue creado, **When** el organizador vuelve al dashboard, **Then** el tatami aparece inmediatamente sin recargar.

---

### User Story 3 - Eliminar un tatami (Priority: P3)

El organizador puede eliminar un tatami que no tenga categorías ni combates asignados. Si tiene categorías o combates, el sistema muestra un mensaje explicando por qué no puede eliminarse.

**Why this priority**: Necesario para corregir errores de configuración, pero bloqueado por integridad de datos.

**Independent Test**: Crear un tatami → intentar eliminarlo → verificar que desaparece de la lista. Con categorías asignadas → verificar que el sistema bloquea la eliminación.

**Acceptance Scenarios**:

1. **Given** un tatami no tiene categorías ni combates, **When** el organizador lo elimina, **Then** el tatami desaparece de la lista.
2. **Given** un tatami tiene categorías asignadas, **When** el organizador intenta eliminarlo, **Then** el sistema muestra un mensaje indicando que primero debe eliminar las categorías.
3. **Given** el organizador hace clic en eliminar, **When** aparece la confirmación, **Then** debe confirmar la acción antes de que se ejecute.

---

### Edge Cases

- Si no hay tatamis: estado vacío con CTA para crear el primero.
- Si el nombre del tatami está vacío: error de validación, no se guarda.
- Si se pierde la conexión al guardar: el formulario muestra error y permite reintentar.
- Si el torneo está en estado "en_curso" o "finalizado": no se pueden crear ni eliminar tatamis.
- Dos tatamis del mismo torneo pueden tener el mismo nombre (no hay restricción de unicidad).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar la lista de tatamis de un torneo específico, ordenados por su campo `orden`.
- **FR-002**: El organizador DEBE poder crear un tatami con nombre obligatorio y árbitro opcional dentro de un torneo.
- **FR-003**: El sistema DEBE asignar automáticamente el número de orden al nuevo tatami (siguiente disponible dentro del torneo).
- **FR-004**: El sistema DEBE validar que el nombre del tatami no esté vacío antes de guardar.
- **FR-005**: El nuevo tatami DEBE aparecer en la lista inmediatamente después de ser creado.
- **FR-006**: El organizador DEBE poder eliminar un tatami siempre que no tenga categorías asignadas.
- **FR-007**: El sistema DEBE mostrar una confirmación antes de eliminar un tatami.
- **FR-008**: El sistema DEBE bloquear la eliminación si el tatami tiene categorías asignadas, mostrando un mensaje explicativo.
- **FR-009**: El sistema DEBE mostrar un estado vacío con llamado a la acción cuando el torneo no tiene tatamis.
- **FR-010**: La creación y eliminación de tatamis DEBE estar bloqueada si el torneo está en estado "en_curso" o "finalizado".

### Key Entities

- **Tatami**: Área de competencia dentro de un torneo. Tiene nombre, número de orden (asignado automáticamente), árbitro opcional (nombre de texto libre por ahora, hasta implementar Auth), y pertenece a un torneo específico.
- **Torneo**: Contexto padre del tatami. El estado del torneo determina si se pueden crear o eliminar tatamis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El organizador puede crear un tatami en menos de 30 segundos desde que abre el formulario hasta que aparece en la lista.
- **SC-002**: La lista de tatamis muestra correctamente nombre, orden y árbitro de cada tatami.
- **SC-003**: El 100% de los intentos de eliminación con categorías asignadas son bloqueados con mensaje explicativo.
- **SC-004**: El número de orden se asigna automáticamente sin intervención del organizador.
- **SC-005**: La creación y eliminación están bloqueadas correctamente cuando el torneo está en curso o finalizado.

## Assumptions

- El árbitro se ingresa como texto libre por ahora (nombre del árbitro); cuando se implemente Auth se vinculará a un usuario real.
- El campo `orden` se asigna automáticamente como `max(orden) + 1` dentro del torneo; no es editable por el organizador en esta versión.
- La eliminación de tatamis verifica únicamente la existencia de categorías (feature de categorías pendiente); por ahora si no hay categorías, se puede eliminar.
- El dashboard del torneo es una ruta anidada bajo `/torneo/:id/`.
- No hay límite máximo de tatamis por torneo definido — se soportan tantos como el organizador necesite.
- El árbitro de un tatami es único por torneo (un árbitro no puede estar en dos tatamis del mismo torneo) — validación diferida a cuando exista Auth.
