# Quickstart: Links de Acceso para Mesa Técnica

## Prerequisites

- Torneo creado con al menos 1 tatami
- `npm run dev` corriendo en localhost:5173
- Tabla `link_mesa_tecnica` existe en Supabase (verificar con SQL en research.md)

---

## Escenario 1: Organizador genera y copia un link

1. Iniciar sesión como organizador aprobado
2. Entrar a un torneo → sección "Inscripciones"
3. Ver tab o sección "Mesa técnica"
4. Para cada tatami, debe aparecer estado "Sin generar"
5. Presionar "Generar link" en Tatami A
6. El link aparece con estado "Activo" y botón "Copiar"
7. Presionar "Copiar" → confirmación visual (ej: "Copiado!")
8. Pegar en el navegador → debe cargar `MarcadorPublico`

**Resultado esperado**: El link copiado al portapapeles tiene formato `http://localhost:5173/marcador/[UUID]`

---

## Escenario 2: Mesa técnica accede sin login

1. Abrir el link copiado en el escenario anterior en una ventana incógnito (sin sesión)
2. **Si el torneo está en `borrador` o `inscripciones`**: debe ver pantalla de espera con nombre del torneo y tatami
3. Cambiar el torneo a estado `en_curso` en Supabase: `UPDATE torneo SET estado = 'en_curso' WHERE id = '[id]';`
4. Refrescar la página del link
5. Debe ver el panel con las categorías del tatami

**Resultado esperado**: Sin crear cuenta ni login, se ve el contenido del tatami

---

## Escenario 3: Regenerar link cuando falla

1. Tener el link abierto en una pestaña (mesa técnica)
2. Desde el panel del organizador, presionar "Regenerar" en ese tatami
3. Confirmar la acción
4. Aparece un nuevo link — el anterior queda como "Inactivo"
5. Refrescar la pestaña del link viejo
6. **Resultado esperado**: Pantalla de error "Este link ya no es válido. Pedile al organizador el link actualizado."
7. Abrir el nuevo link → accede sin problemas

---

## Escenario 4: Link inválido

1. Abrir `http://localhost:5173/marcador/00000000-0000-0000-0000-000000000000`
2. **Resultado esperado**: Pantalla de error clara con instrucciones, no pantalla en blanco

---

## Escenario 5: Torneo finalizado

1. Tener el link abierto y funcionando
2. Cambiar el torneo a `finalizado`: `UPDATE torneo SET estado = 'finalizado' WHERE id = '[id]';`
3. Refrescar el link
4. **Resultado esperado**: Pantalla "El torneo ha finalizado"
