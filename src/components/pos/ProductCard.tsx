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
      className="flex w-full cursor-pointer flex-col rounded-xl border border-slate-700 bg-slate-800 p-4 text-left transition-all duration-150 hover:border-amber-400 hover:bg-slate-700 active:scale-95 min-h-[72px]"
    >
      <span className="mb-1.5 block text-sm font-semibold leading-tight text-slate-100">
        {product.name}
      </span>
      <span className="text-base font-bold text-amber-200">
        ${product.price}
      </span>
    </button>
  )
}
