# Feature Specification: Links de Inscripción por Club

**Feature Branch**: `005-links-inscripcion-club`

**Created**: 2026-06-06

**Status**: Draft

**Input**: Sistema de links de inscripción por club con límite de atletas, acceso sin cuenta para entrenadores, y gestión desde el panel del organizador.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Entrenador inscribe atletas por link (Priority: P1)

El entrenador recibe un link por WhatsApp del organizador. Lo abre desde su celular o computador sin necesidad de crear cuenta. Ve el nombre del torneo y el nombre de su club. Ve las categorías disponibles. Agrega a sus atletas uno por uno: completa el formulario con los datos del atleta, el sistema le sugiere automáticamente la categoría correcta según edad, peso y género, el entrenador confirma o elige otra, y presiona "Agregar atleta". El atleta aparece en la lista y el formulario se limpia para el siguiente. Cuando llega al límite de atletas acordado, el formulario desaparece y aparece un mensaje de cierre.

**Why this priority**: Es la razón de existir de toda esta feature. Sin esto, las inscripciones no funcionan.

**Independent Test**: Abrir el link en un navegador → agregar 3 atletas con diferentes datos → verificar que el sistema sugiere la categoría correcta → verificar que al llegar al límite el formulario se bloquea.

**Acceptance Scenarios**:

1. **Given** el entrenador tiene el link, **When** lo abre en el navegador, **Then** ve el nombre del torneo, el nombre de su club y un contador "0 de N atletas registrados".
2. **Given** el entrenador llena nombre, apellido, fecha de nacimiento, peso y género, **When** completa el formulario, **Then** el sistema resalta la categoría sugerida según esos datos.
3. **Given** el entrenador confirma la categoría y presiona "Agregar atleta", **When** el atleta es guardado, **Then** aparece en la lista, el contador sube en 1 y el formulario se limpia.
4. **Given** el entrenador ya llegó al límite de atletas, **When** intenta agregar uno más, **Then** el formulario está bloqueado y aparece el mensaje "Cupo completo para tu club".
5. **Given** el entrenador elige una categoría diferente a la sugerida, **When** guarda el atleta, **Then** se inscribe en la categoría elegida (no en la sugerida).

---

### User Story 2 — Organizador genera link para un club (Priority: P1)

El organizador acordó con un entrenador cuántos atletas va a inscribir y cobró por fuera. Desde su panel entra a la sección de clubs del torneo, selecciona el club, ingresa el límite de atletas, y genera el link. El sistema crea un link único para ese club. El organizador lo copia con un botón y lo pega en WhatsApp para mandárselo al entrenador.

**Why this priority**: Sin el link generado, el entrenador no puede inscribir. Es el paso previo obligatorio.

**Independent Test**: Desde el panel del organizador, generar un link para un club con límite de 10 → copiar el link → abrirlo en otro navegador → verificar que muestra el club correcto y el límite correcto.

**Acceptance Scenarios**:

1. **Given** el torneo tiene tatamis, categorías y clubs creados, **When** el organizador entra a la sección de inscripciones, **Then** ve la lista de clubs con el botón "Generar link" disponible.
2. **Given** el torneo NO tiene alguno de: tatamis, categorías o clubs, **When** el organizador intenta generar un link, **Then** el botón está deshabilitado con un mensaje que indica qué falta.
3. **Given** el organizador ingresa un límite de 12 y genera el link, **When** el link es creado, **Then** aparece un botón "Copiar link" y el estado del club cambia a "Link activo".
4. **Given** el link ya fue generado, **When** el organizador hace click en "Copiar link", **Then** el link se copia al portapapeles listo para pegar en WhatsApp.
5. **Given** ya existe un link activo para un club, **When** el organizador genera uno nuevo, **Then** el link anterior queda inválido y solo el nuevo funciona.

---

### User Story 3 — Organizador monitorea inscripciones en tiempo real (Priority: P2)

El organizador puede ver desde su panel cuántos atletas lleva inscrito cada club, sin necesidad de recargar la página. Si un entrenador está inscribiendo atletas en ese momento, el contador se actualiza solo.

**Why this priority**: Le permite al organizador saber el estado actual de inscripciones sin tener que llamar a cada entrenador.

**Independent Test**: Abrir el panel del organizador → en otro navegador abrir el link del entrenador y agregar un atleta → verificar que el contador del panel del organizador sube sin recargar.

**Acceptance Scenarios**:

1. **Given** el organizador tiene el panel abierto, **When** un entrenador agrega un atleta, **Then** el contador de ese club se actualiza en el panel sin recargar la página.
2. **Given** el organizador ve el panel, **When** mira la lista de clubs, **Then** ve para cada club: nombre del club, límite acordado, atletas inscritos hasta ahora, estado del link (activo / inactivo / no generado).

---

### User Story 4 — Organizador desactiva un link (Priority: P2)

Si un entrenador compartió el link con alguien no autorizado, o si el organizador necesita cancelar la inscripción de un club, puede desactivar el link desde su panel. A partir de ese momento el link deja de funcionar.

**Why this priority**: Control de acceso básico ante mal uso del link.

**Independent Test**: Generar link → abrirlo y confirmar que funciona → desactivarlo desde el panel → recargar la página del entrenador → verificar que muestra mensaje de link inactivo.

**Acceptance Scenarios**:

1. **Given** el link está activo, **When** el organizador presiona "Desactivar link", **Then** el estado cambia a "Inactivo" y se pide confirmación antes de hacerlo.
2. **Given** el link fue desactivado, **When** el entrenador intenta abrir el link, **Then** ve un mensaje claro: "Este link ya no está disponible. Contactá al organizador."
3. **Given** el link fue desactivado, **When** el organizador genera uno nuevo para el mismo club, **Then** el nuevo link funciona y el anterior sigue inactivo.

---

### Edge Cases

- ¿Qué pasa si el entrenador intenta agregar un atleta con datos incompletos? → El formulario no permite enviarlo hasta que todos los campos estén llenos.
- ¿Qué pasa si no hay categorías compatibles con los datos del atleta? → El sistema muestra todas las categorías sin resaltar ninguna, y el entrenador elige manualmente.
- ¿Qué pasa si dos personas usan el mismo link al mismo tiempo y ambas están en el último cupo? → El sistema respeta el límite: la primera en guardar entra, la segunda ve el mensaje de cupo completo.
- ¿Qué pasa si el organizador cierra las inscripciones del torneo? → Todos los links activos dejan de funcionar automáticamente.
- ¿Qué pasa si el entrenador abre el link una vez que ya llegó al límite? → Ve la lista de atletas que inscribió y el mensaje de cupo completo, pero no puede agregar más.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE generar un link único por club que no pueda ser adivinado o construido manualmente.
- **FR-002**: El link SOLO puede generarse cuando el torneo tiene al menos un tatami, una categoría y un club creados.
- **FR-003**: El organizador DEBE poder ingresar el límite de atletas (número entero positivo) al generar el link.
- **FR-004**: El entrenador DEBE poder acceder al link sin crear cuenta ni iniciar sesión.
- **FR-005**: El sistema DEBE mostrar al entrenador: nombre del torneo, nombre del club, contador de atletas (actual / límite) y lista de categorías disponibles.
- **FR-006**: El sistema DEBE sugerir automáticamente la categoría compatible cuando el entrenador completa los datos del atleta (fecha de nacimiento, peso, género).
- **FR-007**: El entrenador DEBE poder aceptar la sugerencia o elegir cualquier otra categoría disponible.
- **FR-008**: Al presionar "Agregar atleta", el atleta DEBE aparecer en la lista de la misma página y el formulario DEBE limpiarse para el siguiente.
- **FR-009**: Al llegar al límite de atletas, el formulario DEBE bloquearse con un mensaje claro.
- **FR-010**: El organizador DEBE poder copiar el link al portapapeles con un solo click.
- **FR-011**: El organizador DEBE ver el contador de atletas inscritos por club actualizarse en tiempo real sin recargar la página.
- **FR-012**: El organizador DEBE poder desactivar un link con confirmación previa.
- **FR-013**: Un link desactivado DEBE mostrar un mensaje claro al entrenador que intente abrirlo.
- **FR-014**: Cuando el organizador cierra las inscripciones del torneo, TODOS los links activos deben dejar de funcionar.
- **FR-015**: Si se genera un nuevo link para un club que ya tenía uno activo, el anterior DEBE quedar inválido automáticamente.

### Key Entities

- **Link de inscripción**: Identificador único generado por el sistema, asociado a un club y un torneo. Atributos: token único, club, torneo, límite de atletas, atletas inscritos hasta ahora, estado (activo / inactivo), fecha de creación.
- **Club**: Nombre del club participante, creado por el organizador antes de generar el link.
- **Atleta inscrito por link**: Datos del competidor ingresados por el entrenador: nombre, apellido, fecha de nacimiento, peso, género, categoría asignada. Asociado al link y al torneo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El entrenador puede inscribir un atleta en menos de 60 segundos desde que abre el link.
- **SC-002**: El sistema sugiere la categoría correcta en el 95% de los casos donde el atleta cumple exactamente los rangos.
- **SC-003**: El contador de atletas en el panel del organizador se actualiza en menos de 3 segundos tras una inscripción.
- **SC-004**: El organizador puede generar, copiar y enviar un link en menos de 30 segundos.
- **SC-005**: El formulario de inscripción funciona correctamente en celulares (el entrenador probablemente lo use desde su teléfono).

---

## Assumptions

- El organizador ya creó los clubs en el sistema antes de generar los links (flujo existente en la app).
- El pago entre organizador y entrenador ocurre completamente por fuera de la app — la app no valida ni registra pagos.
- El link se comparte principalmente por WhatsApp — debe ser una URL corta y copiable con un click.
- El entrenador usa el link desde su celular en la mayoría de los casos, por lo que la pantalla del entrenador debe funcionar bien en móvil.
- Un mismo club no puede tener dos links activos simultáneamente — el nuevo reemplaza al anterior.
- Los atletas inscritos por link quedan en el mismo sistema que los inscritos manualmente por el organizador.
- El sistema de sugerencia de categoría usa las mismas reglas que el resto de la app (edad calculada desde fecha de nacimiento, rango de peso, género).
