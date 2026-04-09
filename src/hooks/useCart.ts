import { useState } from 'react'
import type { CartItem, KitchenStation, ServiceType } from '../types/app.types'
import { createAndSendOrder } from '../services/orders.service'

export function useCart() {
  const [customerName,    setCustomerName]    = useState('')
  const [serviceType,     setServiceType]     = useState<ServiceType>('para_llevar')
  const [kitchenStation,  setKitchenStation]  = useState<KitchenStation | null>(null)
  const [items,           setItems]           = useState<CartItem[]>([])
  const [submitting,      setSubmitting]      = useState(false)
  const [submitError,     setSubmitError]     = useState<string | null>(null)

  const total = items.reduce((sum, item) => sum + item.final_price, 0)

  function addItem(item: CartItem) {
    setItems((prev) => [...prev, item])
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((i) => i.local_id !== localId))
  }

  function clearCart() {
    setCustomerName('')
    setServiceType('para_llevar')
    setKitchenStation(null)
    setItems([])
    setSubmitError(null)
  }

  async function submitOrder(cashierId: string): Promise<boolean> {
    if (!customerName.trim() || items.length === 0 || !kitchenStation) return false

    setSubmitting(true)
    setSubmitError(null)

    try {
      await createAndSendOrder({
        customer_name:   customerName.trim(),
        service_type:    serviceType,
        kitchen_station: kitchenStation,
        cashier_id:      cashierId,
        items,
      })
      clearCart()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar la orden'
      setSubmitError(msg)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    // Estado
    customerName,
    serviceType,
    kitchenStation,
    items,
    total,
    submitting,
    submitError,

    // Acciones
    setCustomerName,
    setServiceType,
    setKitchenStation,
    addItem,
    removeItem,
    clearCart,
    submitOrder,

    // Derivados
    canSubmit: customerName.trim().length > 0 && items.length > 0 && kitchenStation !== null && !submitting,
    itemCount: items.length,
  }
}
