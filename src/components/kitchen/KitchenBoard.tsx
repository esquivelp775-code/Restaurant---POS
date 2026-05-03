import { OrderCard } from './OrderCard'
import type { KitchenOrder, OrderStatus } from '../../types/app.types'

interface KitchenBoardProps {
  orders:      KitchenOrder[]
  onAdvance:   (orderId: string, currentStatus: OrderStatus) => void
  advancingId: string | null
}

function countByStatus(orders: KitchenOrder[]) {
  return orders.reduce<Record<string, number>>(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {}
  )
}

export function KitchenBoard({ orders, onAdvance, advancingId }: KitchenBoardProps) {
  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50">
        <div className="text-center">
          <svg viewBox="0 0 24 24" className="mx-auto mb-4 h-12 w-12 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5A2.25 2.25 0 0012.75 4.5h-1.5A2.25 2.25 0 009 6.75v1.5m3 9.75v-6m-3 6h6m2.25 0H5.625c-.621 0-1.125-.504-1.125-1.125V11.25c0-1.036.84-1.875 1.875-1.875h12.75c1.035 0 1.875.84 1.875 1.875v6.375c0 .621-.504 1.125-1.125 1.125z" />
          </svg>
          <p className="text-base font-semibold text-slate-500">Sin órdenes activas</p>
          <p className="mt-1 text-sm text-slate-600">Las nuevas órdenes aparecerán aquí</p>
        </div>
      </div>
    )
  }

  const counts = countByStatus(orders)

  const summary = [
    { status: 'pending',   label: 'Pendientes',    color: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30'  },
    { status: 'preparing', label: 'En preparación', color: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'    },
    { status: 'ready',     label: 'Listos',         color: 'bg-emerald-500/10 text-green-400 ring-1 ring-green-500/30' },
  ].filter(s => counts[s.status])

  return (
    <div className="flex flex-col gap-4">
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
