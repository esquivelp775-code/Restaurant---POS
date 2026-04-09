import { supabase } from '../lib/supabase'
import type { OrderStatus, ServiceType, KitchenStation } from '../types/app.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawReportOrder {
  id:              string
  status:          OrderStatus
  service_type:    ServiceType
  kitchen_station: KitchenStation
  total:           number
  order_items: {
    menu_item_id: string
    quantity:     number
    subtotal:     number
    menu_items:   { name: string } | null
  }[]
}

export interface TopProduct {
  menu_item_id: string
  name:         string
  quantity:     number
  revenue:      number
}

export interface DayReport {
  orderCount:     number
  totalRevenue:   number   // suma de todos los pedidos (incl. activos)
  closedRevenue:  number   // suma solo de cerrados (cobrado)
  avgTicket:      number   // totalRevenue / orderCount
  deliveredCount: number
  byStatus:       Record<OrderStatus, number>
  byServiceType:  Record<ServiceType, { count: number; revenue: number }>
  byStation:      Record<KitchenStation, { count: number; revenue: number }>
  topProducts:    TopProduct[]
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getDayReport(date?: Date): Promise<DayReport> {
  const d = date ?? new Date()

  const startOfDay = new Date(d)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(d)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      service_type,
      kitchen_station,
      total,
      order_items (
        menu_item_id,
        quantity,
        subtotal,
        menu_items ( name )
      )
    `)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  if (error) throw new Error(error.message)

  const orders = (data ?? []) as unknown as RawReportOrder[]

  // ── Aggregate ───────────────────────────────────────────────────────────────

  const byStatus: Record<OrderStatus, number> = {
    pending: 0, preparing: 0, ready: 0, delivered: 0, closed: 0, cancelled: 0,
  }

  const byServiceType: Record<ServiceType, { count: number; revenue: number }> = {
    comer_aqui:  { count: 0, revenue: 0 },
    para_llevar: { count: 0, revenue: 0 },
  }

  const byStation: Record<KitchenStation, { count: number; revenue: number }> = {
    station_1: { count: 0, revenue: 0 },
    station_2: { count: 0, revenue: 0 },
  }

  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

  let totalRevenue  = 0
  let closedRevenue = 0

  for (const order of orders) {
    byStatus[order.status]++
    byServiceType[order.service_type].count++
    byServiceType[order.service_type].revenue += order.total
    byStation[order.kitchen_station].count++
    byStation[order.kitchen_station].revenue += order.total
    totalRevenue += order.total
    if (order.status === 'closed') closedRevenue += order.total

    for (const item of order.order_items) {
      const name = item.menu_items?.name ?? 'Producto eliminado'
      const existing = productMap.get(item.menu_item_id)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue  += item.subtotal
      } else {
        productMap.set(item.menu_item_id, {
          name,
          quantity: item.quantity,
          revenue:  item.subtotal,
        })
      }
    }
  }

  const topProducts: TopProduct[] = Array.from(productMap.entries())
    .map(([menu_item_id, v]) => ({ menu_item_id, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  return {
    orderCount:    orders.length,
    totalRevenue,
    closedRevenue,
    avgTicket:     orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    deliveredCount: byStatus.delivered,
    byStatus,
    byServiceType,
    byStation,
    topProducts,
  }
}
