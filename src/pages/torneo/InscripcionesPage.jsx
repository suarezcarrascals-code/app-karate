import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Warning } from '@phosphor-icons/react'
import { fetchCategorias } from '../../lib/categorias'
import { fetchTatamis } from '../../lib/tatamis'
import useLinkStore from '../../stores/useLinkStore'
import useLinkMesaTecnicaStore from '../../stores/useLinkMesaTecnicaStore'
import useDojoStore from '../../stores/useDojoStore'
import LinkCard from '../../components/inscripcion/LinkCard'
import MesaTecnicaLinkCard from '../../components/mesatecnica/MesaTecnicaLinkCard'

export default function InscripcionesPage() {
  const { id: torneoId } = useParams()

  const { links, loading, error, fetchLinks, generarLink, suscribirRealtime, desuscribir } = useLinkStore()
  const { dojos, fetchDojos: fetchDojosStore } = useDojoStore()
  const {
    links: linksMT, loading: loadingMT, error: errorMT,
    fetchLinks: fetchLinksMT, generarLink: generarLinkMT,
  } = useLinkMesaTecnicaStore()

  const [prerequisitos, setPrerequisitos] = useState(null)
  const [tatamis, setTatamis] = useState([])

  useEffect(() => {
    fetchDojosStore(torneoId)
    fetchLinks(torneoId)
    fetchLinksMT(torneoId)
    suscribirRealtime(torneoId)
    return () => desuscribir()
  }, [torneoId]) // eslint-disable-line

  useEffect(() => {
    async function verificar() {
      const [ts, cats] = await Promise.all([
        fetchTatamis(torneoId),
        fetchCategorias(torneoId),
      ])
      setTatamis(ts)
      setPrerequisitos({
        tatamis: ts.length,
        categorias: cats.length,
        dojos: dojos.length,
      })
    }
    verificar()
  }, [torneoId, dojos.length]) // eslint-disable-line

  const prerequisitosOk = prerequisitos?.tatamis > 0 && prerequisitos?.categorias > 0 && prerequisitos?.dojos > 0

  const linkPorDojo = links.reduce((acc, l) => {
    if (!acc[l.dojo_id] || l.estado === 'activo') acc[l.dojo_id] = l
    return acc
  }, {})

  const linkPorTatami = linksMT.reduce((acc, l) => {
    if (!acc[l.tatami_id] || l.estado === 'activo') acc[l.tatami_id] = l
    return acc
  }, {})

  async function handleGenerar(dojoId) {
    await generarLink(torneoId, dojoId)
  }

  async function handleGenerarMT(tid, tatamiId) {
    await generarLinkMT(tid, tatamiId)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ── Links de inscripción por club ── */}
      <div className="mb-8">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Inscripciones</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Links de acceso por club</p>
        </div>

        {prerequisitos && !prerequisitosOk && (
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-4 mb-5 flex gap-3">
            <Warning size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">
                Para generar links, el torneo debe tener:
              </p>
              <ul className="text-xs text-amber-400/80 space-y-0.5">
                {prerequisitos.tatamis === 0 && <li>• Al menos 1 tatami creado</li>}
                {prerequisitos.categorias === 0 && <li>• Al menos 1 categoría creada</li>}
                {prerequisitos.dojos === 0 && <li>• Al menos 1 club (dojo) creado</li>}
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {loading && dojos.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && dojos.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-400 font-medium mb-1">No hay clubs registrados</p>
            <p className="text-zinc-600 text-sm">Agregá clubs en la sección "Dojos" del torneo.</p>
          </div>
        )}

        {dojos.length > 0 && (
          <div className="grid gap-3">
            {dojos.map((dojo) => (
              <LinkCard
                key={dojo.id}
                dojo={dojo}
                link={linkPorDojo[dojo.id] ?? null}
                torneoId={torneoId}
                onGenerar={handleGenerar}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Links de mesa técnica ── */}
      <div className="border-t border-zinc-800 pt-7">
        <div className="mb-4">
          <h2 className="text-base font-bold text-zinc-100 tracking-tight">Mesa técnica</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Un link por tatami para operar el marcador el día del evento</p>
        </div>

        {errorMT && (
          <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
            {errorMT}
          </div>
        )}

        {loadingMT && tatamis.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loadingMT && tatamis.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">Primero crea los tatamis del torneo.</p>
          </div>
        )}

        {tatamis.length > 0 && (
          <div className="grid gap-3">
            {tatamis.map((tatami) => (
              <MesaTecnicaLinkCard
                key={tatami.id}
                tatami={tatami}
                link={linkPorTatami[tatami.id] ?? null}
                torneoId={torneoId}
                onGenerar={handleGenerarMT}
                onRegenerar={handleGenerarMT}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
