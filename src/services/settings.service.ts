import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/app.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminMenuItem {
  id:           string
  category_id:  string
  name:         string
  price:        number
  is_available: boolean
  sort_order:   number
}

export interface AdminCategory {
  id:         string
  name:       string
  sort_order: number
  is_active:  boolean
  menu_items: AdminMenuItem[]
}

export interface AdminProfile {
  id:         string
  full_name:  string
  role:       UserRole
  is_active:  boolean
  created_at: string
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select(`
      id,
      name,
      sort_order,
      is_active,
      menu_items (
        id,
        category_id,
        name,
        price,
        is_available,
        sort_order
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((cat) => ({
    ...cat,
    menu_items: ((cat.menu_items as unknown as AdminMenuItem[]) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order),
  })) as AdminCategory[]
}

export async function updateCategory(
  id: string,
  updates: { name?: string; is_active?: boolean; sort_order?: number },
): Promise<void> {
  const { error } = await supabase
    .from('menu_categories')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export async function updateMenuItem(
  id: string,
  updates: {
    name?:         string
    price?:        number
    is_available?: boolean
    category_id?:  string
    sort_order?:   number
  },
): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminProfile[]
}

export async function updateProfile(
  id: string,
  updates: { role?: UserRole; is_active?: boolean },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}
