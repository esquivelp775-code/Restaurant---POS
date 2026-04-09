import { supabase } from '../lib/supabase'
import type { MenuCategory } from '../types/app.types'

/**
 * Retorna todas las categorías activas con sus productos disponibles,
 * ordenadas por sort_order. Incluye base_ingredients para el modal.
 */
export async function getMenuCategories(): Promise<MenuCategory[]> {
  const { data, error } = await supabase
    .from('menu_categories')
    .select(`
      id,
      name,
      sort_order,
      menu_items (
        id,
        name,
        price,
        is_available,
        sort_order,
        base_ingredients
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((cat) => ({
    ...cat,
    menu_items: ((cat.menu_items as unknown as MenuCategory['menu_items']) ?? [])
      .filter((item) => item.is_available)
      .sort((a, b) => a.sort_order - b.sort_order),
  })) as MenuCategory[]
}
