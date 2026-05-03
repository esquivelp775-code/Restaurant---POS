import { AppLayout } from '../components/layout/AppLayout'
import { ControlOrderCard } from '../components/kitchen/ControlOrderCard'
import { useActiveOrders } from '../hooks/useActiveOrders'
import type { KitchenStation } from '../types/app.types'
import { CONNECTION_CONFIG, KITCHEN_STATION_LABELS } from '../types/app.types'

// ─── Sección de una estación ──────────────────────────────────────────────────

function StationSection({ station }: { station: KitchenStation }) {
  const {
    orders,
    loading,
    error,
    connection,
    advancingId,
    advanceStatus,
  } = useActiveOrders(station)

  const conn = CONNECTION_CONFIG[connection]

  return (
    <div>
      {/* Encabezado de sección */}
      <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-800">
            {KITCHEN_STATION_LABELS[station]}
          </h2>
          {orders.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {orders.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${conn.dot}`} />
          <span className="text-xs text-gray-500">{conn.label}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-amber-400 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Órdenes */}
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-amber-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Sin órdenes activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <ControlOrderCard
              key={order.id}
              order={order}
              onAdvance={advanceStatus}
              isAdvancing={advancingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Panel de control de cocina para celular.
 * Muestra ambas estaciones con botones grandes para avanzar estados.
 * El cocinero usa esta vista en su celular para no depender de las pantallas.
 */
export default function KitchenControlPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4.5rem)] overflow-y-auto pb-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StationSection station="station_1" />
          <StationSection station="station_2" />
        </div>
      </div>
    </AppLayout>
  )
}
