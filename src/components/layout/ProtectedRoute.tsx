import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/app.types'
import { ROLE_HOME } from '../../types/app.types'

interface ProtectedRouteProps {
  children:      React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Pantalla de carga mientras se resuelve la sesión
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-red-500" />
      </div>
    )
  }

  // Sin sesión → al login
  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  // Cuenta desactivada
  if (!profile.is_active) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Cuenta desactivada. Contacta al administrador.
        </p>
      </div>
    )
  }

  // Rol no autorizado para esta ruta → redirige a su home
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={ROLE_HOME[profile.role]} replace />
  }

  return <>{children}</>
}
