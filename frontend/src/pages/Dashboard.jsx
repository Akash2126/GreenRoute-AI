import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Car, Leaf, Fuel, Star, TrendingDown, TrendingUp,
  Clock, Map, Activity, AlertCircle
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '../components/LoadingSkeleton'
import analyticsService from '../services/analyticsService'
import routeService from '../services/routeService'
import { format, subDays } from 'date-fns'

// ============================================================
// Generate demo data
// ============================================================
const genEmissionData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    co2: +(1.5 + Math.random() * 2).toFixed(2),
    fuel: +(0.8 + Math.random() * 1).toFixed(2),
    eco: Math.floor(65 + Math.random() * 25),
  }))

const genRadarData = () => [
  { subject: 'Distance', A: 78, fullMark: 100 },
  { subject: 'Emissions', A: 85, fullMark: 100 },
  { subject: 'Fuel Eff.', A: 72, fullMark: 100 },
  { subject: 'Time', A: 68, fullMark: 100 },
  { subject: 'Traffic', A: 80, fullMark: 100 },
]

const mockTrips = [
  { id: 1, from: 'Koramangala', to: 'Whitefield', date: '2025-06-11', distance: 14.2, co2: 2.1, ecoScore: 82, type: 'Greenest' },
  { id: 2, from: 'JP Nagar', to: 'MG Road', date: '2025-06-10', distance: 9.4, co2: 1.4, ecoScore: 78, type: 'Shortest' },
  { id: 3, from: 'Marathahalli', to: 'Electronic City', date: '2025-06-09', distance: 18.7, co2: 3.2, ecoScore: 65, type: 'Fastest' },
  { id: 4, from: 'Indiranagar', to: 'HSR Layout', date: '2025-06-08', distance: 7.1, co2: 1.0, ecoScore: 88, type: 'Greenest' },
  { id: 5, from: 'BTM Layout', to: 'Hebbal', date: '2025-06-07', distance: 22.3, co2: 3.8, ecoScore: 71, type: 'Fastest' },
]

// ============================================================
// KPI Card
// ============================================================
const KPICard = ({ icon: Icon, label, value, suffix, color, trend, trendVal, loading }) => {
  if (loading) return <SkeletonCard />
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <div className="text-2xl font-black" style={{ color }}>
            <AnimatedCounter value={value} suffix={suffix} decimals={value % 1 !== 0 ? 1 : 0} />
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      {trendVal !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend === 'up' ? (
            <TrendingUp size={12} className="text-emerald-400" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span className={trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
            {trendVal}
          </span>
          <span className="text-slate-500">vs last week</span>
        </div>
      )}
    </GlassCard>
  )
}

// ============================================================
// Custom Tooltip
// ============================================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Dashboard
// ============================================================
const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [emissionData] = useState(genEmissionData())
  const [radarData] = useState(genRadarData())
  const [trips, setTrips] = useState(mockTrips)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [ov, history] = await Promise.all([
          analyticsService.getOverview(),
          routeService.getHistory(),
        ])
        setOverview(ov)
        if (history?.length) setTrips(history)
      } catch {
        // Use demo data
        setOverview({
          total_trips: 142,
          co2_saved: 286.4,
          fuel_saved: 98.2,
          avg_eco_score: 79,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const kpis = [
    { icon: Car, label: 'Total Trips', value: overview?.total_trips || 142, suffix: '', color: '#3B82F6', trend: 'up', trendVal: '+12%' },
    { icon: Leaf, label: 'CO₂ Saved', value: overview?.co2_saved || 286.4, suffix: ' kg', color: '#00D4AA', trend: 'up', trendVal: '+8.3%' },
    { icon: Fuel, label: 'Fuel Saved', value: overview?.fuel_saved || 98.2, suffix: ' L', color: '#F59E0B', trend: 'up', trendVal: '+5.1%' },
    { icon: Star, label: 'Avg EcoScore', value: overview?.avg_eco_score || 79, suffix: '', color: '#00FF88', trend: 'up', trendVal: '+3 pts' },
  ]

  const typeColor = { Greenest: '#00D4AA', Fastest: '#3B82F6', Shortest: '#8B5CF6' }

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-slate-100">
            Dashboard <span className="gradient-text">Overview</span>
          </h1>
          <p className="text-slate-500 mt-1">Track your sustainability metrics and driving patterns.</p>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <KPICard {...kpi} loading={loading} />
            </motion.div>
          ))}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Emission AreaChart */}
          {loading ? (
            <SkeletonChart className="lg:col-span-2" height={220} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <GlassCard className="p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200">Emission Trend (30 Days)</h3>
                  <span className="text-xs text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5">CO₂ kg</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={emissionData}>
                    <defs>
                      <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} interval={6} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="co2" name="CO₂ (kg)" stroke="#00D4AA" fill="url(#co2Grad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* EcoScore Radar */}
          {loading ? (
            <SkeletonChart height={220} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-5 h-full">
                <h3 className="text-sm font-bold text-slate-200 mb-4">EcoScore Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 8 }} />
                    <Radar name="Score" dataKey="A" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Fuel Trend */}
          {loading ? (
            <SkeletonChart height={200} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Fuel Consumption (L/day)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={emissionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} interval={6} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="fuel" name="Fuel (L)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Traffic widget */}
          {loading ? (
            <SkeletonChart height={200} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Traffic Conditions (Live)</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Silk Board Junction', status: 'Heavy', pct: 85, color: '#EF4444' },
                    { label: 'KR Puram Bridge', status: 'Moderate', pct: 55, color: '#F59E0B' },
                    { label: 'Hebbal Flyover', status: 'Light', pct: 25, color: '#00D4AA' },
                    { label: 'Marathahalli', status: 'Moderate', pct: 60, color: '#F59E0B' },
                  ].map(({ label, status, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{label}</span>
                        <span style={{ color }} className="font-semibold">{status}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Recent Trips Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <GlassCard className="overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-bold text-slate-200">Recent Trips</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['From', 'To', 'Date', 'Distance', 'CO₂', 'EcoScore', 'Type'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip, i) => (
                      <motion.tr
                        key={trip.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 text-sm text-slate-300">{trip.from}</td>
                        <td className="px-5 py-3 text-sm text-slate-300">{trip.to}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{trip.date}</td>
                        <td className="px-5 py-3 text-sm text-slate-300">{trip.distance} km</td>
                        <td className="px-5 py-3 text-sm text-primary font-semibold">{trip.co2} kg</td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-bold" style={{ color: trip.ecoScore >= 75 ? '#00D4AA' : trip.ecoScore >= 60 ? '#22C55E' : '#EAB308' }}>
                            {trip.ecoScore}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${typeColor[trip.type] || '#64748B'}15`, color: typeColor[trip.type] || '#64748B' }}
                          >
                            {trip.type}
                          </span>
                        </td>
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

export default Dashboard
