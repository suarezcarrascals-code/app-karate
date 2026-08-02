# Quickstart: Validación del Marcador Kata Individual

**Feature**: 008-marcador-kata-individual

---

## Prerrequisitos

1. Torneo creado y en estado `en_curso`
2. Tatami creado con categoría de modalidad `kata_individual`
3. Bracket generado con al menos 2 competidores → 1 combate en estado `pendiente`
4. Link de mesa técnica generado para el tatami (`/mesa/:token`)
5. Migración SQL ejecutada (ver [data-model.md](data-model.md))
6. `npm run dev` corriendo

---

## Scenario 1: Bout completo de kata individual (flujo normal)

```
Paso 1: Abrir el bracket de la categoría
  URL: /mesa/:token/categoria/:catId
  Verificar: el combate pendiente muestra botón "Operar (Kata)" en lugar de "Operar"

Paso 2: Entrar al panel de kata
  Click: "Operar (Kata)" → navega a /mesa/:token/categoria/:catId/combate/:combateId/kata
  Verificar: panel muestra AO (izquierda) y AKA (derecha)
  Verificar: estado actual es "anuncio" con cronómetro de 35s

Paso 3: Anuncio de kata
  Click "Iniciar anuncio AKA" → cronómetro inicia
  Ingresar: "Bassai Dai" en campo kata AKA → confirmar
  Click "Iniciar anuncio AO"
  Ingresar: "Kanku Dai" en campo kata AO → confirmar
  Verificar: ambos katas guardados, sin advertencias (katas distintos, primera vez)

Paso 4: Ingresar puntajes AKA
  J1: 7.5 / J2: 7.8 / J3: 7.6 / J4: 7.4 / J5: 7.7
  Click "Confirmar puntajes AKA"
  Verificar: puntajes AKA bloqueados. DB: j1_rojo=7.5, j2_rojo=7.8, ...

Paso 5: Ingresar puntajes AO
  J1: 7.3 / J2: 7.9 / J3: 7.5 / J4: 7.6 / J5: 7.5
  Click "Confirmar puntajes AO"
  Verificar: sistema calcula votos:
    J1: AKA(7.5) > AO(7.3) → voto AKA
    J2: AO(7.9) > AKA(7.8) → voto AO
    J3: AKA(7.6) > AO(7.5) → voto AKA
    J4: AO(7.6) > AKA(7.4) → voto AO
    J5: AKA(7.7) > AO(7.5) → voto AKA
    Total: AKA=3, AO=2 → GANADOR: AKA

Paso 6: Finalizar bout
  Click "Finalizar bout"
  Verificar: combate estado=finalizado, ganador_id=competidor_rojo_id
  Verificar: bracket muestra AKA como ganador
```

---

## Scenario 2: Validación de empate por juez

```
Paso 1: Entrar al panel kata
Paso 2: Ingresar puntajes AKA: J1=7.5, J2=7.8, J3=7.6, J4=7.4, J5=7.7
Paso 3: Ingresar puntajes AO: J1=7.5, J2=7.9, J3=7.5, J4=7.6, J5=7.5
  ⚠ J1: AKA=7.5 = AO=7.5 → empate
  ⚠ J3: AKA=7.6 → esperar... AO J3=7.5, OK. J1 es el conflicto.

Paso 4: Click "Confirmar puntajes AO"
  Verificar: aparece error "J1 tiene igual puntaje para AKA y AO (7.5). 
             Corrige el puntaje antes de confirmar."
  Verificar: NO se guarda en DB hasta corregir
```

---

## Scenario 3: Kata repetido — advertencia

```
Prerrequisito: competidor AKA ya tiene un bout finalizado con kata_anunciado_rojo='Bassai Dai'

Paso 1: Entrar al panel kata del segundo bout de AKA en la misma categoría
Paso 2: Ingresar kata AKA: "Bassai Dai"
  Verificar: advertencia amarilla "Bassai Dai ya fue usado en el bout anterior. 
             No puede repetirse seguido (WKF Art. 5.2)."
  Verificar: botón "Confirmar de todas formas" disponible (advertencia, no bloqueo)
```

---

## Scenario 4: KIKEN

```
Paso 1: Entrar al panel kata
Paso 2: Click botón "KIKEN AO"
  Verificar: modal "¿Confirmar KIKEN para [nombre AO]? El rival avanzará automáticamente."
Paso 3: Confirmar
  Verificar: combate estado=finalizado, ganador_id=competidor_rojo_id
  Verificar: bracket muestra AKA como ganador
```

---

## Scenario 5: TV display en sync

```
Paso 1: Abrir en ventana separada: /mesa/:token/categoria/:catId/combate/:combateId/kata-tv
  Verificar: muestra nombres AKA y AO, estado "Esperando inicio"

Paso 2: En el panel, confirmar puntajes AKA
  Verificar: en < 1 segundo el TV muestra J1–J5 para AKA

Paso 3: Confirmar puntajes AO y declarar ganador
  Verificar: TV muestra tabla completa de votos y resalta al ganador
```

---

## Scenario 6: Recuperación tras reload

```
Paso 1: Entrar al panel kata, confirmar puntajes AKA (j1_rojo..j5_rojo guardados en DB)
Paso 2: Cerrar/recargar la pestaña
  URL: /mesa/:token/categoria/:catId/combate/:combateId/kata
  Verificar: panel reanuda en fase "azul_performance" 
             con puntajes AKA ya confirmados visibles (bloqueados)
             y campos AO vacíos listos para ingresar
```

---

## Tests unitarios (EDD)

```bash
cd c:\Users\ASUS\OneDrive\Desktop\app-karate
npm run test -- --run src/lib/scoring.test.js
```

**Expected**: todos los casos kata de `calcularVotosJuez`, `determinarGanadorKataBout`, `validarKataPermitido` en verde.
