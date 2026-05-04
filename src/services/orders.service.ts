import { supabase } from '../lib/supabase'
import type { Json } from '../types/database.types'
import type {
  KitchenOrder,
  KitchenStation,
  OrderStatus,
  ServiceType,
  CartItem,
  HistoryOrder,
} from '../types/app.types'
import { ACTIVE_ORDER_STATUSES } from '../types/app.types'

// ─── KDS queries ──────────────────────────────────────────────────────────────

const KITCHEN_SELECT = `
  id,
  customer_name,
  service_type,
  status,
  kitchen_station,
  total,
  notes,
  created_at,
  updated_at,
  order_items (
    id,
    quantity,
    notes,
    modifications,
    menu_items ( name )
  )
` as const

export async function getActiveOrders(station?: KitchenStation): Promise<KitchenOrder[]> {
  let query = supabase
    .from('orders')
    .select(KITCHEN_SELECT)
    .in('status', ACTIVE_ORDER_STATUSES)
    .order('created_at', { ascending: true })

  if (station) {
    query = query.eq('kitchen_station', station)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as KitchenOrder[]
}

export async function getOrderById(orderId: string): Promise<KitchenOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(KITCHEN_SELECT)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as KitchenOrder
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) throw new Error(error.message)
}

// ─── POS: crear orden ─────────────────────────────────────────────────────────

interface CreateOrderParams {
  customer_name:   string
  service_type:    ServiceType
  kitchen_station: KitchenStation
  cashier_id:      string
  items:           CartItem[]
  notes?:          string
}

/**
 * Crea la orden y sus ítems en una sola operación.
 * Retorna el ID de la orden creada.
 */
export async function createAndSendOrder(
  params: CreateOrderParams,
): Promise<string> {
  const total = params.items.reduce((sum, item) => sum + item.final_price, 0)

  // 1. Insertar la orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name:   params.customer_name,
      service_type:    params.service_type,
      kitchen_station: params.kitchen_station,
      cashier_id:      params.cashier_id,
      status:          'pending',
      total,
      notes:           params.notes ?? null,
      table_id:        null,
    })
    .select('id')
    .single()

  if (orderError || !order) throw new Error(orderError?.message ?? 'Error al crear la orden')

  // 2. Insertar los ítems con sus modificaciones
  const orderItems = params.items.map((item) => ({
    order_id:      order.id,
    menu_item_id:  item.menu_item_id,
    quantity:      1,
    unit_price:    item.base_price,
    subtotal:      item.final_price,
    modifications: item.modifications as unknown as Json,
    notes:         item.modifications.notes || null,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Rollback: eliminar la orden creada para no dejar huérfanos en el KDS.
    // Si el DELETE también falla, la inconsistencia deberá resolverse manualmente
    // desde el historial (cambiar status a 'cancelled').
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(`Error al guardar los ítems: ${itemsError.message}`)
  }

  return order.id
}

// ─── Cierre de cuenta ─────────────────────────────────────────────────────────

export async function closeOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status:    'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) throw new Error(error.message)
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (error) throw new Error(error.message)
}

// ─── Historial ────────────────────────────────────────────────────────────────

const HISTORY_SELECT = `
  id,
  customer_name,
  service_type,
  status,
  kitchen_station,
  total,
  notes,
  created_at,
  closed_at,
  order_items (
    id,
    quantity,
    unit_price,
    subtotal,
    notes,
    modifications,
    menu_items ( name )
  )
` as const

export async function getDayOrders(
  statusFilter?: OrderStatus | null,
): Promise<HistoryOrder[]> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  let query = supabase
    .from('orders')
    .select(HISTORY_SELECT)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as HistoryOrder[]
}
