export async function descargarPlantillaExcel() {
  const ExcelJS = (await import('exceljs')).default

  const wb = new ExcelJS.Workbook()
  wb.creator = 'App Karate'
  const ws = wb.addWorksheet('Atletas')

  ws.columns = [
    { header: 'nombre',   key: 'nombre',   width: 20 },
    { header: 'apellido', key: 'apellido', width: 20 },
    { header: 'edad',     key: 'edad',     width: 10 },
    { header: 'peso_kg',  key: 'peso_kg',  width: 12 },
    { header: 'sexo',     key: 'sexo',     width: 16 },
  ]

  // Encabezados
  const headerRow = ws.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF991B1B' } } }
  })
  headerRow.height = 22

  // Filas de ejemplo
  const ejemplos = [
    { nombre: 'Juan',  apellido: 'García', edad: 15, peso_kg: 65, sexo: 'masculino' },
    { nombre: 'María', apellido: 'López',  edad: 12, peso_kg: 52, sexo: 'femenino'  },
  ]
  ejemplos.forEach((ej) => {
    const row = ws.addRow(ej)
    row.eachCell((cell) => {
      cell.font = { color: { argb: 'FF9CA3AF' }, italic: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27272A' } }
    })
  })

  // Filas vacías con validaciones
  for (let i = 4; i <= 53; i++) {
    ws.getCell(`E${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"masculino,femenino"'],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: 'Seleccioná "masculino" o "femenino"',
    }
    ws.getCell(`C${i}`).dataValidation = {
      type: 'whole',
      operator: 'between',
      formulae: [3, 100],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Edad inválida',
      error: 'Ingresá un número entre 3 y 100',
    }
    ws.getCell(`D${i}`).dataValidation = {
      type: 'decimal',
      operator: 'between',
      formulae: [1, 200],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Peso inválido',
      error: 'Ingresá un número entre 1 y 200',
    }
  }

  ws.getCell('G1').value = '⚠ Las filas grises son ejemplos — borralas antes de subir el archivo.'
  ws.getCell('G1').font = { italic: true, color: { argb: 'FFFBBF24' }, size: 10 }
  ws.getColumn('G').width = 55

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_atletas.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export async function parsearArchivoExcel(archivo) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const buffer = await archivo.arrayBuffer()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]

  const filas = []
  const errores = []

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const nombre   = row.getCell(1).text?.trim()
    const apellido = row.getCell(2).text?.trim()
    const edadVal  = row.getCell(3).value
    const pesoVal  = row.getCell(4).value
    const sexo     = row.getCell(5).text?.trim().toLowerCase()

    if (!nombre && !apellido && !edadVal) return

    const errs = []
    if (!nombre)   errs.push('nombre vacío')
    if (!apellido) errs.push('apellido vacío')

    const edad = edadVal ? parseInt(edadVal) : null
    if (!edad || isNaN(edad) || edad < 3 || edad > 100)
      errs.push('edad inválida (debe ser un número entre 3 y 100)')

    if (!sexo || !['masculino', 'femenino'].includes(sexo))
      errs.push('sexo debe ser "masculino" o "femenino"')

    const peso = pesoVal ? parseFloat(pesoVal) : null
    if (pesoVal && isNaN(peso)) errs.push('peso inválido')

    if (errs.length > 0) {
      errores.push(`Fila ${rowNumber} (${nombre || '?'} ${apellido || '?'}): ${errs.join(', ')}`)
      return
    }

    filas.push({ nombre, apellido, edad, peso, genero: sexo })
  })

  return { filas, errores }
}

export function parsearCSV(texto) {
  const textoLimpio = texto.replace(/^﻿/, '')
  const lineas = textoLimpio.trim().split(/\r?\n/)
  if (lineas.length < 2) return { filas: [], errores: ['El archivo está vacío o no tiene datos.'] }

  const sep = lineas[0].includes(';') ? ';' : ','
  const encabezados = lineas[0].split(sep).map((h) => h.trim().toLowerCase())
  const requeridos = ['nombre', 'apellido', 'edad', 'peso_kg', 'genero']
  const faltantes = requeridos.filter((r) => !encabezados.includes(r))
  if (faltantes.length > 0) {
    return { filas: [], errores: [`Columnas faltantes: ${faltantes.join(', ')}. Usá la plantilla descargada.`] }
  }

  const filas = []
  const errores = []

  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (!linea) continue

    const valores = linea.split(sep).map((v) => v.trim())
    const fila = {}
    encabezados.forEach((h, idx) => { fila[h] = valores[idx] ?? '' })

    const errs = []
    if (!fila.nombre)   errs.push('nombre vacío')
    if (!fila.apellido) errs.push('apellido vacío')

    const edad = fila.edad ? parseInt(fila.edad) : null
    if (!edad || isNaN(edad) || edad < 3 || edad > 100)
      errs.push('edad inválida (número entre 3 y 100)')

    if (!fila.genero || !['masculino', 'femenino'].includes(fila.genero.toLowerCase()))
      errs.push('género debe ser "masculino" o "femenino"')

    const peso = fila.peso_kg ? parseFloat(fila.peso_kg) : null
    if (fila.peso_kg && isNaN(peso)) errs.push('peso inválido')

    if (errs.length > 0) {
      errores.push(`Fila ${i + 1} (${fila.nombre || '?'} ${fila.apellido || '?'}): ${errs.join(', ')}`)
      continue
    }

    filas.push({
      nombre: fila.nombre,
      apellido: fila.apellido,
      edad,
      peso,
      genero: fila.genero.toLowerCase(),
    })
  }

  return { filas, errores }
}
