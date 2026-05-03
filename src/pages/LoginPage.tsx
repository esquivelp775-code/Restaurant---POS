import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/app.types'
import { ROLE_HOME } from '../types/app.types'

export default function LoginPage() {
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.user) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    // Obtener perfil para saber a qué ruta redirigir.
    // Se usa select('*') para evitar problemas de inferencia de tipos
    // con column-selection en Supabase JS v2.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setError('No se pudo cargar el perfil. Contacta al administrador.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (!profile.is_active) {
      setError('Cuenta desactivada. Contacta al administrador.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    navigate(ROLE_HOME[profile.role as UserRole], { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-yellow-200">RestaurantOS</h1>
          <p className="mt-2 text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-gray-900 p-8 shadow-2xl ring-1 ring-gray-800"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 ring-1 ring-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="correo@restaurante.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-600 ring-1 ring-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-950 px-4 py-3 text-sm text-yellow-200 ring-1 ring-rose-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-300 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
