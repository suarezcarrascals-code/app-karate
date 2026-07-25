# Quickstart: Inscripción de Competidores

## Prerequisitos

- Torneo creado con al menos 1 tatami y 1 categoría en estado "abierta"
- Migraciones SQL ejecutadas (`competidor` y opcionalmente `equipo`)
- `npm run dev` corriendo

---

## Escenario 1 — Inscribir competidor dentro de rango (US1)

1. Ir a `/torneo/:id/categorias`
2. Hacer click en "Ver competidores" en cualquier categoría con estado "abierta"
3. Hacer click en "+ Inscribir competidor"
4. Completar: nombre "Juan", apellido "García", club "Dojo Central", fecha nacimiento dentro del rango de edad de la categoría, peso dentro del rango
5. Click "Guardar"

**Resultado esperado**: El competidor aparece en la lista con estado "inscrito". Sin badge de inscripción manual.

---

## Escenario 2 — Inscripción fuera de rango con confirmación (US2)

1. Mismo flujo que Escenario 1 pero con fecha de nacimiento que da una edad fuera del rango de la categoría
2. Click "Guardar"

**Resultado esperado**: Aparece modal de advertencia con el motivo específico ("Edad X mayor al máximo (Y)"). Los datos del formulario se conservan.

3. Click "Confirmar de todas formas"

**Resultado esperado**: El competidor se guarda con badge visual "Inscripción manual".

4. Repetir paso 2 y hacer click "Cancelar"

**Resultado esperado**: El modal se cierra, el formulario sigue con los datos, no se guarda nada.

---

## Escenario 3 — Eliminar competidor (US3)

1. En la lista de competidores, hacer click "Eliminar" en cualquier competidor
2. Confirmar en el modal

**Resultado esperado**: El competidor desaparece de la lista.

---

## Escenario 4 — Categoría bloqueada (US1 edge case)

1. Intentar navegar a competidores de una categoría en estado "cerrada" o "en_curso"

**Resultado esperado**: El botón "+ Inscribir" no aparece o está deshabilitado. La lista es de solo lectura.

---

## Escenario 5 — Crear equipo (US4 — P3, solo modalidades de equipo)

1. Ir a competidores de una categoría con modalidad `kata_equipo` o `kumite_equipo`
2. Con al menos 3 competidores inscritos, hacer click "Crear equipo"
3. Ingresar nombre del equipo, seleccionar 3 miembros del selector
4. Click "Guardar equipo"

**Resultado esperado**: El equipo aparece en la sección "Equipos" con sus 3 miembros.

---

## Tests automáticos

```bash
npm run test
# Debe pasar: src/lib/competidores.test.js (calcularEdad, fetchCompetidores, insertCompetidor, deleteCompetidor)
```
