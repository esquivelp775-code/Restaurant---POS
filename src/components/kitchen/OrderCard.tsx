import type { KitchenOrder, OrderStatus } from '../../types/app.types'
import { KITCHEN_NEXT_STATUS, SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from '../../types/app.types'
import { INGREDIENT_LABELS } from '../../constants/menu'

interface OrderCardProps {
  order:       KitchenOrder
  onAdvance:   (orderId: string, currentStatus: OrderStatus) => void
  isAdvancing: boolean
}

const STATUS_STYLES: Record<string, {
  border:     string
  header:     string
  headerText: string
}> = {
  pending: {
    border:     'border-amber-500/60',
    header:     'bg-amber-500',
    headerText: 'text-amber-950',
  },
  preparing: {
    border:     'border-blue-500/60',
    header:     'bg-blue-600',
    headerText: 'text-white',
  },
  ready: {
    border:     'border-green-500/60',
    header:     'bg-green-600',
    headerText: 'text-white',
  },
}

const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  pending:   'Iniciar preparación',
  preparing: 'Marcar como listo',
  ready:     'Entregada',
}

const ADVANCE_COLORS: Partial<Record<OrderStatus, string>> = {
  pending:   'bg-blue-600 hover:bg-blue-500',
  preparing: 'bg-green-600 hover:bg-green-500',
  ready:     'bg-purple-600 hover:bg-purple-500',
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getElapsed(dateStr: string): { text: string; urgent: boolean; warning: boolean } {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  return {
    text:    mins < 1 ? '< 1 min' : `${mins} min`,
    warning: mins >= 5 && mins < 12,
    urgent:  mins >= 12,
  }
}

function buildModLines(item: KitchenOrder['order_items'][number]): string[] {
  const lines: string[] = []
  const mod = item.modifications
  if (!mod) return lines
  mod.removed_groups?.forEach((g)    => lines.push(`SIN ${g.charAt(0).toUpperCase() + g.slice(1)}`))
  mod.removed_subitems?.forEach((s)  => lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`))
  mod.removed_standalone?.forEach((s) => lines.push(`SIN ${INGREDIENT_LABELS[s] ?? s}`))
  mod.extras?.forEach((e) => {
    const sub = e.subchoice ? ` (${INGREDIENT_LABELS[e.subchoice] ?? e.subchoice})` : ''
    lines.push(`CON ${e.name}${sub}`)
  })
  return lines
}

export function OrderCard({ order, onAdvance, isAdvancing }: OrderCardProps) {
  const styles     = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
  const elapsed    = getElapsed(order.created_at)
  const nextStatus = KITCHEN_NEXT_STATUS[order.status as OrderStatus]
  const folio      = order.id.slice(-6).toUpperCase()

  const elapsedColor = elapsed.urgent
    ? 'text-red-200 font-bold'
    : elapsed.warning
      ? 'text-amber-100 font-semibold'
      : 'text-white/60'

  return (
    <div
      className={`
        flex flex-col rounded-xl border-2 bg-slate-900 shadow-lg overflow-hidden
        transition-shadow duration-150 hover:shadow-xl
        ${styles.border}
      `}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${styles.header}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-xl font-black leading-tight truncate ${styles.headerText}`}>
              {order.customer_name}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SERVICE_TYPE_COLORS[order.service_type]}`}>
              {SERVICE_TYPE_LABELS[order.service_type]}
            </span>
          </div>
          <div className="text-right text-xs shrink-0">
            <div className="font-medium text-white">{formatTime(order.created_at)}</div>
            <div className={elapsedColor}>{elapsed.text}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3">
        {order.order_items.length === 0 ? (
          <p className="text-xs italic text-slate-500">Sin ítems</p>
        ) : (
          <ul className="space-y-3">
            {order.order_items.map((item) => {
              const modLines = buildModLines(item)
              return (
                <li key={item.id}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200">
                      {item.quantity}
                    </span>
                    <span className="text-sm font-semibold text-slate-100 leading-tight">
                      {item.menu_items.name}
                    </span>
                  </div>

                  {modLines.length > 0 && (
                    <ul className="ml-8 mt-1 space-y-0.5">
                      {modLines.map((line, i) => (
                        <li
                          key={i}
                          className={`text-xs font-medium ${
                            line.startsWith('SIN')
                              ? 'text-rose-200'
                              : line.startsWith('CON')
                                ? 'text-blue-400'
                                : 'text-amber-400 italic'
                          }`}
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.modifications?.notes && (
                    <p className="ml-8 mt-1 text-xs italic text-amber-400">
                      "{item.modifications.notes}"
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {order.notes && (
          <div className="mt-3 rounded-md bg-amber-500/10 px-2.5 py-1.5 ring-1 ring-amber-500/30">
            <p className="text-xs italic text-amber-300">
              <span className="not-italic font-medium">Nota: </span>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-slate-600">#{folio}</span>

          {nextStatus ? (
            <button
              onClick={() => onAdvance(order.id, order.status as OrderStatus)}
              disabled={isAdvancing}
              className={`
                cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white min-h-[36px]
                transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
                ${ADVANCE_COLORS[order.status as OrderStatus] ?? 'bg-slate-600 hover:bg-slate-500'}
              `}
            >
              {isAdvancing ? 'Guardando...' : ADVANCE_LABELS[order.status as OrderStatus]}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
