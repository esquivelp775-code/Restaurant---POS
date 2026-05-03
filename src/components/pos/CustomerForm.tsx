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
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Nombre del cliente
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Juan, Mesa 3, Pedido 1..."
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors duration-150"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tipo de servicio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['comer_aqui', 'para_llevar'] as ServiceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onServiceChange(type)}
              className={`cursor-pointer rounded-lg border-2 py-3 text-sm font-semibold transition-all duration-150 min-h-[44px] ${
                serviceType === type
                  ? type === 'comer_aqui'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300'
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
