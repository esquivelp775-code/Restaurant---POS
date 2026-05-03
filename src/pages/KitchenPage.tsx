import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { KitchenBoard } from '../components/kitchen/KitchenBoard'
import { useActiveOrders } from '../hooks/useActiveOrders'
import type { KitchenStation } from '../types/app.types'
import { CONNECTION_CONFIG, KITCHEN_STATION_LABELS } from '../types/app.types'

const VALID_STATIONS: KitchenStation[] = ['station_1', 'station_2']

export default function KitchenPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const stationParam = searchParams.get('station') as KitchenStation | null
  const station = stationParam && VALID_STATIONS.includes(stationParam) ? stationParam : undefined

  const {
    orders,
    loading,
    error,
    connection,
    advancingId,
    advanceStatus,
  } = useActiveOrders(station)

  const conn = CONNECTION_CONFIG[connection]

  const orderCount = orders.length
  const orderLabel = orderCount === 1 ? '1 orden activa' : `${orderCount} órdenes activas`

  // Si no hay estación seleccionada, mostrar selector de estación
  if (!station) {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-4.5rem)] flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
            <p className="mt-1 text-sm text-gray-500">Selecciona la estación de cocina</p>
          </div>
          <div className="flex gap-4">
            {VALID_STATIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSearchParams({ station: st })}
                className="w-44 rounded-2xl bg-white px-6 py-8 text-center shadow-md ring-1 ring-gray-200 transition-all hover:ring-2 hover:ring-red-400 hover:shadow-lg active:scale-95"
              >
                <div className="text-4xl mb-3">🍳</div>
                <span className="text-base font-bold text-gray-800">
                  {KITCHEN_STATION_LABELS[st]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4.5rem)] flex-col">

        {/* ── Header ── */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Kitchen Display</h1>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                {KITCHEN_STATION_LABELS[station]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {loading ? 'Cargando órdenes...' : orderLabel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Cambiar estación */}
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cambiar estación
            </button>

            {/* Indicador de conexión Realtime */}
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-gray-200">
              <span className={`h-2.5 w-2.5 rounded-full ${conn.dot}`} />
              <span className="text-sm font-medium text-gray-600">{conn.label}</span>
            </div>
          </div>
        </div>

        {/* ── Error de carga ── */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            Error al cargar órdenes: {error}. Recarga la página si persiste.
          </div>
        )}

        {/* ── Aviso de reconexión ── */}
        {connection === 'disconnected' && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
            Conexión perdida. Reconectando automáticamente...
          </div>
        )}

        {/* ── Contenido principal ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
            </div>
          ) : (
            <KitchenBoard
              orders={orders}
              onAdvance={advanceStatus}
              advancingId={advancingId}
            />
          )}
        </div>

      </div>
    </AppLayout>
  )
}
