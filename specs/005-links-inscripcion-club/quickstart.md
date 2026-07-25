# Quickstart: Links de Inscripción por Club

## Prerequisites

1. Supabase corriendo con las migraciones aplicadas (ver `data-model.md`)
2. `npm run dev` corriendo en localhost
3. Un torneo creado con al menos 1 tatami, 1 categoría y 1 club (dojo)

## Escenario 1 — Organizador genera y comparte link

1. Ir a `/torneo/:id/inscripciones`
2. Verificar que aparece la lista de clubs (dojos) del torneo
3. Para un club sin link: verificar que el botón "Generar link" está disponible
4. Ingresar límite de atletas (ej: 5) y hacer click en "Generar link"
5. Verificar que aparece el botón "Copiar link" y el estado cambia a "Link activo · 0/5"
6. Hacer click en "Copiar link" → verificar que el portapapeles tiene la URL

**Resultado esperado**: URL del tipo `http://localhost:5173/inscripcion/<uuid>`

---

## Escenario 2 — Entrenador inscribe atletas por link

1. Abrir la URL copiada en un navegador (modo incógnito para simular sin login)
2. Verificar que se muestra: nombre del torneo, nombre del club, contador "0 de 5"
3. Verificar que se muestra la lista de categorías del torneo
4. Llenar el formulario con datos de un atleta (nombre, apellido, fecha de nacimiento, peso, género)
5. Verificar que el sistema resalta la categoría sugerida según los datos
6. Hacer click en "Agregar atleta"
7. Verificar que el atleta aparece en la lista y el contador sube a "1 de 5"
8. El formulario debe quedar limpio y listo para el siguiente atleta
9. Repetir hasta 5 atletas → verificar que al llegar a 5 el formulario desaparece con mensaje "Cupo completo"

---

## Escenario 3 — Contador en tiempo real (organizador)

1. Tener el panel del organizador abierto en una ventana (`/torneo/:id/inscripciones`)
2. En otra ventana (incógnito), abrir el link del entrenador e inscribir un atleta
3. Verificar que el contador en el panel del organizador sube **sin recargar la página**

---

## Escenario 4 — Prerequisito no cumplido

1. Crear un torneo sin categorías
2. Ir a `/torneo/:id/inscripciones`
3. Verificar que el botón "Generar link" está deshabilitado
4. Verificar que aparece un mensaje indicando qué falta (ej: "Necesitás crear al menos una categoría")

---

## Escenario 5 — Desactivar link

1. Generar un link para un club
2. Abrirlo en modo incógnito y confirmar que funciona
3. Desde el panel del organizador, hacer click en "Desactivar" → confirmar en el modal
4. Recargar la página del entrenador
5. Verificar que aparece el mensaje "Este link ya no está disponible. Contactá al organizador."

---

## Escenario 6 — Sugerencia de categoría

| Atleta | Datos | Categoría esperada sugerida |
|--------|-------|-----------------------------|
| Masculino, 14 años, 52 kg | género=masculino, nacimiento=~2012, peso=52 | Cadet Masculino -52 kg |
| Femenino, 17 años, 48 kg | género=femenino, nacimiento=~2009, peso=48 | Junior Femenino -48 kg |
| Masculino, 25 años, 80 kg | género=masculino, nacimiento=~2001, peso=80 | Senior Masculino -84 kg |
| Sin categoría compatible | datos fuera de todos los rangos | sin resaltar — entrenador elige manualmente |

---

## Comandos

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run test     # Correr tests (links.test.js debe pasar)
```
