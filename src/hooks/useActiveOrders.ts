import { useEffect, useReducer, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  getActiveOrders,
  getOrderById,
  updateOrderStatus,
} from '../services/orders.service'
import type { KitchenOrder, KitchenStation, OrderStatus, ConnectionStatus } from '../types/app.types'
import { ACTIVE_ORDER_STATUSES, KITCHEN_NEXT_STATUS } from '../types/app.types'

// ─── Estado del reducer ───────────────────────────────────────────────────────

interface State {
  orders:     KitchenOrder[]
  loading:    boolean
  error:      string | null
  connection: ConnectionStatus
}

type Action =
  | { type: 'LOADED';        payload: KitchenOrder[] }
  | { type: 'LOAD_ERROR';    payload: string }
  | { type: 'ORDER_ADDED';   payload: KitchenOrder }
  | { type: 'ORDER_UPDATED'; payload: KitchenOrder }
  | { type: 'ORDER_REMOVED'; payload: string }       // orderId
  | { type: 'CONNECTION';    payload: ConnectionStatus }

const initialState: State = {
  orders:     [],
  loading:    true,
  error:      null,
  connection: 'connecting',
}

function ordersByDate(a: KitchenOrder, b: KitchenOrder) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADED':
      return { ...state, orders: action.payload, loading: false, error: null }

    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'ORDER_ADDED': {
      // Guard: evitar duplicados si el fetch inicial ya incluyó esta orden
      if (state.orders.some(o => o.id === action.payload.id)) return state
      return {
        ...state,
        orders: [...state.orders, action.payload].sort(ordersByDate),
      }
    }

    case 'ORDER_UPDATED': {
      const updated = state.orders.map(o =>
        o.id === action.payload.id ? action.payload : o
      )
      // Si el nuevo status ya no es activo, filtrar de la lista
      const filtered = updated.filter(o =>
        ACTIVE_ORDER_STATUSES.includes(o.status as OrderStatus)
      )
      return { ...state, orders: filtered }
    }

    case 'ORDER_REMOVED':
      return { ...state, orders: state.orders.filter(o => o.id !== action.payload) }

    case 'CONNECTION':
      return { ...state, connection: action.payload }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActiveOrders(station?: KitchenStation) {
  const [state, dispatch]           = useReducer(reducer, initialState)
  const [advancingId, setAdvancing] = useState<string | null>(null)

  // Ref para evitar dispatches después de desmontar el componente
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    // Nombre de canal único por estación para evitar colisiones entre pestañas
    const channelName = station ? `kitchen-${station}` : 'kitchen-all'

    // ── 1. Suscripción Realtime (primero, para no perder eventos durante el fetch)
    const channel = supabase
      .channel(channelName)

      // Nuevas órdenes creadas por el POS
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          if (!mounted.current) return
          const row = payload.new as { id: string; status: string }

          // Ignorar si no es un estado activo (edge case: orden creada ya cerrada)
          if (!ACTIVE_ORDER_STATUSES.includes(row.status as OrderStatus)) return

          // Hidratar con joins antes de agregar al estado
          const full = await getOrderById(row.id)
          if (!full) {
            if (mounted.current) {
              console.error(
                `[KDS] INSERT recibido para orden ${row.id} pero getOrderById retornó null. ` +
                'La orden no aparecerá en el KDS. Verificar RLS y conexión.'
              )
            }
            return
          }
          if (!mounted.current) return
          // Filtrar por estación si aplica
          if (station && full.kitchen_station !== station) return
          dispatch({ type: 'ORDER_ADDED', payload: full })
        }
      )

      // Cambios de estado (kitchen avanza, cashier cierra)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          if (!mounted.current) return
          const row = payload.new as { id: string; status: string }

          // Si pasó a un estado inactivo (delivered/closed/cancelled), quitar del KDS
          if (!ACTIVE_ORDER_STATUSES.includes(row.status as OrderStatus)) {
            dispatch({ type: 'ORDER_REMOVED', payload: row.id })
            return
          }

          // Si sigue activo, actualizar la tarjeta con datos frescos
          const full = await getOrderById(row.id)
          if (!full || !mounted.current) return
          // Si la estación no coincide (caso raro), quitar
          if (station && full.kitchen_station !== station) {
            dispatch({ type: 'ORDER_REMOVED', payload: row.id })
            return
          }
          dispatch({ type: 'ORDER_UPDATED', payload: full })
        }
      )

      // Estado de la suscripción
      .subscribe((status) => {
        if (!mounted.current) return
        if (status === 'SUBSCRIBED') {
          dispatch({ type: 'CONNECTION', payload: 'connected' })
        } else if (
          status === 'TIMED_OUT' ||
          status === 'CLOSED' ||
          status === 'CHANNEL_ERROR'
        ) {
          dispatch({ type: 'CONNECTION', payload: 'disconnected' })
        }
      })

    // ── 2. Fetch inicial de órdenes activas (filtrado por estación)
    getActiveOrders(station)
      .then((orders) => {
        if (mounted.current) dispatch({ type: 'LOADED', payload: orders })
      })
      .catch((err: Error) => {
        if (mounted.current) dispatch({ type: 'LOAD_ERROR', payload: err.message })
      })

    // ── Cleanup: remover canal al desmontar o cambiar estación
    return () => {
      mounted.current = false
      supabase.removeChannel(channel)
    }
  }, [station])

  // ── Polling de respaldo cada 30 segundos ─────────────────────────────────
  // Si Realtime falla o se desconecta, los datos se refrescan periódicamente.
  // Corre en paralelo con Realtime — no lo reemplaza, lo complementa.
  useEffect(() => {
    const id = setInterval(() => {
      if (!mounted.current) return
      getActiveOrders(station)
        .then((orders) => {
          if (mounted.current) dispatch({ type: 'LOADED', payload: orders })
        })
        .catch(() => {
          // Error de polling ignorado silenciosamente — Realtime es el canal primario.
          // Si ambos fallan, el usuario verá los datos del último fetch exitoso.
        })
    }, 30_000)

    return () => clearInterval(id)
  }, [station])

  // ── Avanzar estado con optimistic update ─────────────────────────────────

  async function advanceStatus(orderId: string, currentStatus: OrderStatus) {
    const nextStatus = KITCHEN_NEXT_STATUS[currentStatus]
    if (!nextStatus || advancingId) return  // sin transición disponible o ya hay una en curso

    const order = state.orders.find(o => o.id === orderId)
    if (!order) return

    setAdvancing(orderId)

    // Actualización optimista: UI responde de inmediato
    dispatch({ type: 'ORDER_UPDATED', payload: { ...order, status: nextStatus } })

    try {
      await updateOrderStatus(orderId, nextStatus)
      // El evento Realtime confirmará el cambio y actualizará con datos frescos
    } catch (err) {
      // Revertir si el servidor rechazó el cambio
      console.error('Error al actualizar estado:', err)
      dispatch({ type: 'ORDER_UPDATED', payload: order })
    } finally {
      setAdvancing(null)
    }
  }

  return {
    orders:       state.orders,
    loading:      state.loading,
    error:        state.error,
    connection:   state.connection,
    advancingId,
    advanceStatus,
  }
}
