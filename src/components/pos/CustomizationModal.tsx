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

  // ── Estado de la personalización ─────────────────────────────────────────
  const [removedGroups,    setRemovedGroups]    = useState<Set<string>>(new Set())
  const [removedSubitems,  setRemovedSubitems]  = useState<Set<string>>(new Set())
  const [removedStandalone, setRemovedStandalone] = useState<Set<string>>(new Set())
  const [selectedExtras,   setSelectedExtras]   = useState<SelectedExtra[]>([])
  const [notes,            setNotes]            = useState('')

  // Precio en tiempo real
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0)
  const finalPrice  = product.price + extrasTotal

  // ── Helpers de estado ────────────────────────────────────────────────────

  function toggleGroup(groupId: string) {
    const group     = INGREDIENT_GROUPS[groupId]
    const isRemoved = removedGroups.has(groupId)

    setRemovedGroups((prev) => {
      const next = new Set(prev)
      isRemoved ? next.delete(groupId) : next.add(groupId)
      return next
    })

    // Si el grupo se quita, también quitar todos sus sub-ítems del set individual
    if (!isRemoved && group) {
      setRemovedSubitems((prev) => {
        const next = new Set(prev)
        group.items.forEach((item) => next.delete(item))
        return next
      })
    }
  }

  function toggleSubitem(groupId: string, subitem: string) {
    // Si el grupo entero estaba quitado, no se puede quitar un sub-ítem individualmente
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
      // Quitar el extra
      setSelectedExtras((prev) => prev.filter((e) => e.id !== extra.id))
    } else {
      // Agregar el extra (si tiene subchoices, agregar con la primera opción por defecto)
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

  // ── Agregar al carrito ────────────────────────────────────────────────────

  function handleAddToCart() {
    const item: CartItem = {
      local_id:     crypto.randomUUID(),
      menu_item_id: product.id,
      name:         product.name,
      base_price:   product.price,
      extras_total: extrasTotal,
      final_price:  finalPrice,
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

  // ── Render ────────────────────────────────────────────────────────────────

  const hasCustomizations =
    removedGroups.size > 0 ||
    removedSubitems.size > 0 ||
    removedStandalone.size > 0 ||
    selectedExtras.length > 0 ||
    groups.length > 0 ||
    standalone.length > 0

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">{product.name}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Base:</span>
              <span className="font-medium text-gray-700">${product.price}</span>
              {extrasTotal > 0 && (
                <>
                  <span className="text-gray-300">+</span>
                  <span className="text-orange-600">+${extrasTotal} extras</span>
                </>
              )}
              <span className="ml-1 font-bold text-orange-500">=&nbsp;${finalPrice}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Quitar ingredientes ── */}
          {hasCustomizations && (groups.length > 0 || standalone.length > 0) && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                Quitar ingredientes
              </h3>

              <div className="space-y-3">
                {/* Grupos (verduras, aderezos) */}
                {groups.map((groupId) => {
                  const group      = INGREDIENT_GROUPS[groupId]
                  if (!group) return null
                  const isRemoved  = removedGroups.has(groupId)

                  return (
                    <div key={groupId} className="rounded-xl border border-gray-200 p-3">
                      {/* Toggle del grupo completo */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupId)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm font-semibold transition-colors ${
                          isRemoved
                            ? 'bg-red-50 text-red-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>
                          {isRemoved ? '✕' : '✓'}&nbsp;{group.label}
                        </span>
                        {/* Label indica la ACCIÓN al hacer click, no el estado actual */}
                        <span className="text-xs font-normal text-gray-400">
                          {isRemoved ? 'toca para restaurar' : 'toca para quitar todo'}
                        </span>
                      </button>

                      {/* Sub-ítems (solo si el grupo no está quitado completo) */}
                      {!isRemoved && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pl-2">
                          {group.items.map((subitem) => {
                            const isSubRemoved = removedSubitems.has(subitem)
                            return (
                              <button
                                key={subitem}
                                type="button"
                                onClick={() => toggleSubitem(groupId, subitem)}
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  isSubRemoved
                                    ? 'border-red-200 bg-red-50 text-red-600 line-through'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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

                {/* Standalone items (queso, champiñones, etc.) */}
                {standalone.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {standalone.map((item) => {
                      const isRemoved = removedStandalone.has(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleStandalone(item)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            isRemoved
                              ? 'border-red-200 bg-red-50 text-red-600 line-through'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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

          {/* ── Extras ── */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              Extras
            </h3>
            <div className="space-y-2">
              {EXTRAS.map((extra) => {
                const selected  = selectedExtras.find((e) => e.id === extra.id)
                const isActive  = Boolean(selected)

                return (
                  <div key={extra.id}>
                    <button
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'border-orange-300 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>
                        {isActive ? '✓' : '+'}&nbsp;{extra.name}
                      </span>
                      <span className={`font-semibold ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                        +${extra.price}
                      </span>
                    </button>

                    {/* Subchoice para ingrediente extra */}
                    {isActive && extra.subchoices.length > 0 && (
                      <div className="mt-1.5 ml-3 flex gap-2">
                        {extra.subchoices.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setExtraSubchoice(extra.id, choice)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              selected?.subchoice === choice
                                ? 'border-orange-400 bg-orange-100 text-orange-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
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

          {/* ── Notas libres ── */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              Nota del ítem
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: bien cocida, término medio..."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 active:scale-95 transition-all"
          >
            Agregar — ${finalPrice}
          </button>
        </div>
      </div>
    </div>
  )
}
