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

  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

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
      setMobileView('menu')
      toastTimerRef.current = setTimeout(() => setOrderSent(false), 2500)
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-3 md:flex-row md:h-[calc(100vh-4.5rem)] md:gap-4">

        {/* Tabs móvil */}
        <div className="flex shrink-0 rounded-xl border border-slate-700 bg-slate-900 p-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView('menu')}
            className={`flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150 ${
              mobileView === 'menu'
                ? 'bg-amber-400 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Menú
          </button>
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className={`flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150 ${
              mobileView === 'cart'
                ? 'bg-amber-400 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Carrito{cart.itemCount > 0 ? ` (${cart.itemCount})` : ''}
          </button>
        </div>

        {/* Panel menú */}
        <div className={`${mobileView === 'cart' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900`}>

          {/* Tabs de categorías */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-700 px-3 py-2">
            {loading ? (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                <span className="text-sm text-slate-500">Cargando menú...</span>
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`cursor-pointer shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 min-h-[36px] ${
                    activeCat?.id === cat.id
                      ? 'bg-amber-400 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
              <p className="text-sm text-amber-300">Error al cargar el menú: {error}</p>
            ) : activeCat ? (
              <>
                <h2 className="mb-3 text-base font-bold text-slate-300">
                  {activeCat.name}
                </h2>
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                  {activeCat.menu_items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setCustomizingItem}
                    />
                  ))}
                  {activeCat.menu_items.length === 0 && (
                    <p className="col-span-3 text-sm text-slate-500">
                      Sin productos disponibles en esta categoría.
                    </p>
                  )}
                </div>
              </>
            ) : !loading ? (
              <p className="text-sm text-slate-500">Sin categorías disponibles.</p>
            ) : null}
          </div>
        </div>

        {/* Panel carrito */}
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

      {/* Modal de personalización */}
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

      {/* Toast de confirmación */}
      {orderSent && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40">
          Orden enviada a cocina
        </div>
      )}
    </AppLayout>
  )
}
