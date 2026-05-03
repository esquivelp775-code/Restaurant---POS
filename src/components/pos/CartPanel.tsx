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

function buildModLines(item: CartItem): string[] {
  const lines: string[] = []
  const mod = item.modifications
  mod.removed_groups.forEach((g)    => lines.push(`SIN ${g.charAt(0).toUpperCase() + g.slice(1)}`))
  mod.removed_subitems.forEach((s)  => lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`))
  mod.removed_standalone.forEach((s) => lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`))
  mod.extras.forEach((e) => {
    const sub = e.subchoice ? ` (${INGREDIENT_LABELS[e.subchoice] ?? e.subchoice})` : ''
    lines.push(`CON ${e.name}${sub}`)
  })
  if (mod.notes) lines.push(`"${mod.notes}"`)
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
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <CustomerForm
          customerName={customerName}
          serviceType={serviceType}
          onNameChange={onNameChange}
          onServiceChange={onServiceChange}
        />
      </div>

      {/* Estación de cocina */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Estación de cocina
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['station_1', 'station_2'] as KitchenStation[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStationChange(st)}
              className={`cursor-pointer rounded-lg border-2 py-3 text-sm font-semibold transition-all duration-150 min-h-[44px] ${
                kitchenStation === st
                  ? 'border-rose-300 bg-rose-300/10 text-yellow-200'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {KITCHEN_STATION_LABELS[st]}
            </button>
          ))}
        </div>
        {!kitchenStation && (
          <p className="mt-1.5 text-xs text-yellow-200">Selecciona una estación para continuar</p>
        )}
      </div>

      {/* Lista de ítems */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900">
        {items.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-slate-500">Selecciona productos del menú</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {items.map((item) => {
              const modLines = buildModLines(item)
              return (
                <li key={item.local_id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100 leading-tight">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-yellow-200">
                        ${item.final_price}
                      </span>
                    </div>
                    {modLines.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {modLines.map((line, i) => (
                          <li key={i} className="text-xs text-slate-400">{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.local_id)}
                    aria-label="Eliminar ítem"
                    className="mt-0.5 flex h-7 w-7 min-w-[28px] shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-rose-300/10 hover:text-yellow-200"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Total y botón */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        {submitError && (
          <div className="mb-3 rounded-lg bg-rose-300/10 px-3 py-2 text-xs text-yellow-200 ring-1 ring-rose-300/30">
            {submitError}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">Total</span>
          <span className="text-2xl font-bold text-slate-100">${total}</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full cursor-pointer rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-all duration-150 hover:bg-green-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 min-h-[48px]"
        >
          {submitting ? 'Enviando...' : 'Enviar a cocina'}
        </button>
      </div>
    </div>
  )
}
