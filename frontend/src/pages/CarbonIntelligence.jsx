import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, TrendingDown, Calendar, BarChart2, Leaf, Fuel
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import EmissionTree from '../components/EmissionTree'
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton'
import analyticsService from '../services/analyticsService'
import { format, subDays } from 'date-fns'

// ============================================================
// Demo data generators
// ============================================================
const genDaily = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    co2: +(1.2 + Math.random() * 2.5).toFixed(2),
    baseline: +(3.5 + Math.random() * 0.8).toFixed(2),
    reduction: +(1.5 + Math.random() * 1.5).toFixed(2),
  }))

const genWeekly = () =>
  Array.from({ length: 12 }, (_, i) => ({
    date: `W${i + 1}`,
    co2: +(8 + Math.random() * 10).toFixed(2),
    baseline: +(22 + Math.random() * 5).toFixed(2),
    reduction: +(8 + Math.random() * 7).toFixed(2),
  }))

const vehiclePieData = [
  { name: 'Car (Petrol)', value: 52, color: '#F59E0B' },
  { name: 'Car (EV)', value: 18, color: '#00D4AA' },
  { name: 'Motorcycle', value: 15, color: '#8B5CF6' },
  { name: 'Bus', value: 10, color: '#3B82F6' },
  { name: 'Truck', value: 5, color: '#EF4444' },
]

const topRoutes = [
  { route: 'Koramangala → Whitefield', saved: 2.4, trips: 18 },
  { route: 'HSR Layout → MG Road', saved: 1.8, trips: 14 },
  { route: 'JP Nagar → Hebbal', saved: 3.1, trips: 22 },
  { route: 'BTM Layout → Airport', saved: 4.5, trips: 8 },
  { route: 'Indiranagar → Electronic City', saved: 2.9, trips: 11 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// CarbonIntelligence Page
// ============================================================
const CarbonIntelligence = () => {
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('daily')
  const [overview, setOverview] = useState(null)
  const dailyData = genDaily()
  const weeklyData = genWeekly()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await analyticsService.getCarbonIntelligence()
        setOverview(data)
      } catch {
        setOverview({
          daily_co2: 2.3,
          weekly_co2: 15.8,
          monthly_co2: 62.4,
          reduction_pct: 38.2,
          total_saved: 286.4,
          fuel_saved: 98.2,
        })
      } finally {
        setTimeout(() => setLoading(false), 600)
      }
    }
    fetch()
  }, [])

  const chartData = view === 'weekly' ? weeklyData : dailyData

  const kpis = [
    { label: 'Daily CO₂', value: overview?.daily_co2 || 2.3, suffix: ' kg', icon: '📅', color: '#00D4AA' },
    { label: 'Weekly CO₂', value: overview?.weekly_co2 || 15.8, suffix: ' kg', icon: '📆', color: '#3B82F6' },
    { label: 'Monthly CO₂', value: overview?.monthly_co2 || 62.4, suffix: ' kg', icon: '📊', color: '#8B5CF6' },
    { label: 'Reduction', value: overview?.reduction_pct || 38.2, suffix: '%', icon: '📉', color: '#00FF88' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                Carbon <span className="gradient-text">Intelligence</span>
              </h1>
              <p className="text-slate-500 text-sm">Detailed emission analytics and reduction tracking</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map(({ label, value, suffix, icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              {loading ? <SkeletonCard /> : (
                <GlassCard className="p-5">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-2xl font-black mb-1" style={{ color }}>
                    <AnimatedCounter value={value} suffix={suffix} decimals={1} />
                  </div>
                  <p className="text-xs text-slate-500">{label}</p>
                </GlassCard>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Emission Area */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200">Emissions vs Baseline</h3>
                  <div className="flex gap-1">
                    {['daily', 'weekly'].map(v => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="px-3 py-1 text-xs rounded-lg transition-all"
                        style={{
                          background: view === v ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
                          color: view === v ? '#00D4AA' : '#64748B',
                          border: `1px solid ${view === v ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="co2G" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="baseG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="baseline" name="Baseline (kg)" stroke="#EF4444" fill="url(#baseG)" strokeWidth={1.5} strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="co2" name="Your CO₂ (kg)" stroke="#00D4AA" fill="url(#co2G)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Reduction BarChart */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Daily Reduction (kg CO₂)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="reduction" name="Saved (kg)" fill="#00D4AA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Fuel Efficiency */}
          {loading ? <SkeletonChart height={200} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Fuel Efficiency (L/trip)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dailyData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="co2" name="CO₂ (kg)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Vehicle Pie */}
          {loading ? <SkeletonChart height={200} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Emission by Vehicle Type</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={vehiclePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {vehiclePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {vehiclePieData.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs text-slate-400">{name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Trees + Carbon Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Tree equivalent */}
          {loading ? <SkeletonChart height={160} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-2">Trees Equivalent Saved</h3>
                <p className="text-xs text-slate-500 mb-4">Your total CO₂ savings in tree absorption terms</p>
                <EmissionTree co2Saved={overview?.total_saved || 286.4} />
              </GlassCard>
            </motion.div>
          )}

          {/* Carbon budget */}
          {loading ? <SkeletonChart height={160} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Monthly Carbon Budget</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Used', used: 62.4, max: 100, color: '#3B82F6' },
                    { label: 'Saved vs Baseline', used: 38.2, max: 50, color: '#00D4AA' },
                    { label: 'Green Trip %', used: 68, max: 100, color: '#00FF88' },
                  ].map(({ label, used, max, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>{label}</span>
                        <span style={{ color }}>{used} / {max}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(used / max) * 100}%` }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Top Routes Table */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            <GlassCard className="overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-bold text-slate-200">Top Routes by Emission Savings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Route', 'CO₂ Saved (kg)', 'Trips', 'Avg per Trip'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topRoutes.map((r, i) => (
                      <motion.tr
                        key={r.route}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-slate-300">{r.route}</td>
                        <td className="px-5 py-3 text-primary font-bold text-sm">{r.saved} kg</td>
                        <td className="px-5 py-3 text-sm text-slate-400">{r.trips}</td>
                        <td className="px-5 py-3 text-sm text-slate-400">{(r.saved / r.trips).toFixed(2)} kg</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default CarbonIntelligence
