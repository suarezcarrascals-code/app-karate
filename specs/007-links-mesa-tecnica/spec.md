# Feature Specification: Links de Acceso para Mesa Técnica

**Feature Branch**: `feature/007-links-mesa-tecnica`

**Created**: 2026-06-10

**Status**: Draft

**Input**: Links de acceso para mesa técnica: el organizador genera un link único por tatami que la mesa técnica abre sin login para operar el marcador. El link puede regenerarse si falla. Solo funciona mientras el torneo está activo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Generar y compartir link por tatami (Priority: P1)

El organizador, dentro de un torneo, genera un link para cada tatami y lo copia para enviarlo por WhatsApp a la persona que va a operar el marcador. Desde la misma pantalla puede ver el estado de cada link (activo, no generado) y regenerarlo si necesita.

**Why this priority**: Sin este link la mesa técnica no puede operar el marcador. Es el punto de entrada a toda la funcionalidad.

**Independent Test**: Ir al panel de tatamis del torneo → generar link para Tatami A → copiar link → pegarlo en el navegador y verificar que carga el marcador.

**Acceptance Scenarios**:

1. **Given** el torneo tiene tatamis creados, **When** el organizador va a la sección de links, **Then** ve un listado de todos los tatamis con su estado de link (Activo / Sin generar).
2. **Given** un tatami sin link, **When** el organizador presiona "Generar link", **Then** aparece el link generado con un botón para copiarlo al portapapeles.
3. **Given** un tatami con link activo, **When** el organizador presiona "Copiar", **Then** el link se copia al portapapeles con confirmación visual.
4. **Given** un tatami con link activo, **When** el organizador presiona "Regenerar", **Then** se genera un nuevo link, el anterior queda inactivo, y el nuevo link aparece listo para copiar.

---

### User Story 2 — Mesa técnica accede al marcador sin login (Priority: P1)

La persona de mesa técnica abre el link en su laptop. Sin crear cuenta ni contraseña, ve directamente el panel de puntuación del tatami asignado y puede operar el marcador.

**Why this priority**: Es el objetivo principal del feature — que la mesa técnica pueda trabajar el día del torneo sin fricción.

**Independent Test**: Abrir el link en un navegador sin sesión iniciada → debe cargar el marcador del tatami correspondiente.

**Acceptance Scenarios**:

1. **Given** un link válido y el torneo en estado `en_curso`, **When** la mesa técnica abre la URL, **Then** ve el panel de puntuación del tatami sin que se le pida login.
2. **Given** un link válido pero el torneo aún no está `en_curso`, **When** se abre la URL, **Then** ve una pantalla de espera con el nombre del torneo y el tatami, indicando que el torneo no ha comenzado.
3. **Given** el torneo pasa a `finalizado`, **When** alguien intenta usar el link, **Then** ve una pantalla que indica que el torneo ya terminó — el link ya no funciona.
4. **Given** un token inválido o inexistente, **When** se abre la URL, **Then** ve una pantalla de error clara con instrucciones: "Pedile al organizador un nuevo link".

---

### User Story 3 — Recuperación ante fallas (Priority: P2)

Si el link deja de funcionar por cualquier motivo (link compartido sin autorización, error de red, etc.), el organizador puede generar un nuevo link en segundos sin afectar el torneo. La mesa técnica que tenía el link anterior ve un mensaje claro indicando que pida el nuevo link.

**Why this priority**: Garantiza continuidad operacional el día del torneo, que es cuando más importa que no haya interrupciones.

**Independent Test**: Generar un link → abrirlo en el navegador → regenerar el link desde el panel del organizador → refrescar la pestaña de mesa técnica → debe mostrar mensaje de link inválido.

**Acceptance Scenarios**:

1. **Given** la mesa técnica está usando un link activo, **When** el organizador regenera el link de ese tatami, **Then** al refrescar, la mesa técnica ve "Este link ya no es válido. Pedile al organizador el link actualizado."
2. **Given** el organizador quiere repartir el link rápidamente, **When** genera un link para un tatami sin link previo, **Then** el proceso toma menos de 3 segundos.
3. **Given** el organizador generó un nuevo link, **When** la mesa técnica abre el nuevo link, **Then** accede al marcador del mismo tatami sin interrupción.

---

### Edge Cases

- ¿Qué pasa si se intenta generar un link para un tatami de un torneo que no es del organizador logueado? → Debe fallar silenciosamente (RLS bloquea).
- ¿Qué pasa si la mesa técnica deja el link abierto y el torneo termina? → La pantalla debe mostrar el mensaje de torneo finalizado.
- ¿Qué pasa si el mismo link se abre en múltiples pestañas o dispositivos? → Funciona en todos (el link no tiene límite de sesiones simultáneas).
- ¿Qué pasa si un tatami no tiene combates activos? → El marcador muestra el tatami pero indica que no hay combate activo actualmente.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir al organizador generar un link único por tatami dentro de un torneo.
- **FR-002**: El sistema DEBE desactivar el link anterior cuando se genera uno nuevo para el mismo tatami.
- **FR-003**: El link DEBE funcionar sin requerir que la mesa técnica tenga una cuenta o sesión activa.
- **FR-004**: El link DEBE dejar de funcionar automáticamente cuando el torneo pasa a estado `finalizado`.
- **FR-005**: El sistema DEBE mostrar al organizador el estado de cada link por tatami (activo, sin generar).
- **FR-006**: El sistema DEBE permitir copiar el link al portapapeles con un solo click.
- **FR-007**: El sistema DEBE mostrar un mensaje de error claro cuando el link es inválido, expirado o el torneo no está activo — con instrucción de contactar al organizador.
- **FR-008**: El sistema DEBE mostrar una pantalla de espera cuando el link es válido pero el torneo no ha iniciado aún.
- **FR-009**: El link generado DEBE ser impredecible (token aleatorio) para evitar accesos no autorizados.
- **FR-010**: El marcador accedido por link DEBE mostrar el tatami y la categoría activa, identificando claramente el contexto al operador.

### Key Entities

- **link_mesa_tecnica**: Representa el acceso de una mesa técnica a un tatami. Tiene un token único, referencia al tatami y al torneo, y un estado (activo/inactivo). Un tatami solo puede tener un link activo a la vez.
- **Tatami**: Entidad existente. Ahora puede tener un link de mesa técnica asociado.
- **Torneo**: Su estado (`en_curso` / `finalizado`) determina si los links de mesa técnica funcionan.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El organizador puede generar y copiar un link en menos de 10 segundos desde que entra al panel.
- **SC-002**: La mesa técnica carga el marcador en menos de 5 segundos desde que abre el link.
- **SC-003**: Un link regenerado invalida el anterior en menos de 1 segundo — no hay ventana de acceso simultáneo de dos links para el mismo tatami.
- **SC-004**: El 100% de los links inválidos (expirados, inexistentes, torneo finalizado) muestran un mensaje de error con instrucciones claras en lugar de una pantalla en blanco.
- **SC-005**: Un operador sin conocimiento técnico puede entender la pantalla de error y saber qué hacer sin asistencia adicional.

---

## Assumptions

- El torneo debe estar en estado `en_curso` para que los links funcionen. Si está en `inscripciones` o `borrador`, los links muestran pantalla de espera.
- No hay límite de sesiones simultáneas por link — la misma URL puede estar abierta en varias pestañas o dispositivos al mismo tiempo.
- El organizador gestiona los links desde el panel existente del torneo (sección de tatamis o inscripciones).
- La generación del link no requiere que el torneo esté en ningún estado específico — el organizador puede preparar los links antes del evento.
- El link no expira por tiempo, solo por regeneración manual o por finalización del torneo.
- La tabla `link_mesa_tecnica` ya existe en la base de datos (creada en el feature 006-autenticacion).
