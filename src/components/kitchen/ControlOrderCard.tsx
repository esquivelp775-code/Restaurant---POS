import type { KitchenOrder, OrderStatus } from '../../types/app.types'
import { KITCHEN_NEXT_STATUS, SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from '../../types/app.types'
import { INGREDIENT_LABELS } from '../../constants/menu'

// ─── Estilos y labels de acción ───────────────────────────────────────────────

const STATUS_BORDER: Record<string, string> = {
  pending:   'border-l-amber-400',
  preparing: 'border-l-blue-500',
  ready:     'border-l-green-500',
}

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  pending:   'Iniciar preparación',
  preparing: 'Marcar como listo',
  ready:     'Entregada ✓',
}

const ADVANCE_COLOR: Partial<Record<OrderStatus, string>> = {
  pending:   'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
  preparing: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
  ready:     'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getElapsed(dateStr: string): { text: string; urgent: boolean } {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  return {
    text:   mins < 1 ? '< 1 min' : `${mins} min`,
    urgent: mins >= 12,
  }
}

function buildModLines(item: KitchenOrder['order_items'][number]): string[] {
  const lines: string[] = []
  const mod = item.modifications
  if (!mod) return lines
  mod.removed_groups?.forEach((g) =>
    lines.push(`SIN ${g.charAt(0).toUpperCase() + g.slice(1)}`)
  )
  mod.removed_subitems?.forEach((s) =>
    lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`)
  )
  mod.removed_standalone?.forEach((s) =>
    lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`)
  )
  mod.extras?.forEach((e) => {
    const sub = e.subchoice ? ` (${INGREDIENT_LABELS[e.subchoice] ?? e.subchoice})` : ''
    lines.push(`CON ${e.name}${sub}`)
  })
  return lines
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface ControlOrderCardProps {
  order:       KitchenOrder
  onAdvance:   (orderId: string, currentStatus: OrderStatus) => void
  isAdvancing: boolean
}

/**
 * Tarjeta de control para el celular del cocinero.
 * Botones grandes y táctiles, toda la info relevante en pantalla pequeña.
 */
export function ControlOrderCard({ order, onAdvance, isAdvancing }: ControlOrderCardProps) {
  const nextStatus = KITCHEN_NEXT_STATUS[order.status as OrderStatus]
  const folio      = order.id.slice(-6).toUpperCase()
  const elapsed    = getElapsed(order.created_at)

  return (
    <div className={`rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden border-l-4 ${STATUS_BORDER[order.status] ?? 'border-l-gray-300'}`}>

      {/* ── Info ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-gray-800 leading-tight truncate">
              {order.customer_name}
            </p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SERVICE_TYPE_COLORS[order.service_type]}`}>
                {SERVICE_TYPE_LABELS[order.service_type]}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-mono text-gray-400">#{folio}</p>
            <p className={`text-sm font-semibold ${elapsed.urgent ? 'text-red-500' : 'text-gray-500'}`}>
              {elapsed.text}
            </p>
          </div>
        </div>

        {/* ── Productos ── */}
        <ul className="mt-3 space-y-2">
          {order.order_items.map((item) => {
            const modLines = buildModLines(item)
            return (
              <li key={item.id}>
                <div className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 leading-tight">
                    {item.menu_items.name}
                  </span>
                </div>
                {modLines.length > 0 && (
                  <ul className="ml-8 mt-0.5 space-y-0.5">
                    {modLines.map((line, i) => (
                      <li
                        key={i}
                        className={`text-xs font-medium ${
                          line.startsWith('SIN') ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        {order.notes && (
          <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs italic text-amber-700">
            Nota: {order.notes}
          </p>
        )}
      </div>

      {/* ── Botón de acción ── */}
      {nextStatus && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onAdvance(order.id, order.status as OrderStatus)}
            disabled={isAdvancing}
            className={`
              w-full rounded-xl py-3.5 text-sm font-bold text-white
              transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
              ${ADVANCE_COLOR[order.status as OrderStatus] ?? 'bg-gray-500 hover:bg-gray-600'}
            `}
          >
            {isAdvancing ? 'Guardando...' : ADVANCE_LABEL[order.status as OrderStatus]}
          </button>
        </div>
      )}
    </div>
  )
}
