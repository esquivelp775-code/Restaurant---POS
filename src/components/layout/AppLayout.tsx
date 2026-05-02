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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-orange-400">Mr. Nacho</span>
          <div className="flex gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                {ROLE_LABELS[profile.role]}
              </span>
              <span className="text-sm text-slate-300">{profile.full_name}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-slate-500 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-300"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="p-5">{children}</main>
    </div>
  )
}
