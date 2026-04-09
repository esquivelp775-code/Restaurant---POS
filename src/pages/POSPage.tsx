import { useState, useEffect, useRef } from 'react'
type MobileView = 'menu' | 'cart'
import { AppLayout } from '../components/layout/AppLayout'
import { ProductCard } from '../components/pos/ProductCard'
import { CartPanel } from '../components/pos/CartPanel'
import { CustomizationModal } from '../components/pos/CustomizationModal'
import { useMenu } from '../hooks/useMenu'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../contexts/AuthContext'
import type { MenuItem } from '../types/app.types'

export default function POSPage() {
  const { profile }        = useAuth()
  const { categories, loading, error } = useMenu()
  const cart               = useCart()

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [customizingItem,  setCustomizingItem]   = useState<MenuItem | null>(null)
  const [orderSent,        setOrderSent]         = useState(false)
  const [mobileView,       setMobileView]        = useState<MobileView>('menu')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inicializar activeCategoryId con el ID real de la primera categoría cuando carguen.
  // Sin esto, activeCategoryId queda null aunque la primera categoría esté resaltada en UI.
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  // Limpiar el timer del toast si el componente se desmonta antes de que expire.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const activeCat = categories.find((c) => c.id === activeCategoryId) ?? categories[0]

  async function handleSubmit() {
    if (!profile?.id) return
    const ok = await cart.submitOrder(profile.id)
    if (ok) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setOrderSent(true)
      setMobileView('menu')  // volver al menú tras enviar
      toastTimerRef.current = setTimeout(() => setOrderSent(false), 2500)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-3 md:flex-row md:h-[calc(100vh-4.5rem)] md:gap-4">

        {/* ── Tabs móvil (solo visible en pantallas pequeñas) ── */}
        <div className="flex shrink-0 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView('menu')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mobileView === 'menu'
                ? 'bg-orange-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Menú
          </button>
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mobileView === 'cart'
                ? 'bg-orange-500 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Carrito{cart.itemCount > 0 ? ` (${cart.itemCount})` : ''}
          </button>
        </div>

        {/* ── Panel izquierdo: menú ── */}
        <div className={`${mobileView === 'cart' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200`}>

          {/* Tabs de categorías */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2">
            {loading ? (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
                <span className="text-sm text-gray-400">Cargando menú...</span>
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeCat?.id === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <p className="text-sm text-red-500">Error al cargar el menú: {error}</p>
            ) : activeCat ? (
              <>
                <h2 className="mb-3 text-base font-bold text-gray-700">
                  {activeCat.name}
                </h2>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {activeCat.menu_items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setCustomizingItem}
                    />
                  ))}
                  {activeCat.menu_items.length === 0 && (
                    <p className="col-span-3 text-sm text-gray-400">
                      Sin productos disponibles en esta categoría.
                    </p>
                  )}
                </div>
              </>
            ) : !loading ? (
              <p className="text-sm text-gray-400">Sin categorías disponibles.</p>
            ) : null}
          </div>
        </div>

        {/* ── Panel derecho: carrito ── */}
        {/* Wrapper controla visibilidad en móvil y ancho en desktop */}
        <div className={`${mobileView === 'menu' ? 'hidden md:block' : 'block'} w-full md:w-80 md:shrink-0 lg:w-96`}>
        <CartPanel
          customerName={cart.customerName}
          serviceType={cart.serviceType}
          kitchenStation={cart.kitchenStation}
          items={cart.items}
          total={cart.total}
          submitting={cart.submitting}
          submitError={cart.submitError}
          canSubmit={cart.canSubmit}
          onNameChange={cart.setCustomerName}
          onServiceChange={cart.setServiceType}
          onStationChange={cart.setKitchenStation}
          onRemoveItem={cart.removeItem}
          onSubmit={handleSubmit}
        />
        </div>
      </div>

      {/* ── Modal de personalización ── */}
      {customizingItem && (
        <CustomizationModal
          product={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(item) => {
            cart.addItem(item)
            setCustomizingItem(null)
          }}
        />
      )}

      {/* ── Toast de confirmación ── */}
      {orderSent && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg">
          ✓ Orden enviada a cocina
        </div>
      )}
    </AppLayout>
  )
}
