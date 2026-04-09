import type { ServiceType } from '../../types/app.types'
import { SERVICE_TYPE_LABELS } from '../../types/app.types'

interface CustomerFormProps {
  customerName:    string
  serviceType:     ServiceType
  onNameChange:    (name: string) => void
  onServiceChange: (type: ServiceType) => void
}

export function CustomerForm({
  customerName,
  serviceType,
  onNameChange,
  onServiceChange,
}: CustomerFormProps) {
  return (
    <div className="space-y-3">
      {/* Nombre del cliente */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Nombre del cliente
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Juan, Mesa 3, Pedido 1..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Tipo de servicio */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tipo de servicio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['comer_aqui', 'para_llevar'] as ServiceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onServiceChange(type)}
              className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${
                serviceType === type
                  ? type === 'comer_aqui'
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-sky-400 bg-sky-50 text-sky-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {SERVICE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
