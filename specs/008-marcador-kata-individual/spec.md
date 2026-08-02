# Feature Specification: Marcador Kata Individual para Mesa Técnica

**Feature Branch**: `008-marcador-kata-individual`

**Created**: 2026-07-23

**Status**: Draft

**Input**: Marcador kata individual para mesa técnica

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Operar un bout de kata individual: ingresar puntajes y declarar ganador (Priority: P1)

La mesa técnica abre el panel de kata para un bout. Cuando AKA termina su kata, ingresa los puntajes de los 5 jueces. Cuando AO termina, hace lo mismo. El sistema calcula automáticamente qué juez vota por quién y declara al ganador por mayoría de votos.

**Why this priority**: Es la funcionalidad core — sin ella no se puede operar ningún bout de kata individual.

**Independent Test**: Abrir `/mesa/:token/categoria/:catId/combate/:combateId/kata` → ingresar puntajes J1–J5 para AKA (ej: 7.5, 7.8, 7.6, 7.4, 7.7) → confirmar → ingresar puntajes J1–J5 para AO (ej: 7.3, 7.9, 7.5, 7.6, 7.5) → confirmar → verificar que el sistema calcula votos por juez y declara ganador.

**Acceptance Scenarios**:

1. **Given** un combate de modalidad `kata_individual` en estado `pendiente`, **When** la mesa técnica entra al panel `/kata`, **Then** ve la interfaz de kata con AO a la izquierda y AKA a la derecha, con campos J1–J5 para cada lado.
2. **Given** la mesa ingresó los 5 puntajes de AKA (todos en 5.0–10.0), **When** presiona "Confirmar AKA", **Then** los puntajes quedan bloqueados y el sistema habilita la entrada para AO.
3. **Given** ambos lados tienen sus 5 puntajes confirmados y no hay empates por juez, **When** el sistema calcula, **Then** muestra los votos por juez (AKA o AO) y declara al ganador con ≥3 votos de 5.
4. **Given** el sistema declaró ganador, **When** la mesa presiona "Finalizar bout", **Then** el combate queda `estado=finalizado`, `ganador_id` guardado en Supabase, y el bracket avanza al ganador.
5. **Given** un juez tiene el mismo puntaje para AKA y AO, **When** la mesa intenta confirmar, **Then** aparece un error indicando que no puede haber empate por juez — debe corregir ese puntaje antes de continuar.

---

### User Story 2 — Anuncio de kata con cronómetro de 35 segundos (Priority: P2)

Antes de la performance, cada competidor tiene 35 segundos para anunciar el kata que va a ejecutar. La mesa registra el nombre del kata para controlar las reglas de repetición.

**Why this priority**: Requerimiento WKF — el kata debe anunciarse antes de ejecutarse. La validación de repetición protege al organizador de errores.

**Independent Test**: En el panel → clic en "Anuncio AKA" → el cronómetro de 35s inicia → la mesa ingresa el nombre del kata y confirma → el sistema verifica que no viola reglas de repetición → clic en "Anuncio AO" → mismo flujo.

**Acceptance Scenarios**:

1. **Given** el bout inicia, **When** la mesa presiona "Iniciar anuncio AKA", **Then** arranca un cronómetro regresivo de 35 segundos con señal visual.
2. **Given** la mesa confirma el kata de AKA, **When** el kata ya fue usado por este competidor en el bout inmediatamente anterior, **Then** aparece una advertencia: "Bassai Dai ya fue usado en el bout anterior. El competidor no puede repetirlo seguido."
3. **Given** la mesa confirma el kata de AKA, **When** el kata ya fue usado 2 veces por este competidor en el torneo, **Then** aparece una advertencia: "Bassai Dai ya fue usado 2 veces en este torneo (máximo permitido)."
4. **Given** el kata es válido (sin violaciones), **When** se confirma, **Then** el campo queda guardado y la mesa puede pasar a la performance.
5. **Given** aparece una advertencia de repetición, **When** la mesa igualmente confirma, **Then** el sistema permite continuar (es advertencia, no bloqueo) — la decisión final es del árbitro.

---

### User Story 3 — KIKEN: competidor no se presenta (Priority: P3)

Si un competidor no se presenta al bout, la mesa registra KIKEN y el rival avanza automáticamente sin necesidad de ingresar puntajes.

**Why this priority**: Necesario para manejar ausencias sin bloquear el torneo. Poco frecuente pero imprescindible el día del evento.

**Independent Test**: En el panel de kata → presionar "KIKEN AKA" → confirmar en el modal → verificar que el combate queda finalizado con AO como ganador.

**Acceptance Scenarios**:

1. **Given** el bout está en cualquier fase previa a "resultado", **When** la mesa presiona "KIKEN AKA", **Then** aparece un modal de confirmación con el nombre del competidor.
2. **Given** la mesa confirma KIKEN, **When** el modal se cierra, **Then** el combate queda `estado=finalizado`, `ganador_id=competidor_azul_id`, y el bracket avanza.
3. **Given** el KIKEN se registró, **When** la mesa vuelve al bracket, **Then** el combate aparece como "Finalizado" con el rival marcado como ganador.

---

### User Story 4 — TV display para kata individual en proyector (Priority: P4)

Una segunda ventana muestra el estado del bout para el proyector del tatami: nombres de los competidores, kata anunciado, puntajes por juez y ganador.

**Why this priority**: El público y los competidores presentes deben ver el resultado del bout.

**Independent Test**: Abrir `/mesa/:token/categoria/:catId/combate/:combateId/kata-tv` en ventana separada → confirmar puntajes AKA desde el panel → el TV muestra los scores dentro de 1 segundo.

**Acceptance Scenarios**:

1. **Given** el TV display está abierto y esperando, **When** la mesa confirma los puntajes de AKA, **Then** el TV muestra J1–J5 para AKA actualizados en menos de 1 segundo.
2. **Given** ambos lados están confirmados y el sistema declaró ganador, **When** el TV se actualiza, **Then** muestra los votos de cada juez (flecha o indicador) y resalta al ganador con su nombre visible desde lejos.
3. **Given** el bout no ha iniciado aún, **When** el TV está abierto, **Then** muestra los nombres de los competidores y la categoría, con estado "Esperando inicio".

---

### Edge Cases

- ¿Qué pasa si un juez asigna el mismo puntaje a AKA y AO? → La UI bloquea la confirmación hasta que se corrija ese juez.
- ¿Qué pasa si la conexión cae entre confirmar AKA y AO? → Los puntajes de AKA ya guardados en DB sobreviven al reload; la mesa retoma desde `azul_performance`.
- ¿Qué pasa si la mesa ingresa un puntaje fuera de rango? → El input restringe a 5.0–10.0 con step 0.1; el botón DQ es el único camino a 0.0.
- ¿Qué pasa si el bout ya fue finalizado y la mesa intenta editarlo? → El panel muestra el resultado en modo solo lectura.
- ¿Qué pasa si la categoría no es `kata_individual`? → Esta ruta solo debe ser accesible para categorías kata; si una categoría kumite navega aquí, se muestra error de modalidad incorrecta.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir ingresar puntajes de 5 jueces (J1–J5) para AKA y AO, en el rango 5.0–10.0 con step 0.1, o 0.0 para descalificación.
- **FR-002**: El sistema DEBE calcular el voto de cada juez (quien obtuvo mayor puntaje de ese juez) usando `calcularVotosJuez` de `scoring.js`.
- **FR-003**: El sistema DEBE declarar ganador al competidor con mayoría de votos (≥3 de 5) usando `determinarGanadorKataBout` de `scoring.js`.
- **FR-004**: El sistema DEBE bloquear la confirmación si algún juez tiene igual puntaje para AKA y AO.
- **FR-005**: El sistema DEBE guardar los puntajes por juez en Supabase (`j1_rojo`–`j5_rojo`, `j1_azul`–`j5_azul`) para recuperación tras un reload.
- **FR-006**: El sistema DEBE incluir un cronómetro de 35 segundos para el anuncio de kata, con señal visual en los últimos 10 segundos.
- **FR-007**: El sistema DEBE guardar el kata anunciado por cada competidor (`kata_anunciado_rojo`, `kata_anunciado_azul`).
- **FR-008**: El sistema DEBE usar `validarKataPermitido` de `scoring.js` para detectar repeticiones y mostrar advertencia (no bloqueo).
- **FR-009**: El sistema DEBE permitir registrar KIKEN para cualquier competidor, finalizando el bout a favor del rival.
- **FR-010**: La pantalla TV (`/kata-tv`) DEBE hacer polling cada 500ms a Supabase y reflejar el estado actual del bout.
- **FR-011**: El sistema DEBE confirmar puntajes de un lado por vez — una vez confirmados, no se pueden cambiar.

### Key Entities

- **combate** (extensión): Entidad existente en Supabase. Se agregan columnas kata: `kata_anunciado_rojo`, `kata_anunciado_azul`, `j1_rojo`–`j5_rojo`, `j1_azul`–`j5_azul`.
- **historial_katas**: No es una tabla nueva — se deriva consultando los `combate` anteriores de un `competidor_id` en el `torneo_id` para extraer `kata_anunciado_rojo` o `kata_anunciado_azul` según el lado en que compitió.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La mesa puede completar el ingreso de los 10 puntajes (5×AKA + 5×AO) y finalizar el bout en menos de 60 segundos tras las performances.
- **SC-002**: El sistema calcula votos y muestra el ganador en menos de 500ms tras confirmar el último puntaje.
- **SC-003**: La pantalla TV muestra el cambio en menos de 1 segundo (polling 500ms).
- **SC-004**: 100% de las violaciones de kata repetido (consecutivo o 2 veces en torneo) generan advertencia visible antes de confirmar.
- **SC-005**: Un operador sin experiencia previa puede completar un bout de kata leyendo solo la interfaz, sin manual.

---

## Assumptions

- Los torneos locales de Santander usan exactamente 5 jueces para kata individual. No se soportarán formatos de 3 o 7 jueces en v1.
- El orden de performance es siempre AKA primero, AO segundo.
- Los puntajes son confirmados en panel (la mesa ingresa los 5 puntajes de los 5 jueces a la vez), no en tiempo real por cada juez en su propio dispositivo.
- Los katas se ingresan como texto libre — no hay lista desplegable de katas WKF en v1.
- La advertencia de kata repetido consulta solo los combates del mismo torneo.
- La modalidad del combate se determina por `categoria.modalidad` — la página kata solo funciona con `kata_individual`.
- Los datos de historial de katas usados en bouts anteriores se consultan al cargar la página, no en tiempo real.
