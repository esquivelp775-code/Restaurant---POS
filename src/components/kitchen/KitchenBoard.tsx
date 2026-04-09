import { OrderCard } from './OrderCard'
import type { KitchenOrder, OrderStatus } from '../../types/app.types'

interface KitchenBoardProps {
  orders:      KitchenOrder[]
  onAdvance:   (orderId: string, currentStatus: OrderStatus) => void
  advancingId: string | null
}

// Contador por estado para el resumen del header
function countByStatus(orders: KitchenOrder[]) {
  return orders.reduce<Record<string, number>>(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {}
  )
}

export function KitchenBoard({ orders, onAdvance, advancingId }: KitchenBoardProps) {
  // ── Estado vacío ─────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-base font-semibold text-gray-400">Sin órdenes activas</p>
          <p className="mt-1 text-sm text-gray-300">Las nuevas órdenes aparecerán aquí</p>
        </div>
      </div>
    )
  }

  const counts = countByStatus(orders)

  // ── Resumen de estados ────────────────────────────────────────────────────
  const summary = [
    { status: 'pending',   label: 'Pendientes',   color: 'bg-amber-100 text-amber-700'  },
    { status: 'preparing', label: 'En preparación', color: 'bg-blue-100 text-blue-700'  },
    { status: 'ready',     label: 'Listos',        color: 'bg-green-100 text-green-700' },
  ].filter(s => counts[s.status])

  return (
    <div className="flex flex-col gap-4">
      {/* Mini resumen de conteos */}
      {summary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.map(s => (
            <span
              key={s.status}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}
            >
              {counts[s.status]} {s.label}
            </span>
          ))}
        </div>
      )}

      {/*
        Grid auto-fill: las tarjetas tienen un ancho mínimo de 280px.
        En un monitor de 1920px caben ~6 tarjetas por fila.
        En una tablet horizontal caben 2-3.
        En vertical caben 1-2.
      */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAdvance={onAdvance}
            isAdvancing={advancingId === order.id}
          />
        ))}
      </div>
    </div>
  )
}
