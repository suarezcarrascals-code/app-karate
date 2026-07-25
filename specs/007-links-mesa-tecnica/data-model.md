# Data Model: Links de Acceso para Mesa Técnica

## Tabla existente: `link_mesa_tecnica`

Creada en feature 006. Verificar que existe antes de implementar (ver research.md).

```sql
link_mesa_tecnica
├── id          uuid PK
├── token       uuid UNIQUE NOT NULL DEFAULT gen_random_uuid()
├── torneo_id   uuid FK → torneo(id) ON DELETE CASCADE
├── tatami_id   uuid FK → tatami(id) ON DELETE CASCADE
├── estado      text CHECK ('activo' | 'inactivo') DEFAULT 'activo'
└── created_at  timestamptz DEFAULT now()
```

### Invariantes

- Un tatami puede tener 0 o 1 links activos a la vez.
- Al generar un nuevo link para un tatami, todos los links activos anteriores de ese tatami quedan `inactivo`.
- El token es opaco (UUID v4 generado por Supabase) — no contiene información del torneo ni del tatami.

### Estado del link vs estado del torneo

| estado link | estado torneo | ¿Funciona? |
|-------------|---------------|------------|
| activo      | en_curso      | ✅ Sí       |
| activo      | inscripciones | ⏳ Espera  |
| activo      | borrador      | ⏳ Espera  |
| activo      | finalizado    | ❌ No       |
| inactivo    | cualquiera    | ❌ No       |

### Relaciones con entidades existentes

```
torneo (1) ──< link_mesa_tecnica (N)
tatami (1) ──< link_mesa_tecnica (N)
```

Un torneo puede tener múltiples links (uno por tatami, más los inactivos históricos).
Un tatami puede tener múltiples links en el tiempo (solo 1 activo simultáneamente).

---

## No se crean tablas nuevas

Este feature no requiere nuevas tablas. Usa:
- `link_mesa_tecnica` (existente)
- `tatami` (existente — join para mostrar nombre)
- `torneo` (existente — join para verificar estado)
- `categoria` (existente — para mostrar categorías del tatami en MarcadorPublico)
- `combate` (existente — para mostrar combates activos por categoría)
