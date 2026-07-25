import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../stores/useAuthStore'

export default function AuthGuard({ children, requireAdmin = false }) {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuthStore()

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    if (!profile || profile.estado === 'pendiente' || profile.estado === 'rechazado') {
      navigate('/pendiente', { replace: true })
      return
    }

    if (requireAdmin && profile.role !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [user, profile, loading, navigate, requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || profile.estado !== 'activo') return null
  if (requireAdmin && profile.role !== 'admin') return null

  return children
}
