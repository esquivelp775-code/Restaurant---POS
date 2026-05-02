import { useState } from 'react'
import type { MenuItem, CartItem, SelectedExtra } from '../../types/app.types'
import {
  INGREDIENT_GROUPS,
  INGREDIENT_LABELS,
  EXTRAS,
  SUBCHOICE_LABELS,
} from '../../constants/menu'

interface CustomizationModalProps {
  product:     MenuItem
  onClose:     () => void
  onAddToCart: (item: CartItem) => void
}

export function CustomizationModal({
  product,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const { groups = [], standalone = [] } = product.base_ingredients

  const [removedGroups,     setRemovedGroups]     = useState<Set<string>>(new Set())
  const [removedSubitems,   setRemovedSubitems]   = useState<Set<string>>(new Set())
  const [removedStandalone, setRemovedStandalone] = useState<Set<string>>(new Set())
  const [selectedExtras,    setSelectedExtras]    = useState<SelectedExtra[]>([])
  const [notes,             setNotes]             = useState('')

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const finalPrice  = product.price + extrasTotal

  function toggleGroup(groupId: string) {
    const group     = INGREDIENT_GROUPS[groupId]
    const isRemoved = removedGroups.has(groupId)
    setRemovedGroups((prev) => {
      const next = new Set(prev)
      isRemoved ? next.delete(groupId) : next.add(groupId)
      return next
    })
    if (!isRemoved && group) {
      setRemovedSubitems((prev) => {
        const next = new Set(prev)
        group.items.forEach((item) => next.delete(item))
        return next
      })
    }
  }

  function toggleSubitem(groupId: string, subitem: string) {
    if (removedGroups.has(groupId)) return
    setRemovedSubitems((prev) => {
      const next = new Set(prev)
      next.has(subitem) ? next.delete(subitem) : next.add(subitem)
      return next
    })
  }

  function toggleStandalone(item: string) {
    setRemovedStandalone((prev) => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  function toggleExtra(extra: (typeof EXTRAS)[number]) {
    const exists = selectedExtras.find((e) => e.id === extra.id)
    if (exists) {
      setSelectedExtras((prev) => prev.filter((e) => e.id !== extra.id))
    } else {
      setSelectedExtras((prev) => [
        ...prev,
        {
          id:        extra.id,
          name:      extra.name,
          price:     extra.price,
          subchoice: extra.subchoices.length > 0 ? extra.subchoices[0] : undefined,
        },
      ])
    }
  }

  function setExtraSubchoice(extraId: string, subchoice: string) {
    setSelectedExtras((prev) =>
      prev.map((e) => (e.id === extraId ? { ...e, subchoice } : e))
    )
  }

  function handleAddToCart() {
    const item: CartItem = {
      local_id:      crypto.randomUUID(),
      menu_item_id:  product.id,
      name:          product.name,
      base_price:    product.price,
      extras_total:  extrasTotal,
      final_price:   finalPrice,
      modifications: {
        removed_groups:    Array.from(removedGroups),
        removed_subitems:  Array.from(removedSubitems),
        removed_standalone: Array.from(removedStandalone),
        extras:            selectedExtras,
        notes:             notes.trim(),
      },
    }
    onAddToCart(item)
  }

  const hasCustomizations =
    removedGroups.size > 0    ||
    removedSubitems.size > 0  ||
    removedStandalone.size > 0 ||
    selectedExtras.length > 0 ||
    groups.length > 0         ||
    standalone.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">{product.name}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              <span className="text-slate-500">Base:</span>
              <span className="font-medium text-slate-300">${product.price}</span>
              {extrasTotal > 0 && (
                <>
                  <span className="text-slate-600">+</span>
                  <span className="text-orange-400">+${extrasTotal} extras</span>
                </>
              )}
              <span className="ml-1 font-bold text-orange-400">=&nbsp;${finalPrice}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Quitar ingredientes */}
          {hasCustomizations && (groups.length > 0 || standalone.length > 0) && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Quitar ingredientes
              </h3>

              <div className="space-y-3">
                {groups.map((groupId) => {
                  const group     = INGREDIENT_GROUPS[groupId]
                  if (!group) return null
                  const isRemoved = removedGroups.has(groupId)

                  return (
                    <div key={groupId} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupId)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors duration-150 min-h-[36px] ${
                          isRemoved
                            ? 'bg-red-500/10 text-red-400'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{group.label}</span>
                        <span className="text-xs font-normal text-slate-500">
                          {isRemoved ? 'toca para restaurar' : 'toca para quitar todo'}
                        </span>
                      </button>

                      {!isRemoved && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-2">
                          {group.items.map((subitem) => {
                            const isSubRemoved = removedSubitems.has(subitem)
                            return (
                              <button
                                key={subitem}
                                type="button"
                                onClick={() => toggleSubitem(groupId, subitem)}
                                className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 min-h-[28px] ${
                                  isSubRemoved
                                    ? 'border-red-500/40 bg-red-500/10 text-red-400 line-through'
                                    : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {INGREDIENT_LABELS[subitem] ?? subitem}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {standalone.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {standalone.map((item) => {
                      const isRemoved = removedStandalone.has(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleStandalone(item)}
                          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 min-h-[36px] ${
                            isRemoved
                              ? 'border-red-500/40 bg-red-500/10 text-red-400 line-through'
                              : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {INGREDIENT_LABELS[item] ?? item}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Extras */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Extras
            </h3>
            <div className="space-y-2">
              {EXTRAS.map((extra) => {
                const selected = selectedExtras.find((e) => e.id === extra.id)
                const isActive = Boolean(selected)

                return (
                  <div key={extra.id}>
                    <button
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-150 min-h-[44px] ${
                        isActive
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                          : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span>{extra.name}</span>
                      <span className={`font-semibold ${isActive ? 'text-orange-400' : 'text-slate-500'}`}>
                        +${extra.price}
                      </span>
                    </button>

                    {isActive && extra.subchoices.length > 0 && (
                      <div className="mt-1.5 ml-3 flex gap-2">
                        {extra.subchoices.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setExtraSubchoice(extra.id, choice)}
                            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                              selected?.subchoice === choice
                                ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {SUBCHOICE_LABELS[choice] ?? choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Notas libres */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Nota del ítem
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: bien cocida, término medio..."
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors duration-150"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-700 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-slate-600 py-3 text-sm font-semibold text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-200 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 cursor-pointer rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-orange-400 active:scale-95 min-h-[44px]"
          >
            Agregar — ${finalPrice}
          </button>
        </div>
      </div>
    </div>
  )
}
