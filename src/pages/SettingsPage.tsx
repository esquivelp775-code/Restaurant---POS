import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import {
  getAdminCategories,
  updateCategory,
  updateMenuItem,
  getProfiles,
  updateProfile,
} from '../services/settings.service'
import type { AdminCategory, AdminMenuItem, AdminProfile } from '../services/settings.service'
import type { UserRole } from '../types/app.types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'products' | 'users' | 'categories'

// ─── Shared ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-rose-300 ring-1 ring-red-200">
      {msg}
    </div>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)

  // Edit form state
  const [editName,       setEditName]       = useState('')
  const [editPrice,      setEditPrice]      = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await getAdminCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Flatten all items with their category name
  const allItems: (AdminMenuItem & { categoryName: string })[] = categories.flatMap((cat) =>
    cat.menu_items.map((item) => ({ ...item, categoryName: cat.name }))
  )

  function startEdit(item: AdminMenuItem & { categoryName: string }) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditPrice(String(item.price))
    setEditCategoryId(item.category_id)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    const price = parseFloat(editPrice)
    if (!editName.trim() || isNaN(price) || price < 0) return

    setSaving(true)
    try {
      await updateMenuItem(id, {
        name:        editName.trim(),
        price,
        category_id: editCategoryId,
      })
      await load()
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailable(item: AdminMenuItem) {
    try {
      await updateMenuItem(item.id, { is_available: !item.is_available })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-rose-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner msg={error} />}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">Producto</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">Categoría</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500">Precio</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500">Disponible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allItems.map((item) => {
              const isEditing = editingId === item.id
              return (
                <tr key={item.id} className={isEditing ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-red-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    ) : (
                      <span className={`font-medium ${item.is_available ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                        {item.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="rounded-lg border border-red-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500">{item.categoryName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPrice}
                        min="0"
                        step="1"
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 rounded-lg border border-red-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    ) : (
                      <span className="font-semibold text-gray-800">${item.price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={item.is_available}
                      onChange={() => toggleAvailable(item)}
                      disabled={isEditing}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          disabled={saving}
                          className="rounded-lg bg-rose-300 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-300 disabled:opacity-50"
                        >
                          {saving ? '...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {allItems.length === 0 && !loading && (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            Sin productos registrados.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'cashier', label: 'Cajero' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'admin',   label: 'Admin' },
]

function UsersTab() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProfiles(await getProfiles())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpdate(id: string, updates: { role?: UserRole; is_active?: boolean }) {
    setSavingId(id)
    try {
      await updateProfile(id, updates)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setSavingId(null)
    }
  }

  if (loading && profiles.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-rose-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner msg={error} />}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">Rol</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((p) => {
              const isSaving = savingId === p.id
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
                      {p.full_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      disabled={isSaving}
                      onChange={(e) => handleUpdate(p.id, { role: e.target.value as UserRole })}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={p.is_active}
                      onChange={(val) => handleUpdate(p.id, { is_active: val })}
                      disabled={isSaving}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {profiles.length === 0 && !loading && (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            Sin usuarios registrados.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [savingId,   setSavingId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await getAdminCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(cat: AdminCategory) {
    setSavingId(cat.id)
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar categoría')
    } finally {
      setSavingId(null)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-rose-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner msg={error} />}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">Categoría</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500">Productos</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => {
              const isSaving = savingId === cat.id
              return (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`font-medium ${cat.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                      {cat.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {cat.menu_items.length}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={cat.is_active}
                      onChange={() => toggleActive(cat)}
                      disabled={isSaving}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {categories.length === 0 && !loading && (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            Sin categorías registradas.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { value: Tab; label: string }[] = [
  { value: 'products',   label: 'Productos' },
  { value: 'users',      label: 'Usuarios' },
  { value: 'categories', label: 'Categorías' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('products')

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800">Ajustes</h1>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === t.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'products'   && <ProductsTab />}
        {tab === 'users'      && <UsersTab />}
        {tab === 'categories' && <CategoriesTab />}
      </div>
    </AppLayout>
  )
}
