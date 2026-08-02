import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './stores/useAuthStore'

import TorneosPage from './pages/torneos/index'
import NuevoTorneo from './pages/torneos/NuevoTorneo'
import TorneoLayout from './pages/torneo/TorneoLayout'
import TorneoDashboard from './pages/torneo/TorneoDashboard'
import CategoriasPage from './pages/torneo/CategoriasPage'
import CompetidoresPage from './pages/torneo/CompetidoresPage'
import DojosPage from './pages/torneo/DojosPage'
import BracketPage from './pages/torneo/BracketPage'
import KumiteMarcador from './pages/torneo/marcador/KumiteMarcador'
import KataMarcador from './pages/torneo/marcador/KataMarcador'
import TvDisplay from './pages/torneo/marcador/TvDisplay'
import InscripcionesPage from './pages/torneo/InscripcionesPage'
import InscripcionPublica from './pages/InscripcionPublica'
import MarcadorPublico from './pages/MarcadorPublico'
import MesaTatamiPage from './pages/mesa/MesaTatamiPage'
import MesaBracketPage from './pages/mesa/MesaBracketPage'
import MesaKumitePage from './pages/mesa/MesaKumitePage'
import MesaTVPage from './pages/mesa/MesaTVPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PendingPage from './pages/auth/PendingPage'
import AdminPage from './pages/admin/AdminPage'
import AuthGuard from './components/auth/AuthGuard'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — sin protección */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/pendiente" element={<PendingPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <AuthGuard requireAdmin>
            <AdminPage />
          </AuthGuard>
        } />

        {/* Rutas protegidas del organizador */}
        <Route path="/" element={
          <AuthGuard>
            <TorneosPage />
          </AuthGuard>
        } />
        <Route path="/torneos/nuevo" element={
          <AuthGuard>
            <NuevoTorneo />
          </AuthGuard>
        } />
        <Route path="/torneo/:id" element={
          <AuthGuard>
            <TorneoLayout />
          </AuthGuard>
        }>
          <Route index element={<TorneoDashboard />} />
          <Route path="dojos" element={<DojosPage />} />
          <Route path="competidores" element={<CompetidoresPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="categoria/:catId/bracket" element={<BracketPage />} />
          <Route path="marcador/:combateId/kumite" element={<KumiteMarcador />} />
          <Route path="marcador/:combateId/kata" element={<KataMarcador />} />
          <Route path="inscripciones" element={<InscripcionesPage />} />
        </Route>

        {/* Rutas públicas — sin login */}
        <Route path="/torneo/:id/marcador/:combateId/tv" element={<TvDisplay />} />
        <Route path="/inscripcion/:token" element={<InscripcionPublica />} />
        <Route path="/marcador/:token" element={<MarcadorPublico />} />

        {/* Mesa técnica — acceso por link, sin cuenta */}
        <Route path="/mesa/:token" element={<MesaTatamiPage />} />
        <Route path="/mesa/:token/categoria/:catId" element={<MesaBracketPage />} />
        <Route path="/mesa/:token/categoria/:catId/combate/:combateId" element={<MesaKumitePage />} />
        <Route path="/mesa/:token/categoria/:catId/tv" element={<MesaTVPage />} />
      </Routes>
    </BrowserRouter>
  )
}
