# Research: Links de Acceso para Mesa Técnica

## Decisión 1: Patrón para link_mesa_tecnica

**Decision**: Reutilizar exactamente el mismo patrón de `src/lib/links.js` (`link_inscripcion`).
- `generarLink` desactiva el link anterior antes de insertar el nuevo
- `fetchLinkByToken` retorna `null` si no existe o está inactivo (no lanza error)
- Token UUID generado por Supabase con `gen_random_uuid()`

**Rationale**: El patrón ya existe, funciona en producción y el equipo lo conoce. No hay razón para hacer algo diferente.

**Alternatives considered**: Token con expiración por tiempo → rechazado porque el spec dice que el link no expira por tiempo, solo por regeneración o por finalización del torneo.

---

## Decisión 2: Dónde vive el panel de links de mesa técnica

**Decision**: Sección nueva dentro de `InscripcionesPage.jsx` — un tab o sección separada "Mesa técnica" debajo de los links de club.

**Rationale**: `InscripcionesPage` ya es la página de gestión de links del torneo. Agregar mesa técnica ahí mantiene coherencia. El organizador va a un solo lugar para manejar todos los links.

**Alternatives considered**:
- Panel en TorneoDashboard → rechazado, ya está cargado de info.
- Panel en la página de tatamis → posible, pero los links de inscripción ya están en InscripcionesPage; mezclarlos en tatamis sería inconsistente.

---

## Decisión 3: ¿Qué ve la mesa técnica al abrir el link?

**Decision**: `MarcadorPublico.jsx` muestra primero un selector de categoría del tatami. Al elegir una categoría, muestra los combates de esa categoría. Al elegir un combate, renderiza el panel de puntuación inline (sin redirigir a rutas protegidas).

**Rationale**: Las páginas `KumiteMarcador` y `KataMarcador` existentes están acopladas a `useParams` con `torneoId` y `combateId`, y tienen navegación de vuelta al torneo que requiere sesión. Renderizarlas directamente desde la ruta pública requeriría refactorizar o duplicar. El approach inline es más limpio para el MVP.

**Alternatives considered**:
- Redirigir a `/torneo/:id/marcador/:combateId` con token en query param → rechazado, rompe el modelo de auth existente.
- Extraer lógica de marcador a hooks reutilizables → correcto a largo plazo pero fuera de scope del MVP.

---

## Decisión 4: Verificación de torneo en_curso para el token

**Decision**: La verificación se hace en el cliente al cargar MarcadorPublico — se consulta el torneo y si no está `en_curso`, se muestra pantalla de espera o finalizado según el estado. NO se hace en una RLS con join al torneo (eso fue fuente de bugs en features anteriores).

**Rationale**: Las RLS con joins a otras tablas causaron infinite recursion en feature 006. La verificación en el cliente es más segura y transparente.

**Alternatives considered**: RLS que valide `torneo.estado = 'en_curso'` → rechazado por riesgo de recursión y por complejidad innecesaria.

---

## Decisión 5: La tabla link_mesa_tecnica ya existe

**Decision**: La tabla `link_mesa_tecnica` fue creada en el SQL del feature 006 (T004). El plan no crea la tabla desde cero — solo verifica que existe y ajusta RLS si hace falta.

**SQL de verificación previo a implementar**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'link_mesa_tecnica';
```

Si no existe (posible que el usuario no corrió ese bloque):
```sql
CREATE TABLE link_mesa_tecnica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  torneo_id uuid NOT NULL REFERENCES torneo(id) ON DELETE CASCADE,
  tatami_id uuid NOT NULL REFERENCES tatami(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE link_mesa_tecnica ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON link_mesa_tecnica TO authenticated;
GRANT SELECT ON link_mesa_tecnica TO anon;
CREATE POLICY "org lee sus links mesa tecnica" ON link_mesa_tecnica
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM torneo WHERE torneo.id = link_mesa_tecnica.torneo_id AND torneo.creado_por = auth.uid())
  );
CREATE POLICY "org inserta links mesa tecnica" ON link_mesa_tecnica
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM torneo WHERE torneo.id = torneo_id AND torneo.creado_por = auth.uid())
  );
CREATE POLICY "org actualiza links mesa tecnica" ON link_mesa_tecnica
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM torneo WHERE torneo.id = link_mesa_tecnica.torneo_id AND torneo.creado_por = auth.uid())
  );
CREATE POLICY "anon lee link activo" ON link_mesa_tecnica
  FOR SELECT TO anon USING (estado = 'activo');
```
