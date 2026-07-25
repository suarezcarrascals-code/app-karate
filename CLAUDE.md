# CLAUDE.md — App Competencia de Karate

## Contexto del proyecto

Aplicación web para gestión de competencias de karate. El organizador crea un torneo, dentro del torneo crea los tatamis, y dentro de cada tatami asigna categorías con su modalidad. Cada modalidad tiene su propia lógica de llaves, marcador y puntuación.

---

## Stack técnico

- **Frontend**: React (Vite) — mobile-first para vistas públicas y de competidores; desktop para marcador y gestión
- **Base de datos**: Supabase (PostgreSQL + Realtime)
- **Auth**: Supabase Auth
- **Estilos**: Tailwind CSS
- **PDF / diplomas**: generación en cliente (a definir)
- **Despliegue**: (a definir — Railway / Vercel)

---

## Jerarquía central del sistema

```
Torneo
└── Tatami (1..N)
    └── Categoria (1..N por tatami)
        └── Modalidad:
            ├── Kata individual
            ├── Kata equipo
            ├── Kumite individual
            └── Kumite equipo
```

Esta jerarquía es la columna vertebral de toda la app. Cada pantalla, ruta y consulta a Supabase parte de ella. No se puede asignar una categoría sin un tatami, ni un tatami sin un torneo.

---

## Flujo de creación (onboarding del organizador)

```
1. Crear torneo          →  nombre, fecha, lugar, logo, estado
2. Crear tatamis         →  nombre del tatami (ej: "Tatami A"), árbitro asignado
3. Crear categorías      →  dentro del tatami: nombre, modalidad, género, rango de edad/peso
4. Crear clubs           →  nombre del club / dojo participante
5. Generar links de inscripción por club  →  ver sección "Modelo de inscripciones"
6. Cerrar inscripciones  →  se genera el bracket / tabla de evaluación automáticamente
7. Iniciar competencia   →  la mesa técnica opera el marcador desde un computador; el árbitro da las señales en el tatami
```

El flujo es lineal y guiado. No se puede avanzar al paso siguiente sin completar el anterior (validación por estado).

---

## Modelo de inscripciones

### Contexto

La app se arrienda para torneos en Santander, Colombia. El organizador cobra la inscripción por fuera de la app (efectivo, Nequi, transferencia). La app no procesa pagos — solo controla el acceso al registro.

### Flujo completo

```
Organizador acuerda con el entrenador: club, número de atletas, pago
         ↓
Organizador confirma el pago por fuera de la app
         ↓
Organizador genera un link único para ese club, con límite de atletas
         ↓
Organizador envía el link por WhatsApp al entrenador
         ↓
Entrenador abre el link (sin crear cuenta), ve las categorías disponibles
         ↓
Entrenador inscribe sus atletas uno por uno hasta el límite acordado
         ↓
Al llegar al límite, el formulario se bloquea automáticamente
```

### Reglas del link de inscripción

- **Un link por club** — no un link general del torneo
- El link incluye el nombre del club y el límite de atletas (ej: "Club Shotokan — máx. 12 atletas")
- El link solo se puede generar cuando el torneo ya tiene creados: tatamis, categorías y clubs
- El link expira cuando el organizador cierra las inscripciones del torneo
- El entrenador no necesita crear cuenta ni contraseña — el link es el acceso
- El link puede desactivarse manualmente si el entrenador lo comparte sin autorización

### Pantalla del entrenador (vista pública por link)

**Header:** nombre del torneo + nombre del club. Contador "X de N atletas registrados".

**Sección de categorías:** lista de todas las categorías disponibles del torneo (nombre, modalidad, género, rango de edad/peso) para que el entrenador sepa qué hay antes de ingresar atletas.

**Lista de atletas inscritos:** se va construyendo de arriba hacia abajo a medida que el entrenador agrega atletas. Cada fila muestra nombre completo y categoría asignada.

**Formulario de inscripción (un atleta a la vez):**
- Campos: nombre, apellido, fecha de nacimiento, peso, género
- Al llenar los datos, el sistema resalta automáticamente la categoría sugerida
- El entrenador confirma la sugerencia o elige otra categoría de la lista
- Botón "Agregar atleta" → el atleta aparece en la lista, el formulario se limpia y queda listo para el siguiente
- Al llegar al límite de atletas acordado, el botón desaparece y aparece mensaje de cierre

### Pantalla del organizador — gestión de links

- Lista de clubs del torneo
- Por cada club: botón "Generar link", campo para ingresar el límite de atletas, estado (activo / cerrado / no generado)
- Botón para copiar el link al portapapeles (para pegar en WhatsApp)
- Botón para desactivar el link de un club
- Contador de atletas inscritos por club en tiempo real

---

## Estructura de módulos

```
src/
  pages/
    torneos/             # Lista y creación de torneos
    torneo/[id]/
      index              # Dashboard del torneo
      tatamis/           # Gestión de tatamis
      tatami/[id]/
        index            # Vista del tatami (categorías asignadas)
        categoria/[id]/  # Bracket o tabla kata según modalidad
        marcador/[id]/   # UI de marcador para la mesa técnica (desktop)
      inscripciones/     # Registro de competidores
      resultados/        # Podio general y exportación
      publico/           # Vista pública (sin login)

  modules/
    torneo/              # CRUD torneo
    tatami/              # CRUD tatamis + asignación de árbitros
    categoria/           # CRUD categorías + modalidad
    brackets/            # Generación de llaves por modalidad
    marcador/            # Lógica de marcador (4 variantes)
    resultados/          # Cálculo de posiciones, podio, PDF

  components/            # UI compartida
  lib/
    supabase.js
    brackets.js          # Algoritmos de bracket (eliminación directa, round-robin, kata ranking)
    scoring.js           # Reglas de puntuación por modalidad — TODA la aritmética aquí
```

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| `organizador` | Acceso total al torneo que creó |
| `mesa_tecnica` | Opera el marcador del tatami asignado (acceso por link temporal) |
| `entrenador` | Inscribir competidores de su club (acceso por link con límite) |
| `publico` | Solo lectura — resultados y brackets |

Roles manejados con Supabase RLS (Row Level Security).

---

## Autenticación y acceso

### Modelo actual (v1)

**Organizador:**
- Registro libre con email + contraseña
- Al registrarse, la cuenta queda en estado `pendiente`
- El admin (sansuca.ia@gmail.com) recibe email de notificación y aprueba manualmente
- El organizador recibe email de confirmación y puede entrar
- Cada organizador solo ve y gestiona sus propios torneos — aislamiento total por RLS

**Mesa técnica:**
- Sin cuenta propia — acceso por link temporal generado por el organizador
- Un link por tatami, generado el día del evento
- El link solo funciona mientras el torneo está en estado `en_curso`
- Al cerrar el torneo, todos los links de mesa técnica expiran automáticamente
- No hay reutilización posible entre torneos: cada torneo requiere links nuevos

**Entrenador:**
- Sin cuenta — acceso por link único por club con límite de atletas
- Ver sección "Modelo de inscripciones"

**Público:**
- Sin login — acceso directo a rutas públicas

### Rutas protegidas vs públicas

```
Requieren login + cuenta aprobada:
  /torneo/*          → solo el organizador que creó ese torneo
  /torneos/nuevo     → cualquier organizador aprobado

Sin login (públicas):
  /inscripcion/:token           → entrenador por link
  /torneo/:id/marcador/:id/tv   → display TV del marcador
  /torneo/:id/publico           → vista pública de resultados
```

### ⏳ Pendiente — Login por pago (v2)

El modelo de aprobación manual será reemplazado por un flujo de pago automático:
- El organizador paga (MercadoPago u otro) para activar su cuenta
- La aprobación se hace automáticamente al confirmar el pago
- Sin intervención manual del admin para cada registro
- Definir: ¿pago por torneo o suscripción mensual?

---

## Modelos de datos

### `torneo`
```sql
id, nombre, fecha_inicio, fecha_fin, lugar, logo_url,
estado (borrador | inscripciones | en_curso | finalizado),
creado_por (user_id)
```

### `tatami`
```sql
id, torneo_id, nombre, orden, arbitro_id (user_id, nullable)
```

### `categoria`
```sql
id, tatami_id, torneo_id,
nombre,
modalidad (kata_individual | kata_equipo | kumite_individual | kumite_equipo),
genero (masculino | femenino | mixto),
edad_min, edad_max,
peso_min, peso_max,       -- solo relevante para kumite
cinturon_min, cinturon_max,
estado (abierta | cerrada | en_curso | finalizada)
```

### `competidor`
```sql
id, torneo_id, categoria_id,
nombre, apellido, club, pais,
fecha_nacimiento, peso, cinturon,
estado (inscrito | confirmado | descalificado)
```

### `equipo` (para modalidades de equipo)
```sql
id, categoria_id, nombre, club,
miembro_1_id, miembro_2_id, miembro_3_id   -- competidor_id
```

### `combate` (kumite individual y equipo)
```sql
id, categoria_id, tatami_id, ronda, orden_en_ronda,
-- kumite individual:
competidor_rojo_id, competidor_azul_id,
-- kumite equipo:
equipo_rojo_id, equipo_azul_id,
puntos_rojo, puntos_azul,
penalizaciones_rojo, penalizaciones_azul,
ganador_id,
estado (pendiente | en_curso | finalizado | bye),
hora_inicio, duracion_seg
```

### `evaluacion_kata` (kata individual y equipo)
```sql
id, categoria_id, tatami_id, ronda,
-- kata individual:
competidor_id,
-- kata equipo:
equipo_id,
juez_1, juez_2, juez_3, juez_4, juez_5,   -- decimal(4,1)
puntaje_final,                              -- calculado en scoring.js, nunca en DB trigger
posicion_final
```

---

## Las 4 modalidades — diferencias clave (reglamento WKF 2026)

### Kata individual

**Formato de competencia** (WKF Art. 3.3):
- Eliminación con repechage (default) — dos pools, el perdedor ante cada finalista forma nuevos pools para los bronces
- Round-robin en grupos seguido de eliminación (Premier League / Mundiales)
- El organizador configura cuál aplica al crear la categoría

**Sistema de puntuación** (WKF Art. 5.4):
- Escala de 5.0 a 10.0 en incrementos de 0.1
- 5.0 = mínimo aceptable, 10.0 = perfecto, 0.0 = descalificado
- Guía de referencia: 9-10 Excelente, 8-8.9 Muy bueno, 7-7.9 Bueno, 6-6.9 Aceptable, 5-5.9 Insuficiente

**Cómo se decide el ganador del bout** (WKF Art. 5.5, 5.10):
- Cada juez vota por el ganador según sus puntajes relativos
- Gana quien tenga la mayoría de votos de los jueces (no el puntaje más alto)
- En eliminación: mayoría de votos
- En Round-robin: cada bout ganado = 3 puntos de victoria; el perdedor = 0

**Desempate individual Round-robin** (WKF Art. 5.11, en orden de precedencia):
1. Más puntos de victoria acumulados
2. Ganador del bout directo entre los empatados
3. Mayor suma de votos de jueces en todos los bouts del grupo
4. Mayor ranking mundial WKF
5. Kata extra

**Kata permitidos** (WKF Art. 5.2):
- Solo kata de la lista oficial WKF (102 kata, ver Appendix 1 del reglamento)
- Máximo 5 kata distintos para completar una competencia
- No se puede repetir el mismo kata dos veces seguidas
- Ningún kata puede usarse más de 2 veces por competidor en todo el torneo

**Faltas** (WKF Art. 5.7 — reducen puntuación del juez):
- Anunciar el kata antes del bow, pérdida menor de equilibrio, movimiento incompleto
- Movimientos asíncronos, señales auditivas, teatralidad (pisar fuerte, golpearse el pecho)
- Kiai incorrecto, cinturón suelto, perder tiempo

**Descalificación** (WKF Art. 5.8):
- Anunciar kata incorrecto o realizar uno diferente al anunciado
- No hacer bow al inicio o al final
- No iniciar mirando a los jueces
- Pausa o stop claro durante la ejecución
- Omitir o agregar movimientos sustanciales
- Teatralidad persistente y obvia
- Paso correctivo por pérdida total de equilibrio o caída
- Cinturón que se cae completamente
- Superar 5 minutos (kata + bunkai en equipos)
- Kani Basami al cuello durante bunkai

---

### Kata equipo

**Composición** (WKF Art. 3.5):
- 3 o 4 atletas por equipo; siempre compiten exactamente 3 en cada ronda
- Si el equipo tiene 4, puede rotar quién no compite en cada ronda
- Equipo exclusivamente masculino o exclusivamente femenino

**Diferencias vs kata individual**:
- Los 3 miembros deben iniciar el kata mirando en la misma dirección hacia los jueces
- Se evalúa sincronización además de técnica individual
- En bouts de medalla: después del kata se ejecuta el Bunkai (demostración de aplicación)
- No hay bow entre kata y bunkai — son parte de la misma performance
- Tiempo total kata + bunkai: máximo 5 minutos (cronómetro inicia en el bow inicial, para en el bow final del bunkai)
- Bunkai: jugar inconsciente más de 2 segundos está prohibido; Kani Basami al cuello prohibido

**Desempate Round-robin equipos** (WKF Art. 5.12, en orden):
1. Más puntos de victoria
2. Ganador del match directo entre los empatados
3. Mayor suma de votos de jueces en todos los matches del grupo
4. Match extra — nueva kata

---

### Kumite individual

**Duraciones** (WKF Art. 5.1):
- Senior Masculino y Femenino (18+): **3 minutos** tiempo efectivo
- U21 Masculino y Femenino: **3 minutos**
- Cadet y Junior (14-17 años): **2 minutos**
- U14 (12-13 años): **1.5 minutos**
- Nota: para torneos sin límite de participación, se puede reducir (3→2 min, 2→1.5 min) si se anuncia antes

**Puntuación** (WKF Art. 8.6):
- **YUKO (1 punto)**: TSUKI (golpe directo) o UCHI (golpe) a zona de puntuación
- **WAZA-ARI (2 puntos)**: patadas CHUDAN (al cuerpo)
- **IPPON (3 puntos)**: patadas JODAN (a la cabeza) O cualquier técnica válida contra oponente con cualquier parte del cuerpo tocando el tatami (excepto rodilla en HIZA GAMAE)

**Zonas de puntuación** (WKF Art. 8.4):
- CHUDAN: cuerpo por encima de la pelvis hasta la clavícula (inclusive), excluyendo la unión del húmero con omóplatos y clavículas
- JODAN: zona por encima de la clavícula

**Victoria inmediata**: ventaja de 8 puntos o más en cualquier momento → el bout termina

**Criterios para decidir el ganador** (WKF Art. 12.2, en orden):
1. Atleta con más puntos al final del tiempo
2. SENSHU: primer punto no respondido (ventaja de primer marcador sin que el oponente también marque antes de la señal)
3. Mayor número de IPPON en el bout
4. Mayor número de WAZA-ARI en el bout
5. HANTEI: voto de los 4 jueces y el árbitro (solo en eliminación individual — en Round-robin se declara empate HIKIWAKE si no hay diferencia)

**Penalizaciones** (WKF Art. 10):
- **CHUI** (advertencia): hasta 3 veces, por infracciones menores que no reducen las chances del rival
- **HANSOKU CHUI** (advertencia de descalificación): infracciones más serias, o cuando ya hubo 3 CHUI
- **HANSOKU** (descalificación del bout): infracción muy seria, o tras HANSOKU CHUI previo → oponente gana
- **SHIKKAKU** (descalificación del torneo completo): desobedecer al árbitro, conducta maliciosa, daño al honor del karate

**ATO SHIBARAKU**: señal audible 15 segundos antes del final. Reglas especiales en este período (no se puede dar pasividad, evitar combate → mínimo HANSOKU CHUI).

**Desempate Round-robin individual** (WKF Art. 12.3, en orden):
1. Más puntos de victoria (3 por victoria, 1 por empate con puntos, 0 por derrota o empate sin puntos)
2. Ganador del bout directo entre empatados
3. Mayor total de puntos anotados en favor (todos los bouts)
4. Menor total de puntos en contra
5. Mayor número de IPPON a favor
6. Menor número de IPPON en contra
7. Mayor número de WAZA-ARI a favor
8. Menor número de WAZA-ARI en contra
9. Mayor ranking mundial WKF
10. Bout extra con HANTEI

---

### Kumite equipo

**Composición** (WKF Art. 3.5):
- **Masculino**: 5 bouts por match; equipo inicial de 5; en Round-robin pueden tener 2 back-ups obligatorios + 1 opcional (máx. 8); en eliminación mínimo 3 para competir
- **Femenino**: 3 bouts por match; equipo inicial de 3; en Round-robin 1 back-up obligatorio + 1 opcional (máx. 5); en eliminación mínimo 2
- **Mixto**: 4 bouts (2M + 2F) o 6 bouts (3M + 3F); géneros alternan; el género del primer bout se determina por sorteo

**Combate**: cada integrante pelea contra su par del equipo rival (posición a posición)

**Desempate match de equipos — eliminación** (WKF Art. 12.5):
1. Equipo con más bouts ganados (incluye victorias por SENSHU)
2. Si empate en bouts → equipo con más puntos totales
3. Si aún empate → bout extra (cualquier atleta del equipo, incluso quien ya peleó); si no hay ganador por puntos ni SENSHU → HANTEI

**Nota importante**: en eliminación, cuando el equipo ya tiene suficientes victorias para ganar matemáticamente, el match termina — no se juegan los bouts restantes (excepto en Round-robin donde todos los bouts deben completarse).

**Desempate Round-robin equipos** (WKF Art. 12.4, en orden):
1. Más puntos de victoria
2. Ganador del match directo
3. Mayor bouts ganados en todo el Round-robin
4. Mayor puntos totales anotados
5. Menor puntos en contra
6. Mayor IPPON a favor / menor en contra
7. Mayor WAZA-ARI a favor / menor en contra
8. Bout extra con HANTEI

**Si un miembro recibe HANSOKU o SHIKKAKU en equipo**: su puntaje va a 0, el oponente obtiene 8 puntos (contados como YUKO).

---

## Categorías oficiales WKF 2026

### Kumite — por edad y peso (WKF Appendix 3)

| Categoría | Edad | Pesos masculinos | Pesos femeninos |
|---|---|---|---|
| Senior | 18+ | -60, -67, -75, -84, +84 kg | -50, -55, -61, -68, +68 kg |
| U21 | 18-20 | -60, -67, -75, -84, +84 kg | -50, -55, -61, -68, +68 kg |
| Junior | 16-17 | -55, -61, -68, -76, +76 kg | -48, -53, -59, -66, +66 kg |
| Cadet | 14-15 | -52, -57, -63, -70, +70 kg | -47, -54, -61, +61 kg |
| U14 | 12-13 | -40, -45, -50, -55, +55 kg | -42, -47, -52, +52 kg |

*Kumite Senior: mínimo 18 años. Kata Senior: mínimo 16 años.*

### Kata — categorías oficiales (WKF Appendix 2)

- Kata Equipo Senior Masculino (16+)
- Kata Equipo Senior Femenino (16+)
- Kata Equipo Cadet/Junior Masculino (14-17)
- Kata Equipo Cadet/Junior Femenino (14-17)
- Kata Individual Senior Masculino (16+)
- Kata Individual Senior Femenino (16+)
- Kata Individual U21 Masculino (18-20)
- Kata Individual U21 Femenino (18-20)
- Kata Individual Junior Masculino (16-17)
- Kata Individual Junior Femenino (16-17)
- Kata Individual Cadet Masculino (14-15)
- Kata Individual Cadet Femenino (14-15)
- Kata Individual U14 Masculino (12-13)
- Kata Individual U14 Femenino (12-13)

*Estas categorías son las WKF oficiales. Torneos locales pueden crear categorías propias; la app debe soportar ambas.*

---

## Reglas de negocio críticas

### Brackets (WKF Art. 3 — ambas modalidades)

**Formatos soportados por la app:**
- Eliminación con repechage (default para ambas modalidades)
- Round-robin en grupos seguido de eliminación
- El organizador elige el formato al crear la categoría

**Asignación a grupos en Round-robin** (tabla oficial WKF — igual para Kumite y Kata):
```
32 competidores → 8 grupos de 4
24 competidores → 8 grupos de 3
18-23          → 6 grupos (3-4 por grupo)
12-16          → 4 grupos (3-4 por grupo)
 9-11          → 3 grupos (3-4 por grupo)
 6-8           → 2 grupos → directo a semifinales
 3-5           → 1 grupo → final entre 1° y 2°
```
Esta tabla debe estar implementada en `brackets.js` y cubrirse con tests.

**Reglas generales:**
- Brackets se generan al cerrar inscripciones — irreversible si ya hay combates jugados
- Byes automáticos cuando el número no es potencia de 2 (solo en eliminación directa)
- Un competidor solo puede inscribirse en una categoría por torneo

### Progresión de estados
```
torneo:    borrador → inscripciones → en_curso → finalizado
categoria: abierta  → cerrada       → en_curso → finalizada
```
Los estados solo avanzan, nunca retroceden.

### Integridad de datos
- Un competidor solo puede estar en una categoría por torneo
- En kata: un competidor no puede repetir el mismo kata dos veces seguidas ni usarlo más de 2 veces en el torneo — la app debe validar y advertir
- Un árbitro solo puede estar asignado a un tatami por torneo
- No se puede eliminar un tatami si tiene combates/evaluaciones en curso

---

## Consideraciones de UX prioritarias

### Marcador (mesa técnica) — pantalla más crítica

**Dispositivo**: laptop/PC con mouse. La mesa técnica opera sentada en la orilla del tatami.
**Dos ventanas**: la mesa abre el panel de control; un botón lanza `/tv` en ventana nueva para el proyector.

#### Panel de control — Kumite

- Botones grandes y bien separados — clickeo rápido sin error bajo presión
- Sin scroll — todo visible de un vistazo en la pantalla
- Atajos de teclado para las acciones más frecuentes

**Por cada atleta (AKA y AO):**
- YUKO +1 / WAZA-ARI +2 / IPPON +3
- Deshacer último punto (antes de confirmar)
- Penalizaciones: CHUI, HANSOKU CHUI, HANSOKU, SHIKKAKU (con confirmación modal), JOGAI (equivale a CHUI), MUBOBI (equivale a CHUI)
- El sistema lleva la cuenta y bloquea CHUI cuando ya hay 3 (siguiente disponible: HANSOKU CHUI); bloquea HANSOKU CHUI si ya hubo uno (siguiente: HANSOKU)

**SENSHU:**
- Botón SENSHU → AKA / SENSHU → AO — primer punto no respondido
- Botón TORIMASEN — anular SENSHU

**Cronómetro:**
- Iniciar / Pausar (HAJIME / YAME)
- Reiniciar
- Señal visual + sonora automática a los 15 segundos restantes (ATO SHIBARAKU)
- Señal de tiempo final

**Control del bout:**
- SHOBU HAJIME — iniciar combate
- YAME — pausar
- MOTO NO ICHI — volver a posiciones iniciales
- HANTEI — solicitar voto de jueces (empate total)
- HIKIWAKE — declarar empate (solo Round-robin / equipos)
- Finalizar bout → muestra ganador automático por puntos, o abre HANTEI si hay empate

**Automático (sin botón):**
- Diferencia ≥ 8 puntos → bout termina automáticamente
- 3 CHUI acumulados → bloquea CHUI, habilita HANSOKU CHUI
- HANSOKU CHUI previo → bloquea HANSOKU CHUI, habilita HANSOKU

#### Panel de control — Kata

- Entrada de puntaje por juez (J1–J5 o J1–J7 en Round-robin): 5.0 a 10.0 en pasos de 0.1
- Confirmación individual por juez antes de enviar
- Botón 0.0 separado con confirmación modal → descalificación (DQ)
- El sistema calcula automáticamente: votos por juez, cuenta AKA vs AO, declara ganador por mayoría
- Campo para registrar kata anunciado + validación automática (no repetir seguido, máx. 2 veces en el torneo)
- Control del bout: Iniciar, AKA listo / AO listo, cronómetro (35 s para iniciar), cronómetro de 5 min para kata equipo en medallas
- KIKEN — atleta no se presentó → rival avanza automáticamente

#### TV Display (proyector)

- URL separada: `/torneo/:id/marcador/:combateId/tv` — sin login, sin botones
- Sincronización vía Supabase Realtime
- Nombres grandes, scores enormes en rojo (AKA) y azul (AO)
- Penalizaciones pequeñas al costado
- Cronómetro grande
- Nombre de categoría, tatami y ronda

#### Compartido (ambos paneles)

- Indicador de conexión online/offline — siempre visible
- Nombre de categoría, tatami y ronda activa
- Nombres y club de AKA y AO
- Botón Protesta — formulario con cronómetro de 5 minutos según reglamento
- Historial de acciones de la ronda

### Modo offline
- El marcador funciona sin conexión (localStorage / IndexedDB)
- Cola de sincronización al recuperar conectividad
- Indicador de estado de conexión siempre visible

### Vista pública (`/torneo/:id/publico`)
- Sin login requerido
- Actualización automática vía Supabase Realtime
- Fuentes grandes, alto contraste — legible en proyector a distancia
- Puede filtrar por tatami

### Dashboard del tatami (organizador)
- Ve todas las categorías del tatami con su estado
- Puede activar / pausar categorías
- Ve qué combate está en curso en tiempo real

---

## Convenciones de código

- **Aritmética**: toda en `src/lib/scoring.js` — nunca cálculos inline en componentes, nunca en DB triggers, nunca delegados a LLM
- **Fechas**: UTC en Supabase, conversión a hora local solo en display
- **Estado global**: Zustand — no prop drilling más de 2 niveles
- **Nombrar dominio en español**: `torneo`, `tatami`, `categoria`, `combate`, `competidor`, `equipo`
- **Nombrar código en inglés**: hooks, utils, props, handlers
- **Componentes**: un archivo por componente, PascalCase
- **Funciones**: camelCase, verbo + sustantivo (`calcularPuntajeKata`, `generarBracketKumite`, `asignarByes`)
- **Rutas**: siempre anidadas bajo `/torneo/:id/` para mantener el contexto

---

## Expect-Driven Development (EDD)

### Principio

Antes de implementar cualquier función de lógica de negocio, se escribe primero el test que especifica exactamente qué debe devolver. El test es la especificación; el código es la consecuencia. Este flujo aplica obligatoriamente a todo lo que viva en `src/lib/`.

```
1. Entender la regla de negocio
2. Escribir el test con expect() que la captura
3. Ejecutar → debe fallar (red)
4. Implementar la función mínima para que pase (green)
5. Refactorizar sin romper el test (refactor)
```

### Herramienta

Vitest (ya incluido con Vite). Los archivos de test viven junto al código:

```
src/lib/
  scoring.js
  scoring.test.js
  brackets.js
  brackets.test.js
```

### Cómo debe comportarse Claude en este proyecto

Cuando se le pida implementar cualquier función en `src/lib/`:

1. **Primero escribe el archivo `.test.js`** con todos los casos relevantes
2. Luego escribe la implementación
3. Nunca implementa sin test previo en este directorio
4. Si la regla de negocio es ambigua, pregunta antes de escribir el test

### Especificaciones ya conocidas (escribir estos tests primero)

#### `scoring.test.js`

```js
import { describe, it, expect } from 'vitest'
import {
  // Kata
  determinarGanadorKataBout,     // mayoría de votos de jueces
  calcularVotosJuez,             // un juez compara sus puntajes → devuelve 'aka' | 'ao'
  resolverEmpateRoundRobin,      // desempate round-robin por criterios en orden
  validarKataPermitido,          // kata no repetido seguido, no más de 2 veces
  // Kumite
  aplicarPunto,
  aplicarPenalizacion,
  determinarGanadorBout,
  tieneVentajaOcho,              // victoria inmediata por diferencia ≥ 8
  calcularSenshu,                // primer punto no respondido
  calcularGanadorEquipoElim,     // eliminación por bouts ganados → puntos → bout extra
} from './scoring'

// ─── KATA — SISTEMA DE VOTOS ───────────────────────────────────────────────

describe('calcularVotosJuez', () => {
  it('el juez vota por quien le dio mayor puntaje', () => {
    // aka: 8.5, ao: 8.0 → voto para aka
    expect(calcularVotosJuez({ aka: 8.5, ao: 8.0 })).toBe('aka')
  })

  it('el juez vota por ao cuando ao tiene mayor puntaje', () => {
    expect(calcularVotosJuez({ aka: 7.9, ao: 8.1 })).toBe('ao')
  })

  it('lanza error si los puntajes son iguales (no puede haber empate por juez)', () => {
    expect(() => calcularVotosJuez({ aka: 8.0, ao: 8.0 })).toThrow()
  })
})

describe('determinarGanadorKataBout', () => {
  it('gana quien tenga mayoría de votos — 4 vs 3 con 7 jueces', () => {
    const votos = ['aka', 'aka', 'aka', 'aka', 'ao', 'ao', 'ao']
    expect(determinarGanadorKataBout(votos)).toBe('aka')
  })

  it('gana quien tenga mayoría de votos — 3 vs 2 con 5 jueces', () => {
    const votos = ['ao', 'ao', 'ao', 'aka', 'aka']
    expect(determinarGanadorKataBout(votos)).toBe('ao')
  })

  it('lanza error si el array de votos está vacío', () => {
    expect(() => determinarGanadorKataBout([])).toThrow()
  })

  it('lanza error si hay número par de votos (no puede haber empate)', () => {
    expect(() => determinarGanadorKataBout(['aka', 'ao', 'aka', 'ao'])).toThrow()
  })
})

// ─── KATA — VALIDACIÓN DE KATA PERMITIDO ───────────────────────────────────

describe('validarKataPermitido', () => {
  it('permite kata diferente al anterior', () => {
    const historial = ['Heian Shodan', 'Bassai Dai']
    expect(validarKataPermitido('Kanku Dai', historial)).toBe(true)
  })

  it('rechaza kata igual al inmediatamente anterior', () => {
    const historial = ['Heian Shodan', 'Bassai Dai']
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(false)
  })

  it('rechaza kata que ya se usó 2 veces, aunque no sea el último', () => {
    const historial = ['Bassai Dai', 'Heian Shodan', 'Bassai Dai']
    // Bassai Dai ya se usó 2 veces
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(false)
  })

  it('permite kata que se usó 1 vez si no es el último', () => {
    const historial = ['Bassai Dai', 'Heian Shodan', 'Kanku Dai']
    expect(validarKataPermitido('Bassai Dai', historial)).toBe(true)
  })
})

// ─── KATA — DESEMPATE ROUND-ROBIN (Art. 5.11) ──────────────────────────────

describe('resolverEmpateRoundRobin', () => {
  it('criterio 1: gana quien tiene más puntos de victoria', () => {
    const a = { victoria_points: 6, votos_favor: 10, ranking_wkf: 5 }
    const b = { victoria_points: 3, votos_favor: 15, ranking_wkf: 1 }
    expect(resolverEmpateRoundRobin(a, b)).toBe(a)
  })

  it('criterio 3: si puntos de victoria iguales y no pelearon entre sí, gana mayor suma de votos', () => {
    const a = { victoria_points: 6, votos_favor: 12, head_to_head: null }
    const b = { victoria_points: 6, votos_favor: 9,  head_to_head: null }
    expect(resolverEmpateRoundRobin(a, b)).toBe(a)
  })

  it('criterio 4: si todo lo anterior empata, gana mayor ranking WKF (número menor = mejor)', () => {
    const a = { victoria_points: 6, votos_favor: 10, head_to_head: null, ranking_wkf: 3 }
    const b = { victoria_points: 6, votos_favor: 10, head_to_head: null, ranking_wkf: 7 }
    expect(resolverEmpateRoundRobin(a, b)).toBe(a)
  })
})

// ─── KUMITE — PUNTUACIÓN (Art. 8.6) ────────────────────────────────────────

describe('aplicarPunto', () => {
  it('YUKO suma 1 punto — tsuki o uchi a zona de puntuación', () => {
    const estado = { puntos_aka: 0, puntos_ao: 0 }
    expect(aplicarPunto(estado, 'aka', 'yuko')).toMatchObject({ puntos_aka: 1 })
  })

  it('WAZA-ARI suma 2 puntos — patada chudan', () => {
    const estado = { puntos_aka: 0, puntos_ao: 0 }
    expect(aplicarPunto(estado, 'ao', 'waza_ari')).toMatchObject({ puntos_ao: 2 })
  })

  it('IPPON suma 3 puntos — patada jodan o técnica a oponente en el suelo', () => {
    const estado = { puntos_aka: 0, puntos_ao: 0 }
    const resultado = aplicarPunto(estado, 'aka', 'ippon')
    expect(resultado.puntos_aka).toBe(3)
  })

  it('no modifica los puntos del oponente al aplicar un punto', () => {
    const estado = { puntos_aka: 2, puntos_ao: 4 }
    const resultado = aplicarPunto(estado, 'aka', 'yuko')
    expect(resultado.puntos_ao).toBe(4)
  })
})

describe('tieneVentajaOcho', () => {
  it('retorna true cuando la diferencia es exactamente 8', () => {
    expect(tieneVentajaOcho({ puntos_aka: 8, puntos_ao: 0 })).toBe(true)
  })

  it('retorna true cuando la diferencia supera 8', () => {
    expect(tieneVentajaOcho({ puntos_aka: 5, puntos_ao: 13 })).toBe(true)
  })

  it('retorna false cuando la diferencia es menor a 8', () => {
    expect(tieneVentajaOcho({ puntos_aka: 3, puntos_ao: 7 })).toBe(false)
  })

  it('retorna false cuando están empatados', () => {
    expect(tieneVentajaOcho({ puntos_aka: 4, puntos_ao: 4 })).toBe(false)
  })
})

// ─── KUMITE — PENALIZACIONES (Art. 10) ─────────────────────────────────────

describe('aplicarPenalizacion', () => {
  it('CHUI 1 registra primera advertencia sin descalificación', () => {
    const estado = { chui_aka: 0, chui_ao: 0 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'chui')
    expect(resultado.chui_aka).toBe(1)
    expect(resultado.descalificado).toBeUndefined()
  })

  it('CHUI 3 no descalifica por sí solo — aún puede recibir uno más', () => {
    const estado = { chui_aka: 2, chui_ao: 0 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'chui')
    expect(resultado.chui_aka).toBe(3)
    expect(resultado.descalificado).toBeUndefined()
  })

  it('después de 3 CHUI, el siguiente debe ser HANSOKU CHUI', () => {
    // La UI no debe permitir dar CHUI 4; en la lógica, el 4to CHUI escala a HANSOKU CHUI
    const estado = { chui_aka: 3, hansoku_chui_aka: 0 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'chui')
    expect(resultado.hansoku_chui_aka).toBe(1)
  })

  it('HANSOKU CHUI tras 3 CHUI previos registra la advertencia de descalificación', () => {
    const estado = { chui_aka: 3, hansoku_chui_aka: 0 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'hansoku_chui')
    expect(resultado.hansoku_chui_aka).toBe(1)
    expect(resultado.descalificado).toBeUndefined()
  })

  it('HANSOKU con HANSOKU CHUI previo descalifica del bout — ao gana', () => {
    const estado = { chui_aka: 3, hansoku_chui_aka: 1 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'hansoku')
    expect(resultado.descalificado).toBe('aka')
    expect(resultado.ganador_bout).toBe('ao')
  })

  it('HANSOKU directo (infracción grave) descalifica sin necesidad de advertencias previas', () => {
    const estado = { chui_aka: 0, hansoku_chui_aka: 0 }
    const resultado = aplicarPenalizacion(estado, 'aka', 'hansoku')
    expect(resultado.descalificado).toBe('aka')
    expect(resultado.ganador_bout).toBe('ao')
  })

  it('SHIKKAKU descalifica del torneo completo, no solo del bout', () => {
    const estado = {}
    const resultado = aplicarPenalizacion(estado, 'ao', 'shikkaku')
    expect(resultado.descalificado_torneo).toBe('ao')
    expect(resultado.ganador_bout).toBe('aka')
  })
})

// ─── KUMITE — SENSHU (Art. 12.2.2) ─────────────────────────────────────────

describe('calcularSenshu', () => {
  it('se asigna al primer atleta que marca sin que el oponente también marque antes de la señal', () => {
    // aka marcó primero, ao no marcó en esa misma señal → senshu para aka
    expect(calcularSenshu({ primer_marcador: 'aka', doble_marcacion: false })).toBe('aka')
  })

  it('no se asigna senshu si ambos marcan en la misma señal', () => {
    expect(calcularSenshu({ primer_marcador: 'aka', doble_marcacion: true })).toBeNull()
  })
})

// ─── KUMITE — CRITERIOS DE DECISIÓN AL TIEMPO (Art. 12.2) ──────────────────

describe('determinarGanadorBout', () => {
  it('criterio 1: gana quien tiene más puntos', () => {
    const estado = { puntos_aka: 4, puntos_ao: 2, senshu: null, ippon_aka: 1, ippon_ao: 0 }
    expect(determinarGanadorBout(estado)).toBe('aka')
  })

  it('criterio 2: empate de puntos → gana quien tiene SENSHU', () => {
    const estado = { puntos_aka: 2, puntos_ao: 2, senshu: 'ao', ippon_aka: 0, ippon_ao: 0 }
    expect(determinarGanadorBout(estado)).toBe('ao')
  })

  it('criterio 3: sin SENSHU → gana mayor número de IPPON', () => {
    const estado = {
      puntos_aka: 3, puntos_ao: 3,
      senshu: null,
      ippon_aka: 1, ippon_ao: 0,
      waza_ari_aka: 0, waza_ari_ao: 1
    }
    expect(determinarGanadorBout(estado)).toBe('aka')
  })

  it('criterio 4: sin SENSHU, igual IPPON → gana mayor WAZA-ARI', () => {
    const estado = {
      puntos_aka: 3, puntos_ao: 3,
      senshu: null,
      ippon_aka: 1, ippon_ao: 1,
      waza_ari_aka: 2, waza_ari_ao: 1
    }
    expect(determinarGanadorBout(estado)).toBe('aka')
  })

  it('criterio 5: todo igual → retorna null (requiere HANTEI por los jueces)', () => {
    const estado = {
      puntos_aka: 2, puntos_ao: 2,
      senshu: null,
      ippon_aka: 0, ippon_ao: 0,
      waza_ari_aka: 1, waza_ari_ao: 1
    }
    expect(determinarGanadorBout(estado)).toBeNull()
  })
})

// ─── KUMITE EQUIPO — RESULTADO DEL MATCH (Art. 12.5) ──────────────────────

describe('calcularGanadorEquipoElim', () => {
  it('gana el equipo con más bouts ganados', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 3, puntos_ao: 0 },
      { ganador: 'ao',  puntos_aka: 0, puntos_ao: 2 },
      { ganador: 'aka', puntos_aka: 1, puntos_ao: 0 },
    ]
    expect(calcularGanadorEquipoElim(bouts)).toBe('aka')
  })

  it('empate en bouts → gana quien tiene más puntos totales', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 5, puntos_ao: 2 },
      { ganador: 'ao',  puntos_aka: 1, puntos_ao: 6 },
    ]
    // aka total: 6, ao total: 8 → gana ao
    expect(calcularGanadorEquipoElim(bouts)).toBe('ao')
  })

  it('empate en bouts y en puntos → retorna null (requiere bout extra)', () => {
    const bouts = [
      { ganador: 'aka', puntos_aka: 4, puntos_ao: 2 },
      { ganador: 'ao',  puntos_aka: 2, puntos_ao: 4 },
    ]
    expect(calcularGanadorEquipoElim(bouts)).toBeNull()
  })

  it('el match termina cuando un equipo ya tiene mayoría matemática de bouts', () => {
    // En un match de 5 bouts, si aka ganó 3 → match termina, no se juegan los 2 restantes
    const bouts = [
      { ganador: 'aka', puntos_aka: 2, puntos_ao: 0 },
      { ganador: 'aka', puntos_aka: 3, puntos_ao: 1 },
      { ganador: 'aka', puntos_aka: 1, puntos_ao: 0 },
    ]
    const resultado = calcularGanadorEquipoElim(bouts, { total_bouts: 5 })
    expect(resultado).toBe('aka')
    expect(resultado.match_terminado_anticipado).toBe(true)
  })
})
```

#### `brackets.test.js`

```js
import { describe, it, expect } from 'vitest'
import { generarBracket, asignarByes, contarRondas } from './brackets'

describe('asignarByes', () => {
  it('con 6 competidores genera 2 byes para llegar a 8', () => {
    const resultado = asignarByes(6)
    expect(resultado.total_slots).toBe(8)
    expect(resultado.byes).toBe(2)
  })

  it('con 8 competidores no genera byes', () => {
    expect(asignarByes(8).byes).toBe(0)
  })

  it('con 1 competidor lanza error', () => {
    expect(() => asignarByes(1)).toThrow()
  })
})

describe('generarBracket', () => {
  it('genera el número correcto de rondas', () => {
    const bracket = generarBracket(['A','B','C','D','E','F'])
    expect(contarRondas(bracket)).toBe(3) // → 8 slots → 3 rondas
  })

  it('todos los competidores aparecen en la primera ronda', () => {
    const competidores = ['A','B','C','D']
    const bracket = generarBracket(competidores)
    const enRonda1 = bracket.rondas[0].combates.flatMap(c => [c.rojo, c.azul]).filter(Boolean)
    competidores.forEach(c => expect(enRonda1).toContain(c))
  })
})
```

### Regla estricta

**Ninguna función en `src/lib/` existe sin su test correspondiente.** Si Claude Code propone implementar una función de negocio sin mostrar el test primero, debe ser rechazado y pedirle que invierta el orden.

---

## Flujo de desarrollo sugerido

1. Setup Supabase — tablas, RLS, Auth
2. Crear torneo — formulario y lista de torneos
3. Crear tatamis — dentro del torneo
4. Crear categorías — dentro del tatami, con selección de modalidad
5. Inscripciones — registro de competidores y equipos
6. Generación de brackets — por modalidad
7. Marcador kumite individual
8. Marcador kata individual
9. Marcador kumite equipo
10. Marcador kata equipo
11. Vista pública en tiempo real
12. Resultados, podio y exportación PDF

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Comandos

```bash
npm run dev        # Desarrollo local
npm run build      # Build de producción
npm run preview    # Preview del build
```

---

## Git y GitHub

Repositorio: `https://github.com/suarezcarrascals-code/app-karate`

**Regla obligatoria:** después de cualquier cambio en el código, hacer commit y push al repositorio antes de reportar el trabajo como completo. Sin excepciones.

---

## Notas

- La jerarquía Torneo → Tatami → Categoría es rígida — no romperla por atajos
- Las 4 modalidades comparten pantallas de inscripción y resultados, pero tienen marcadores completamente distintos
- El PDF del bracket debe ser imprimible — formato A4 horizontal para brackets grandes
- La app corre en Android e iOS vía navegador — no app nativa por ahora

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at [specs/007-links-mesa-tecnica/plan.md](specs/007-links-mesa-tecnica/plan.md)
<!-- SPECKIT END -->
