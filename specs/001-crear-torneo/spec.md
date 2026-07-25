# Feature Specification: Gestión de Torneos — Lista y Creación

**Feature Branch**: `feature/001-crear-torneo`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Lista de torneos y formulario para crear un torneo nuevo. El organizador ve todos sus torneos, puede crear uno nuevo con nombre, fecha de inicio, fecha de fin, lugar y logo opcional. El torneo se crea en estado borrador para cuando ya tenga todo configurado pueda pasarlo a estado Activo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver lista de torneos (Priority: P1)

El organizador accede a la app y ve todos los torneos que ha creado, con su nombre, fechas, lugar y estado actual. Si no tiene ninguno, ve una pantalla vacía con un botón para crear el primero.

**Why this priority**: Sin la lista no hay punto de entrada a ninguna otra función del sistema. Es la pantalla raíz del organizador.

**Independent Test**: Puede testearse abriendo la app y verificando que se listan los torneos existentes, o que aparece el estado vacío si no hay ninguno.

**Acceptance Scenarios**:

1. **Given** el organizador tiene torneos creados, **When** accede a la pantalla principal, **Then** ve una lista con nombre, fecha de inicio, fecha de fin, lugar y estado de cada torneo.
2. **Given** el organizador no tiene torneos, **When** accede a la pantalla principal, **Then** ve un mensaje de estado vacío y un botón para crear su primer torneo.
3. **Given** hay torneos en distintos estados, **When** los ve en la lista, **Then** el estado de cada torneo está claramente indicado (borrador, inscripciones, en curso, finalizado).

---

### User Story 2 - Crear un torneo nuevo (Priority: P2)

El organizador hace clic en "Crear torneo", completa el formulario con nombre, fecha de inicio, fecha de fin y lugar. Opcionalmente sube un logo. Al guardar, el torneo aparece en la lista con estado "borrador".

**Why this priority**: Es la acción que habilita todo el flujo posterior. Sin torneo no hay tatamis, categorías ni competidores.

**Independent Test**: Puede testearse llenando el formulario y verificando que el torneo aparece en la lista con los datos ingresados y estado "borrador".

**Acceptance Scenarios**:

1. **Given** el organizador está en la lista de torneos, **When** hace clic en "Crear torneo" y completa nombre, fechas y lugar, **Then** el torneo se guarda y aparece en la lista con estado "borrador".
2. **Given** el formulario está abierto, **When** intenta guardar sin completar un campo obligatorio, **Then** el sistema muestra un error en el campo faltante y no guarda.
3. **Given** el formulario está abierto, **When** ingresa una fecha de fin anterior a la de inicio, **Then** el sistema muestra un error de validación antes de guardar.
4. **Given** el formulario está abierto, **When** no sube logo, **Then** el torneo se crea igualmente con logo vacío.
5. **Given** el torneo fue creado, **When** el organizador vuelve a la lista, **Then** el nuevo torneo aparece inmediatamente sin necesidad de recargar.

---

### User Story 3 - Avanzar estado del torneo a inscripciones (Priority: P3)

Desde la lista o el detalle del torneo, el organizador puede cambiar el estado de "borrador" a "inscripciones" (equivale a "Activo" para el usuario) cuando considera que el torneo está listo para recibir competidores.

**Why this priority**: Necesario para el flujo completo, pero depende de que el torneo tenga al menos un tatami y una categoría configurados. Se valida antes del cambio de estado.

**Independent Test**: El test real de US3 depende del feature de tatamis (futuro). En esta versión: crear un torneo en borrador → hacer clic en "Activar" → verificar que aparece el modal informativo con el mensaje de prerrequisitos.

**Acceptance Scenarios**:

1. **Given** un torneo en estado "borrador" tiene al menos un tatami con al menos una categoría, **When** el organizador lo activa, **Then** el estado cambia a "inscripciones".
2. **Given** un torneo en estado "borrador" no tiene tatamis ni categorías, **When** el organizador intenta activarlo, **Then** el sistema muestra un mensaje explicando que debe configurar al menos un tatami y una categoría primero.
3. **Given** un torneo en cualquier estado, **When** el organizador lo ve en la lista, **Then** el estado actual está claramente visible.

---

### Edge Cases

- Si no hay torneos: pantalla de estado vacío con CTA para crear el primero.
- Si la fecha de fin es anterior a la de inicio: error de validación en el formulario, no se guarda.
- Si el nombre está vacío: error de validación, campo requerido.
- Si el logo supera el tamaño máximo: mensaje de error con indicación del límite (2 MB).
- Si se pierde la conexión al guardar: el formulario muestra un error y permite reintentar sin perder los datos ingresados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar la lista de todos los torneos disponibles en la base de datos.
- **FR-002**: El organizador DEBE poder iniciar la creación de un torneo desde la lista mediante un botón "Crear torneo".
- **FR-003**: El formulario de creación DEBE incluir los campos: nombre (texto, obligatorio), fecha de inicio (fecha, obligatorio), fecha de fin (fecha, obligatorio), lugar (texto, obligatorio), logo (imagen, opcional).
- **FR-004**: El sistema DEBE validar que ningún campo obligatorio quede vacío antes de guardar.
- **FR-005**: El sistema DEBE validar que la fecha de fin no sea anterior a la fecha de inicio.
- **FR-006**: El torneo DEBE crearse automáticamente con estado "borrador".
- **FR-007**: El torneo recién creado DEBE aparecer en la lista inmediatamente después de guardarse.
- **FR-008** *(deferred — depende del feature de tatamis)*: El sistema DEBE permitir cambiar el estado de un torneo de "borrador" a "inscripciones" solo si tiene al menos un tatami con al menos una categoría configurada. En esta versión (001-crear-torneo), el botón "Activar" muestra un modal informativo explicando el requisito; el enforcement real se implementa en el feature de tatamis.
- **FR-009**: Cada torneo en la lista DEBE mostrar: nombre, fecha de inicio, fecha de fin, lugar y estado.
- **FR-010**: El sistema DEBE mostrar una pantalla de estado vacío con un llamado a la acción cuando no existen torneos.

### Key Entities

- **Torneo**: Representa una competencia de karate. Tiene nombre, fecha de inicio, fecha de fin, lugar, logo opcional y un estado que avanza linealmente (borrador → inscripciones → en curso → finalizado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El organizador puede crear un torneo completo en menos de 2 minutos desde que abre el formulario hasta que el torneo aparece en la lista.
- **SC-002**: La lista muestra correctamente nombre, fechas, lugar y estado de cada torneo.
- **SC-003**: El 100% de los errores de validación se detectan antes del envío del formulario, sin llegar al servidor.
- **SC-004**: El torneo aparece en la lista en menos de 3 segundos después de ser guardado.
- **SC-005**: El cambio de estado de "borrador" a "inscripciones" solo es posible cuando se cumplen los prerrequisitos de configuración.

## Assumptions

- El organizador ya está autenticado en la app (Auth se implementa en un feature separado; por ahora todos los usuarios pueden crear y ver torneos).
- El logo se almacena como imagen en el servicio de almacenamiento de Supabase; el campo logo_url guarda la URL resultante.
- El término "Activo" usado por el organizador equivale al estado interno "inscripciones" del sistema.
- Los estados del torneo solo avanzan, nunca retroceden.
- Un torneo puede tener el mismo nombre que otro (no hay restricción de unicidad por nombre).
- El límite de tamaño del logo es 2 MB.
