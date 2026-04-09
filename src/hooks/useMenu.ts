import { useQuery } from '@tanstack/react-query'
import { getMenuCategories } from '../services/menu.service'

export function useMenu() {
  const { data, isLoading, error } = useQuery({
    queryKey:  ['menu-categories'],
    queryFn:   getMenuCategories,
    staleTime: 1000 * 60 * 10, // el menú no cambia frecuentemente
  })

  return {
    categories: data ?? [],
    loading:    isLoading,
    error:      error?.message ?? null,
  }
}
