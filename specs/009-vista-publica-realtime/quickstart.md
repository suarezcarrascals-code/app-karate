# Quickstart: Vista Pública en Tiempo Real

**Feature**: 009-vista-publica-realtime

## Prerrequisitos

- `npm run dev` corriendo en `localhost:5173`
- Torneo creado en Supabase con al menos 1 tatami y 1 categoría con bracket generado
- Al menos 1 combate en estado `en_curso` (operado desde el panel de mesa técnica)

## Escenario 1: Vista principal de actividad en tiempo real (US1)

### Setup

```
1. En Supabase, asegúrate de tener:
   - Torneo con estado = 'en_curso'
   - Tatami A con Categoría "Kumite -60 kg Senior Masc" (estado = 'en_curso')
   - Un combate con estado = 'en_curso', puntos_rojo = 3, puntos_azul = 1
```

### Pasos de validación

```
1. Abrir http://localhost:5173/torneo/<ID>/publico
   → Esperado: pantalla negra con nombre del torneo en header
   → Esperado: chip "Todos" seleccionado + chip "Tatami A"
   → Esperado: tarjeta grande con "Kumite -60 kg Senior Masc" mostrando:
               [Juan García] [3] — [1] [Pedro López]

2. Desde el panel de mesa técnica, sumar un punto a AKA (rojo)
   → Esperado: dentro de 3 segundos, el score cambia a [4] — [1] sin recargar la página

3. Finalizar el combate desde mesa técnica
   → Esperado: la tarjeta del combate activo desaparece o cambia a "Finalizado"
```

---

## Escenario 2: Filtrar por tatami (US2)

### Setup

```
Torneo con 2 tatamis: "Tatami A" (con combate activo) y "Tatami B" (sin combate activo)
```

### Pasos de validación

```
1. Abrir /torneo/<ID>/publico
   → Esperado: chips [Todos] [Tatami A] [Tatami B] visibles en header

2. Presionar chip "Tatami A"
   → Esperado: solo aparece la sección de Tatami A
   → Esperado: URL cambia a /torneo/<ID>/publico?tatami=<tatami_a_id>

3. Abrir esa URL en una nueva pestaña
   → Esperado: abre directamente con el filtro de Tatami A aplicado

4. Presionar chip "Todos"
   → Esperado: vuelven todos los tatamis
```

---

## Escenario 3: Bracket de una categoría (US3)

### Setup

```
Categoría con 4 combates: ronda 1 (2 combates finalizados), ronda 2 (1 finalizado, 1 pendiente)
```

### Pasos de validación

```
1. Abrir /torneo/<ID>/publico
2. Presionar la tarjeta de la categoría "Kumite -60 kg Senior Masc"
   → Esperado: navega a /torneo/<ID>/publico/categoria/<catId>
   → Esperado: se ve el bracket horizontal con 2 rondas
   → Esperado: los ganadores de ronda 1 están resaltados (badge W)
   → Esperado: el combate de final muestra 1 competidor definido y 1 "Por definir"

3. Finalizar todos los combates desde mesa técnica
   → Esperado: dentro de 3 segundos, aparece sección "Podio" con:
               🥇 [Nombre ganador]
               🥈 [Finalista]
               🥉 [3er puesto]

4. Presionar botón "← Volver" del header
   → Esperado: navega de regreso a /torneo/<ID>/publico
```

---

## Escenario 4: Torneo no activo

### Pasos de validación

```
1. Cambiar el torneo a estado = 'inscripciones' en Supabase
2. Abrir /torneo/<ID>/publico
   → Esperado: mensaje "La competencia aún no ha comenzado"
   → NO se muestran datos de categorías ni competidores
```

---

## Escenario 5: Modo offline

### Pasos de validación

```
1. Abrir /torneo/<ID>/publico con datos cargados
2. Desactivar la red (DevTools → Network → Offline)
   → Esperado: indicador "Sin conexión" visible (punto rojo)
   → Esperado: los últimos datos siguen visibles (no se borra la pantalla)
3. Reactivar la red
   → Esperado: indicador vuelve a verde, datos se actualizan en el próximo poll
```
