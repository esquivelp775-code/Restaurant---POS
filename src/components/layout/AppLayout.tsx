import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/app.types'

interface NavLink {
  to:    string
  label: string
}

const NAV_LINKS: Record<UserRole, NavLink[]> = {
  cashier: [
    { to: '/pos',     label: 'POS' },
    { to: '/history', label: 'Historial' },
  ],
  kitchen: [
    { to: '/kitchen/control', label: 'Control' },
    { to: '/kitchen/display', label: 'Display' },
  ],
  admin: [
    { to: '/pos',             label: 'POS' },
    { to: '/kitchen/display', label: 'Display' },
    { to: '/kitchen/control', label: 'Control' },
    { to: '/history',         label: 'Historial' },
    { to: '/reports',         label: 'Reportes' },
    { to: '/settings',        label: 'Ajustes' },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  cashier: 'Cajero',
  kitchen: 'Cocina',
  admin:   'Admin',
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const links     = profile ? NAV_LINKS[profile.role] : []

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="flex items-center justify-between bg-gray-900 px-6 py-3 shadow-lg">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-orange-400">RestaurantOS</span>
          <div className="flex gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Usuario + Salir */}
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">
                {ROLE_LABELS[profile.role]}
              </span>
              <span className="text-sm text-gray-300">{profile.full_name}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  )
}
