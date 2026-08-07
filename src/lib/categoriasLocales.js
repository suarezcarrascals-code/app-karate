// Categorías locales para torneos no-WKF en Colombia
// Organizadas por nivel de cinturón × edad × género × modalidad
//
// nivel: 'principiante' (10°-9° Kyu) | 'intermedio' (8°-5° Kyu) | 'avanzado' (4° Kyu - Dan)
// cinturon_min / cinturon_max usan la escala kyu numérica (10=más principiante, -3=4°Dan+)

const NIVEL_CFG = {
  principiante: { label: 'Principiante', cinturon_min: 9,  cinturon_max: 10 },
  intermedio:   { label: 'Intermedio',   cinturon_min: 5,  cinturon_max: 8  },
  avanzado:     { label: 'Avanzado',     cinturon_min: -3, cinturon_max: 4  },
}

const GRUPOS_EDAD = [
  { label: 'Sub-8',  edad_min: 6,  edad_max: 7   },
  { label: 'Sub-10', edad_min: 8,  edad_max: 9   },
  { label: 'Sub-12', edad_min: 10, edad_max: 11  },
  { label: 'Sub-14', edad_min: 12, edad_max: 13  },
  { label: 'Cadete', edad_min: 14, edad_max: 15  },
  { label: 'Junior', edad_min: 16, edad_max: 17  },
  { label: 'Mayor',  edad_min: 18, edad_max: null },
]

// Límites superiores de cada clase de peso por grupo de edad y género.
// null en el array = última clase (abierta hacia arriba).
// null como valor completo = categoría Open sin división de peso.
const PESOS_KUMITE = {
  'Sub-8':  { masculino: null,                  femenino: null                  },
  'Sub-10': { masculino: null,                  femenino: null                  },
  'Sub-12': { masculino: [25, 30, 35, null],    femenino: [25, 30, null]        },
  'Sub-14': { masculino: [40, 45, 50, 55, null],femenino: [42, 47, null]        },
  'Cadete': { masculino: [52, 57, 63, 70, null],femenino: [47, 54, 61, null]    },
  'Junior': { masculino: [55, 61, 68, 76, null],femenino: [48, 53, 59, 66, null]},
  'Mayor':  { masculino: [60, 67, 75, 84, null],femenino: [50, 55, 61, 68, null]},
}

function pesoSufijo(pesoMin, pesoMax) {
  if (pesoMax === null) return `+${pesoMin}kg`
  return `-${pesoMax}kg`
}

const _cats = []

for (const edad of GRUPOS_EDAD) {
  for (const nivel of ['principiante', 'intermedio', 'avanzado']) {
    const ncfg = NIVEL_CFG[nivel]
    for (const [genero, genLabel] of [['masculino', 'Masculino'], ['femenino', 'Femenino']]) {
      const base = {
        genero,
        edad_min: edad.edad_min,
        edad_max: edad.edad_max,
        nivel,
        cinturon_min: ncfg.cinturon_min,
        cinturon_max: ncfg.cinturon_max,
      }

      // Kata Individual — sin división de peso
      _cats.push({
        ...base,
        nombre: `Kata Individual ${edad.label} ${genLabel} ${ncfg.label}`,
        modalidad: 'kata_individual',
        peso_min: null,
        peso_max: null,
      })

      // Kumite Individual — con o sin división de peso según la edad
      const pesosGrupo = PESOS_KUMITE[edad.label]?.[genero]
      if (pesosGrupo === null) {
        // Open: sin división de peso (Sub-8 y Sub-10)
        _cats.push({
          ...base,
          nombre: `Kumite Individual ${edad.label} ${genLabel} ${ncfg.label}`,
          modalidad: 'kumite_individual',
          peso_min: null,
          peso_max: null,
        })
      } else if (pesosGrupo) {
        let prevPeso = null
        for (const pesoMax of pesosGrupo) {
          _cats.push({
            ...base,
            nombre: `Kumite Individual ${edad.label} ${genLabel} ${ncfg.label} ${pesoSufijo(prevPeso, pesoMax)}`,
            modalidad: 'kumite_individual',
            peso_min: prevPeso,
            peso_max: pesoMax,
          })
          prevPeso = pesoMax
        }
      }
    }
  }
}

export const CATEGORIAS_LOCALES = _cats

// Preset sin peso: kumite y kata sin división de peso para todas las edades y niveles
const _sinPeso = []
for (const edad of GRUPOS_EDAD) {
  for (const nivel of ['principiante', 'intermedio', 'avanzado']) {
    const ncfg = NIVEL_CFG[nivel]
    for (const [genero, genLabel] of [['masculino', 'Masculino'], ['femenino', 'Femenino']]) {
      const base = {
        genero,
        edad_min: edad.edad_min,
        edad_max: edad.edad_max,
        nivel,
        cinturon_min: ncfg.cinturon_min,
        cinturon_max: ncfg.cinturon_max,
        peso_min: null,
        peso_max: null,
      }
      _sinPeso.push({ ...base, nombre: `Kata Individual ${edad.label} ${genLabel} ${ncfg.label}`, modalidad: 'kata_individual' })
      _sinPeso.push({ ...base, nombre: `Kumite Individual ${edad.label} ${genLabel} ${ncfg.label}`, modalidad: 'kumite_individual' })
    }
  }
}
export const PRESET_SIN_PESO = _sinPeso

export const GRUPOS_LOCALES = [
  { nivel: 'principiante', label: 'Principiante', sub: '10° y 9° Kyu' },
  { nivel: 'intermedio',   label: 'Intermedio',   sub: '8° al 5° Kyu' },
  { nivel: 'avanzado',     label: 'Avanzado',     sub: '4° Kyu a Negro' },
]
