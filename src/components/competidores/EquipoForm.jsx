import { useState, useMemo } from 'react'

const INPUT = 'w-full border border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 placeholder:text-zinc-600'

export default function EquipoForm({ categoriaId, competidores, equipos, onSubmit, onCancel, loading }) {
  const [clubId, setClubId] = useState('')
  const [miembro1, setMiembro1] = useState('')
  const [miembro2, setMiembro2] = useState('')
  const [miembro3, setMiembro3] = useState('')
  const [errores, setErrores] = useState({})

  // IDs de competidores ya asignados a algún equipo existente
  const asignados = new Set(
    equipos.flatMap((e) => [e.miembro_1_id, e.miembro_2_id, e.miembro_3_id])
  )

  // Clubs únicos presentes en los competidores de esta categoría
  const clubsDisponibles = useMemo(() => {
    const seen = new Set()
    return competidores
      .filter((c) => c.dojo?.id)
      .filter((c) => { if (seen.has(c.dojo.id)) return false; seen.add(c.dojo.id); return true })
      .map((c) => c.dojo)
  }, [competidores])

  // Competidores del club seleccionado, sin equipo aún
  const competidoresClub = useMemo(() => {
    if (!clubId) return []
    return competidores.filter((c) => c.dojo?.id === clubId && !asignados.has(c.id))
  }, [clubId, competidores, asignados])

  const seleccionActual = [miembro1, miembro2, miembro3]

  function opcionesPara(propio) {
    const otros = seleccionActual.filter((id) => id && id !== propio)
    return competidoresClub.filter((c) => !otros.includes(c.id) || c.id === propio)
  }

  function resetMiembros() {
    setMiembro1('')
    setMiembro2('')
    setMiembro3('')
    setErrores({})
  }

  function handleClubChange(e) {
    setClubId(e.target.value)
    resetMiembros()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!clubId) errs.club = 'Seleccioná un club'
    if (!miembro1) errs.miembro1 = 'Requerido'
    if (!miembro2) errs.miembro2 = 'Requerido'
    if (!miembro3) errs.miembro3 = 'Requerido'
    const sel = [miembro1, miembro2, miembro3].filter(Boolean)
    if (new Set(sel).size < sel.length) errs.miembro1 = 'No podés repetir el mismo competidor'
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const clubNombre = clubsDisponibles.find((d) => d.id === clubId)?.nombre || clubId

    onSubmit({
      categoria_id: categoriaId,
      nombre: clubNombre,
      club: clubNombre,
      miembro_1_id: miembro1,
      miembro_2_id: miembro2,
      miembro_3_id: miembro3,
    })
  }

  const sinClubs = clubsDisponibles.length === 0
  const pocosMiembros = clubId && competidoresClub.length < 3

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3 mt-3">
      <p className="text-sm font-semibold text-zinc-200">Nuevo equipo</p>

      {sinClubs && (
        <p className="text-xs text-amber-400/80">
          No hay competidores con dojo asignado en esta categoría. Inscribí competidores con dojo para formar equipos.
        </p>
      )}

      <div>
        <select value={clubId} onChange={handleClubChange} className={INPUT} disabled={sinClubs}>
          <option value="">Seleccioná el club *</option>
          {clubsDisponibles.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        {errores.club && <p className="text-rose-400 text-xs mt-1">{errores.club}</p>}
      </div>

      {clubId && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">
            Miembros de {clubsDisponibles.find((d) => d.id === clubId)?.nombre}
          </p>

          {pocosMiembros && (
            <p className="text-xs text-amber-400/80">
              Este club tiene menos de 3 competidores disponibles sin equipo.
            </p>
          )}

          {[
            { label: 'Miembro 1', value: miembro1, set: setMiembro1, key: 'miembro1' },
            { label: 'Miembro 2', value: miembro2, set: setMiembro2, key: 'miembro2' },
            { label: 'Miembro 3', value: miembro3, set: setMiembro3, key: 'miembro3' },
          ].map(({ label, value, set, key }) => (
            <div key={key}>
              <select value={value}
                onChange={(e) => { set(e.target.value); setErrores((p) => ({ ...p, [key]: null, miembro1: null })) }}
                className={INPUT}>
                <option value="">{label} *</option>
                {opcionesPara(value).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido}{c.dojo?.nombre ? ` — ${c.dojo.nombre}` : ''}
                  </option>
                ))}
              </select>
              {errores[key] && <p className="text-rose-400 text-xs mt-1">{errores[key]}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading || sinClubs || pocosMiembros}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-500 transition-colors disabled:opacity-50 active:scale-95">
          {loading ? 'Guardando...' : 'Crear equipo'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-zinc-400 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
