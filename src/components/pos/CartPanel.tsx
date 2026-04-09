import type { CartItem, KitchenStation, ServiceType } from '../../types/app.types'
import { KITCHEN_STATION_LABELS } from '../../types/app.types'
import { INGREDIENT_LABELS } from '../../constants/menu'
import { CustomerForm } from './CustomerForm'

interface CartPanelProps {
  customerName:     string
  serviceType:      ServiceType
  kitchenStation:   KitchenStation | null
  items:            CartItem[]
  total:            number
  submitting:       boolean
  submitError:      string | null
  canSubmit:        boolean
  onNameChange:     (name: string) => void
  onServiceChange:  (type: ServiceType) => void
  onStationChange:  (station: KitchenStation) => void
  onRemoveItem:     (localId: string) => void
  onSubmit:         () => void
}

// Convierte las modificaciones a líneas de texto para mostrar
function buildModLines(item: CartItem): string[] {
  const lines: string[] = []
  const mod = item.modifications

  mod.removed_groups.forEach((g) => {
    lines.push(`SIN ${g.charAt(0).toUpperCase() + g.slice(1)}`)
  })
  mod.removed_subitems.forEach((s) => {
    lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`)
  })
  mod.removed_standalone.forEach((s) => {
    lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`)
  })
  mod.extras.forEach((e) => {
    const sub = e.subchoice ? ` (${INGREDIENT_LABELS[e.subchoice] ?? e.subchoice})` : ''
    lines.push(`CON ${e.name}${sub}`)
  })
  if (mod.notes) {
    lines.push(`"${mod.notes}"`)
  }
  return lines
}

export function CartPanel({
  customerName,
  serviceType,
  kitchenStation,
  items,
  total,
  submitting,
  submitError,
  canSubmit,
  onNameChange,
  onServiceChange,
  onStationChange,
  onRemoveItem,
  onSubmit,
}: CartPanelProps) {
  return (
    <div className="flex w-full flex-col gap-3">

      {/* Formulario de cliente */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <CustomerForm
          customerName={customerName}
          serviceType={serviceType}
          onNameChange={onNameChange}
          onServiceChange={onServiceChange}
        />
      </div>

      {/* Selector de estación de cocina */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Estación de cocina
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['station_1', 'station_2'] as KitchenStation[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStationChange(st)}
              className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${
                kitchenStation === st
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {KITCHEN_STATION_LABELS[st]}
            </button>
          ))}
        </div>
        {!kitchenStation && (
          <p className="mt-1.5 text-xs text-red-500">Selecciona una estación para continuar</p>
        )}
      </div>

      {/* Lista de ítems */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {items.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-gray-400">Selecciona productos del menú</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const modLines = buildModLines(item)
              return (
                <li key={item.local_id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-800 leading-tight">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-orange-500">
                        ${item.final_price}
                      </span>
                    </div>
                    {modLines.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {modLines.map((line, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.local_id)}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Total y botón */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        {submitError && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
            {submitError}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-2xl font-bold text-gray-900">${total}</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Enviando...' : 'Enviar a cocina'}
        </button>
      </div>
    </div>
  )
}
