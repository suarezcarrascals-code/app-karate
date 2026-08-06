// Sistema de cinturones para torneos locales en Colombia
// Principiante: 10° y 9° Kyu | Intermedio: 8° al 5° Kyu | Avanzado: 4° Kyu a Dan

export const CINTURONES = [
  { key: '10kyu', label: 'Sin grado (10° Kyu)', kyu: 10, nivel: 'principiante' },
  { key: '9kyu',  label: 'Blanco (9° Kyu)',     kyu: 9,  nivel: 'principiante' },
  { key: '8kyu',  label: 'Amarillo (8° Kyu)',   kyu: 8,  nivel: 'intermedio'   },
  { key: '7kyu',  label: 'Naranja (7° Kyu)',    kyu: 7,  nivel: 'intermedio'   },
  { key: '6kyu',  label: 'Verde (6° Kyu)',      kyu: 6,  nivel: 'intermedio'   },
  { key: '5kyu',  label: 'Azul (5° Kyu)',       kyu: 5,  nivel: 'intermedio'   },
  { key: '4kyu',  label: 'Morado (4° Kyu)',     kyu: 4,  nivel: 'avanzado'     },
  { key: '3kyu',  label: 'Marrón III (3° Kyu)', kyu: 3,  nivel: 'avanzado'     },
  { key: '2kyu',  label: 'Marrón II (2° Kyu)',  kyu: 2,  nivel: 'avanzado'     },
  { key: '1kyu',  label: 'Marrón I (1° Kyu)',   kyu: 1,  nivel: 'avanzado'     },
  { key: '1dan',  label: 'Negro (1° Dan)',       kyu: 0,  nivel: 'avanzado'     },
  { key: '2dan',  label: 'Negro (2° Dan)',       kyu: -1, nivel: 'avanzado'     },
  { key: '3dan',  label: 'Negro (3° Dan)',       kyu: -2, nivel: 'avanzado'     },
  { key: '4dan',  label: 'Negro (4° Dan+)',      kyu: -3, nivel: 'avanzado'     },
]

// Etiquetas y colores para mostrar el nivel en la UI
export const NIVEL_LABEL = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
}

export const NIVEL_COLOR = {
  principiante: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
  intermedio:   'text-amber-400   bg-amber-950/40   border-amber-800/50',
  avanzado:     'text-rose-400    bg-rose-950/40    border-rose-800/50',
}

// Rango kyu para cinturon_min / cinturon_max en tabla categoria
// cinturon_min = valor más avanzado | cinturon_max = valor más principiante
export const KYU_RANGE_POR_NIVEL = {
  principiante: { cinturon_min: 9,  cinturon_max: 10 },
  intermedio:   { cinturon_min: 5,  cinturon_max: 8  },
  avanzado:     { cinturon_min: -3, cinturon_max: 4  },
}

export function clasificarCinturon(key) {
  return CINTURONES.find((c) => c.key === key)?.nivel ?? null
}

export function getCinturon(key) {
  return CINTURONES.find((c) => c.key === key) ?? null
}
