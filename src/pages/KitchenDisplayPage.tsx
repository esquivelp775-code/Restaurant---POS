import { AppLayout } from '../components/layout/AppLayout'
import { DisplayOrderCard } from '../components/kitchen/DisplayOrderCard'
import { useActiveOrders } from '../hooks/useActiveOrders'
import type { KitchenStation } from '../types/app.types'
import { CONNECTION_CONFIG, KITCHEN_STATION_LABELS } from '../types/app.types'

// ─── Columna de una estación ──────────────────────────────────────────────────

function StationColumn({ station }: { station: KitchenStation }) {
  const { orders, loading, connection } = useActiveOrders(station)
  const conn = CONNECTION_CONFIG[connection]

  return (
    <div className="flex min-w-0 flex-1 flex-col">

      {/* Encabezado de columna */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          {KITCHEN_STATION_LABELS[station]}
        </h2>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${conn.dot}`} />
          <span className="text-xs text-gray-500">
            {loading
              ? 'Cargando...'
              : `${orders.length} orden${orders.length !== 1 ? 'es' : ''}`
            }
          </span>
        </div>
      </div>

      {/* Órdenes */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-rose-300" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-sm text-gray-400">Sin órdenes activas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <DisplayOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

/**
 * Vista de display dual para la mini PC.
 * Muestra Parrilla 1 y Parrilla 2 al mismo tiempo, sin botones de acción.
 * Las pantallas conectadas a la mini PC solo necesitan mostrar esta URL.
 */
export default function KitchenDisplayPage() {
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4.5rem)] gap-4">
        <StationColumn station="station_1" />
        <div className="w-px shrink-0 bg-gray-200" />
        <StationColumn station="station_2" />
      </div>
    </AppLayout>
  )
}
