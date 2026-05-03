import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { getDayReport } from '../services/reports.service'
import type { DayReport } from '../services/reports.service'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  KITCHEN_STATION_LABELS,
} from '../types/app.types'
import type { OrderStatus } from '../types/app.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ring-1 ${accent ? 'bg-red-50 ring-red-200' : 'bg-white ring-gray-200'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </div>
  )
}

// ─── Status breakdown ─────────────────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered', 'closed', 'cancelled']

function StatusBreakdown({ byStatus }: { byStatus: DayReport['byStatus'] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
      {STATUS_ORDER.map((s) => (
        <div
          key={s}
          className={`rounded-xl border px-3 py-2.5 text-center ${ORDER_STATUS_COLORS[s]}`}
        >
          <p className="text-2xl font-bold">{byStatus[s]}</p>
          <p className="mt-0.5 text-xs font-medium">{ORDER_STATUS_LABELS[s]}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [report,  setReport]  = useState<DayReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [dateStr, setDateStr] = useState(todayStr)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDayReport(parseLocalDate(dateStr))
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => { load() }, [load])

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateStr}
              max={todayStr()}
              onChange={(e) => setDateStr(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? '...' : '↺'}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !report && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
          </div>
        )}

        {/* ── Content ── */}
        {report && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Ventas del día"
                value={`$${report.totalRevenue}`}
                sub="todas las órdenes"
                accent
              />
              <StatCard
                label="Cobrado"
                value={`$${report.closedRevenue}`}
                sub="órdenes cerradas"
              />
              <StatCard
                label="Total órdenes"
                value={report.orderCount}
              />
              <StatCard
                label="Ticket promedio"
                value={report.orderCount > 0 ? `$${report.avgTicket}` : '—'}
              />
            </div>

            {/* Status breakdown */}
            <SectionCard title="Por estado">
              <StatusBreakdown byStatus={report.byStatus} />
            </SectionCard>

            {/* Service type + Station */}
            <div className="grid gap-5 md:grid-cols-2">

              <SectionCard title="Por tipo de servicio">
                <div className="space-y-3">
                  {(['comer_aqui', 'para_llevar'] as const).map((st) => {
                    const d = report.byServiceType[st]
                    const pct = report.orderCount > 0
                      ? Math.round((d.count / report.orderCount) * 100)
                      : 0
                    return (
                      <div key={st}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{SERVICE_TYPE_LABELS[st]}</span>
                          <span className="text-gray-500">{d.count} órd · <span className="font-semibold text-gray-700">${d.revenue}</span></span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Por parrilla">
                <div className="space-y-3">
                  {(['station_1', 'station_2'] as const).map((st) => {
                    const d = report.byStation[st]
                    const pct = report.orderCount > 0
                      ? Math.round((d.count / report.orderCount) * 100)
                      : 0
                    return (
                      <div key={st}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{KITCHEN_STATION_LABELS[st]}</span>
                          <span className="text-gray-500">{d.count} órd · <span className="font-semibold text-gray-700">${d.revenue}</span></span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-blue-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Top products */}
            <SectionCard title="Productos más vendidos">
              {report.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400">Sin ventas registradas para este día.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left font-semibold text-gray-500">#</th>
                        <th className="pb-2 text-left font-semibold text-gray-500">Producto</th>
                        <th className="pb-2 text-right font-semibold text-gray-500">Cantidad</th>
                        <th className="pb-2 text-right font-semibold text-gray-500">Ingreso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report.topProducts.map((p, i) => (
                        <tr key={p.menu_item_id} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-3 text-gray-400">{i + 1}</td>
                          <td className="py-2.5 font-medium text-gray-800">{p.name}</td>
                          <td className="py-2.5 text-right text-gray-600">{p.quantity}</td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">${p.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </AppLayout>
  )
}
