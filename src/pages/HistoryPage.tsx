import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { getDayOrders, closeOrder } from '../services/orders.service'
import { INGREDIENT_LABELS } from '../constants/menu'
import type {
  HistoryOrder,
  OrderStatus,
  ItemModifications,
} from '../types/app.types'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  KITCHEN_STATION_LABELS,
  ACTIVE_ORDER_STATUSES,
} from '../types/app.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function buildModSummary(mod: ItemModifications): string[] {
  const lines: string[] = []
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
    lines.push(`CON ${e.name}${sub} +$${e.price}`)
  })
  if (mod.notes) lines.push(`"${mod.notes}"`)
  return lines
}

// ─── Status filter buttons ────────────────────────────────────────────────────

const FILTER_OPTIONS: Array<{ value: OrderStatus | null; label: string }> = [
  { value: null,        label: 'Todas' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'preparing', label: 'En preparación' },
  { value: 'ready',     label: 'Listos' },
  { value: 'delivered', label: 'Entregadas' },
  { value: 'closed',    label: 'Cerradas' },
  { value: 'cancelled', label: 'Canceladas' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [orders,      setOrders]      = useState<HistoryOrder[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [filter,      setFilter]      = useState<OrderStatus | null>(null)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [closingId,   setClosingId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDayOrders(filter)
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleClose(orderId: string) {
    setClosingId(orderId)
    try {
      await closeOrder(orderId)
      await load()
    } catch (err) {
      console.error('Error al cerrar orden:', err)
    } finally {
      setClosingId(null)
    }
  }

  const totalDay = orders
    .filter((o) => o.status === 'closed')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">

        {/* ── Header ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historial del día</h1>
            <p className="text-sm text-gray-500">
              {orders.length} orden{orders.length !== 1 ? 'es' : ''}
              {totalDay > 0 && <span> · Cobrado: <span className="font-semibold text-green-600">${totalDay}</span></span>}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : '↺ Actualizar'}
          </button>
        </div>

        {/* ── Filtros de estado ── */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-amber-400 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* ── Lista de órdenes ── */}
        {loading && orders.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-amber-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-sm text-gray-400">Sin órdenes para este filtro</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id
              const isActive   = ACTIVE_ORDER_STATUSES.includes(order.status)

              return (
                <li
                  key={order.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
                >
                  {/* Fila principal */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Cliente y tipo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{order.customer_name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SERVICE_TYPE_COLORS[order.service_type]}`}>
                          {SERVICE_TYPE_LABELS[order.service_type]}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          {KITCHEN_STATION_LABELS[order.kitchen_station]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDateTime(order.created_at)}
                        {' · '}
                        {order.order_items.length} ítem{order.order_items.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Total y estado */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">${order.total}</p>
                      <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {/* Chevron */}
                    <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>

                  {/* Detalle expandible */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      {/* Ítems */}
                      <ul className="space-y-3">
                        {order.order_items.map((item) => {
                          const modLines = buildModSummary(item.modifications)
                          return (
                            <li key={item.id} className="text-sm">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-semibold text-gray-700">
                                  {item.quantity}× {item.menu_items.name}
                                </span>
                                <span className="text-gray-500">${item.subtotal}</span>
                              </div>
                              {modLines.length > 0 && (
                                <ul className="mt-1 space-y-0.5 pl-4">
                                  {modLines.map((line, i) => (
                                    <li
                                      key={i}
                                      className={`text-xs ${
                                        line.startsWith('SIN')
                                          ? 'text-amber-400'
                                          : line.startsWith('CON')
                                            ? 'text-blue-500'
                                            : 'italic text-gray-400'
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

                      {/* Nota de la orden */}
                      {order.notes && (
                        <p className="mt-3 text-xs italic text-gray-500">
                          Nota: {order.notes}
                        </p>
                      )}

                      {/* Botón cerrar cuenta */}
                      {isActive && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => handleClose(order.id)}
                            disabled={closingId === order.id}
                            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          >
                            {closingId === order.id ? 'Cerrando...' : 'Cerrar cuenta'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
