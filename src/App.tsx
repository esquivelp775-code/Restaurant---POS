import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import LoginPage          from './pages/LoginPage'
import KitchenPage        from './pages/KitchenPage'
import KitchenDisplayPage from './pages/KitchenDisplayPage'
import KitchenControlPage from './pages/KitchenControlPage'
import POSPage            from './pages/POSPage'
import HistoryPage        from './pages/HistoryPage'
import ReportsPage        from './pages/ReportsPage'
import SettingsPage       from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Raíz → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Cashier + Admin */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <POSPage />
            </ProtectedRoute>
          }
        />

        {/* Kitchen: display dual (mini PC) */}
        <Route
          path="/kitchen/display"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
              <KitchenDisplayPage />
            </ProtectedRoute>
          }
        />

        {/* Kitchen: control móvil del cocinero */}
        <Route
          path="/kitchen/control"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
              <KitchenControlPage />
            </ProtectedRoute>
          }
        />

        {/* Kitchen: vista por estación con query param ?station= */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
              <KitchenPage />
            </ProtectedRoute>
          }
        />

        {/* Cashier + Admin */}
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
