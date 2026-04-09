// Tipos de la aplicación sincronizados con los enums de la DB.

export type UserRole       = 'cashier' | 'kitchen' | 'admin'
export type TableStatus   = 'available' | 'occupied' | 'requesting_bill'
export type OrderStatus   = 'pending' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
export type ServiceType   = 'comer_aqui' | 'para_llevar'
export type KitchenStation = 'station_1' | 'station_2'

export const KITCHEN_STATION_LABELS: Record<KitchenStation, string> = {
  station_1: 'Parrilla 1',
  station_2: 'Parrilla 2',
}

export interface Profile {
  id:         string
  full_name:  string
  role:       UserRole
  is_active:  boolean
  created_at: string
}

// Labels en español para mostrar en UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Pendiente',
  preparing: 'En preparación',
  ready:     'Listo',
  delivered: 'Entregada',
  closed:    'Cerrado',
  cancelled: 'Cancelado',
}

// Clases Tailwind para badges de estado de orden
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  ready:     'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-purple-100 text-purple-700 border-purple-200',
  closed:    'bg-gray-100 text-gray-500 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  comer_aqui:  'Comer aquí',
  para_llevar: 'Para llevar',
}

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  comer_aqui:  'bg-orange-100 text-orange-700',
  para_llevar: 'bg-sky-100 text-sky-700',
}

// Transiciones de estado que puede hacer cocina
// pending → preparing → ready → delivered (solo avanza, nunca retrocede)
export const KITCHEN_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

// Ruta de inicio según rol
export const ROLE_HOME: Record<UserRole, string> = {
  cashier: '/pos',
  kitchen: '/kitchen/control',
  admin:   '/pos',
}

// ─── Menú y personalización ───────────────────────────────────────────────────

// Ingredientes base de un producto (viene del JSONB en menu_items)
export interface BaseIngredients {
  groups:     string[]   // grupos removibles: ['verduras', 'aderezos']
  standalone: string[]   // items individuales: ['queso', 'champiñones', 'tocino']
}

// Producto del menú con datos de personalización
export interface MenuItem {
  id:               string
  name:             string
  price:            number
  is_available:     boolean
  sort_order:       number
  base_ingredients: BaseIngredients
}

// Categoría del menú con sus productos
export interface MenuCategory {
  id:         string
  name:       string
  sort_order: number
  menu_items: MenuItem[]
}

// ─── Personalización de un ítem en el carrito ─────────────────────────────────

export interface SelectedExtra {
  id:        string
  name:      string
  price:     number
  subchoice?: string  // para "ingrediente extra": 'champiñones' | 'piña'
}

export interface ItemModifications {
  removed_groups:    string[]        // ['verduras', 'aderezos'] → grupo completo quitado
  removed_subitems:  string[]        // ['cebolla', 'jitomate'] → sub-ingrediente quitado
  removed_standalone: string[]       // ['queso'] → ítem standalone quitado
  extras:            SelectedExtra[]
  notes:             string
}

// Ítem dentro del carrito (antes de enviarse)
export interface CartItem {
  local_id:      string   // crypto.randomUUID() — solo para React keys
  menu_item_id:  string
  name:          string
  base_price:    number
  extras_total:  number   // suma de precios de extras
  final_price:   number   // base_price + extras_total
  modifications: ItemModifications
}

// ─── KDS types ───────────────────────────────────────────────────────────────

export interface KitchenOrderItem {
  id:            string
  quantity:      number
  notes:         string | null
  modifications: ItemModifications
  menu_items:    { name: string }
}

export interface KitchenOrder {
  id:               string
  customer_name:    string
  service_type:     ServiceType
  status:           OrderStatus
  kitchen_station:  KitchenStation
  total:            number
  notes:            string | null
  created_at:       string
  updated_at:       string
  order_items:      KitchenOrderItem[]
}

// Órdenes que el KDS debe mostrar
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready']

// Estado de la suscripción Realtime
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export const CONNECTION_CONFIG: Record<ConnectionStatus, { dot: string; label: string }> = {
  connecting:   { dot: 'bg-yellow-400 animate-pulse', label: 'Conectando...' },
  connected:    { dot: 'bg-green-400',                label: 'En línea' },
  disconnected: { dot: 'bg-red-500',                  label: 'Sin conexión' },
}

// ─── Historial ────────────────────────────────────────────────────────────────

export interface HistoryOrderItem {
  id:            string
  quantity:      number
  unit_price:    number
  subtotal:      number
  notes:         string | null
  modifications: ItemModifications
  menu_items:    { name: string }
}

export interface HistoryOrder {
  id:               string
  customer_name:    string
  service_type:     ServiceType
  status:           OrderStatus
  kitchen_station:  KitchenStation
  total:            number
  notes:            string | null
  created_at:       string
  closed_at:        string | null
  order_items:      HistoryOrderItem[]
}
