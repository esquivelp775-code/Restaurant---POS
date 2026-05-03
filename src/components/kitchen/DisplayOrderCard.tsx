import type { KitchenOrder } from '../../types/app.types'
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from '../../types/app.types'
import { INGREDIENT_LABELS } from '../../constants/menu'

// ─── Estilos por estado ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, {
  border:      string
  header:      string
  headerText:  string
  statusLabel: string
}> = {
  pending: {
    border:      'border-amber-400',
    header:      'bg-amber-400',
    headerText:  'text-amber-900',
    statusLabel: 'PENDIENTE',
  },
  preparing: {
    border:      'border-blue-400',
    header:      'bg-blue-500',
    headerText:  'text-white',
    statusLabel: 'PREPARANDO',
  },
  ready: {
    border:      'border-green-400',
    header:      'bg-green-500',
    headerText:  'text-white',
    statusLabel: 'LISTO',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Tarjeta de solo lectura para el display de cocina.
 * Sin botones de acción — pensada para pantallas no táctiles vistas a distancia.
 * Texto más grande para legibilidad a ~1.5m de distancia.
 */
export function DisplayOrderCard({ order }: { order: KitchenOrder }) {
  const styles  = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
  const elapsed = getElapsed(order.created_at)
  const folio   = order.id.slice(-6).toUpperCase()

  const elapsedColor = elapsed.urgent
    ? 'text-red-200 font-bold'
    : elapsed.warning
      ? 'text-amber-100 font-semibold'
      : 'text-white/70'

  return (
    <div className={`flex flex-col rounded-xl border-2 bg-white shadow-md overflow-hidden ${styles.border}`}>

      {/* ── Header ── */}
      <div className={`px-4 py-3 ${styles.header}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-black leading-tight truncate ${styles.headerText}`}>
              {order.customer_name}
            </p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SERVICE_TYPE_COLORS[order.service_type]}`}>
                {SERVICE_TYPE_LABELS[order.service_type]}
              </span>
              <span className={`text-xs font-bold ${styles.headerText} opacity-80`}>
                {styles.statusLabel}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-sm font-bold ${elapsedColor}`}>{elapsed.text}</div>
            <div className="text-xs font-mono text-white/60">#{folio}</div>
          </div>
        </div>
      </div>

      {/* ── Body: productos ── */}
      <div className="flex-1 px-4 py-3">
        <ul className="space-y-3">
          {order.order_items.map((item) => {
            const modLines = buildModLines(item)
            return (
              <li key={item.id}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-white">
                    {item.quantity}
                  </span>
                  <span className="text-base font-bold text-gray-800 leading-tight">
                    {item.menu_items.name}
                  </span>
                </div>
                {modLines.length > 0 && (
                  <ul className="ml-9 mt-1 space-y-0.5">
                    {modLines.map((line, i) => (
                      <li
                        key={i}
                        className={`text-sm font-semibold ${
                          line.startsWith('SIN') ? 'text-rose-300' : 'text-blue-600'
                        }`}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                {item.modifications?.notes && (
                  <p className="ml-9 mt-1 text-sm italic text-amber-700">
                    "{item.modifications.notes}"
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        {order.notes && (
          <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
            <p className="text-sm italic text-amber-800">
              <span className="not-italic font-semibold">Nota: </span>
              {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
