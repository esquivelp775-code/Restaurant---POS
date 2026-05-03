import { useState, useEffect } from 'react'
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
  const [inverted, setInverted] = useState(() => localStorage.getItem('theme') === 'light')

  useEffect(() => {
    document.documentElement.style.filter = inverted ? 'invert(1) hue-rotate(180deg)' : ''
    localStorage.setItem('theme', inverted ? 'light' : 'dark')
  }, [inverted])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-amber-200">Mr. Nacho</span>
          <div className="flex gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-amber-400 text-white'
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
            onClick={() => setInverted(v => !v)}
            title={inverted ? 'Modo oscuro' : 'Modo claro'}
            className="cursor-pointer rounded-md px-2 py-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              {inverted
                ? <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 18V4a8 8 0 0 1 0 16Z"/>
                : <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd"/>
              }
            </svg>
          </button>
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
