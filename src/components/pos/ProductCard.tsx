import type { MenuItem } from '../../types/app.types'

interface ProductCardProps {
  product:  MenuItem
  onSelect: (product: MenuItem) => void
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md active:scale-95"
    >
      <span className="mb-1 block text-sm font-semibold leading-tight text-gray-800">
        {product.name}
      </span>
      <span className="text-base font-bold text-orange-500">
        ${product.price}
      </span>
    </button>
  )
}
