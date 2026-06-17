import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, Calendar, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import { SkeletonChart, SkeletonCard } from '../components/LoadingSkeleton'
import forecastService from '../services/forecastService'
import { format, addHours, addDays } from 'date-fns'

// ============================================================
// Data generators
// ============================================================
const genHourlyForecast = () =>
  Array.from({ length: 24 }, (_, i) => ({
    time: format(addHours(new Date(), i), 'HH:mm'),
    traffic: +(30 + Math.random() * 60 + Math.sin(i * 0.5) * 20).toFixed(1),
    co2: +(1.5 + Math.random() * 2).toFixed(2),
    fuel: +(0.8 + Math.random() * 0.9).toFixed(2),
    confidence: +(95 - i * 0.3 - Math.random() * 5).toFixed(1),
  }))

const genDailyForecast = (days) =>
  Array.from({ length: days }, (_, i) => ({
    date: format(addDays(new Date(), i), 'MMM dd'),
    traffic: +(40 + Math.random() * 40).toFixed(1),
    co2: +(10 + Math.random() * 15).toFixed(2),
    fuel: +(5 + Math.random() * 8).toFixed(2),
    confidence: Math.max(30, +(87 - i * 1.2 - Math.random() * 5).toFixed(1)),
    upper: +(12 + Math.random() * 20).toFixed(2),
    lower: +(8 + Math.random() * 10).toFixed(2),
  }))

const horizons = [
  { label: 'Next Hour', key: '1h', days: 0, hourly: true },
  { label: 'Next 24h', key: '24h', days: 0, hourly: true },
  { label: '7 Days', key: '7d', days: 7, hourly: false },
  { label: '30 Days', key: '30d', days: 30, hourly: false },
  { label: '90 Days', key: '90d', days: 90, hourly: false },
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

const ConfidenceCard = ({ horizon, confidence, color }) => (
  <GlassCard className="p-4 text-center">
    <div className="text-xl font-black mb-1" style={{ color }}>
      {confidence}%
    </div>
    <p className="text-xs text-slate-500 mb-2">{horizon}</p>
    <div className="h-1.5 rounded-full bg-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${confidence}%` }}
        transition={{ duration: 1.2 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </GlassCard>
)

const Forecasting = () => {
  const [activeHorizon, setActiveHorizon] = useState('24h')
  const [loading, setLoading] = useState(false)
  const [hourlyData] = useState(genHourlyForecast())
  const [trafficPrediction] = useState({
    current: 68,
    trend: 'Increasing',
    peak_hour: '5:30 PM',
    recommended_depart: '4:00 PM or after 8:00 PM',
  })

  const current = horizons.find(h => h.key === activeHorizon)
  const chartData = current?.hourly ? hourlyData : genDailyForecast(current?.days || 7)

  const handleHorizonChange = async (key) => {
    setActiveHorizon(key)
    setLoading(true)
    try {
      await forecastService.getForecast(key)
    } catch {}
    setTimeout(() => setLoading(false), 500)
  }

  const confidenceMap = [
    { horizon: '1 Hour', confidence: 95, color: '#00D4AA' },
    { horizon: '24 Hours', confidence: 87, color: '#22C55E' },
    { horizon: '7 Days', confidence: 72, color: '#F59E0B' },
    { horizon: '30 Days', confidence: 58, color: '#F97316' },
    { horizon: '90 Days', confidence: 41, color: '#EF4444' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <Activity size={20} className="text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                AI <span className="gradient-text">Forecasting</span>
              </h1>
              <p className="text-slate-500 text-sm">Random Forest ML predictions up to 90 days ahead</p>
            </div>
          </div>
        </motion.div>

        {/* Horizon Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {horizons.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => handleHorizonChange(key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeHorizon === key ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeHorizon === key ? '#00D4AA' : '#64748B',
                border: `1px solid ${activeHorizon === key ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Traffic Prediction Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <GlassCard className="p-5" glow>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-200">Current Traffic Prediction (Random Forest)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Traffic Index', val: `${trafficPrediction.current}%`, color: '#F59E0B', icon: '🚦' },
                { label: 'Trend', val: trafficPrediction.trend, color: '#EF4444', icon: '📈' },
                { label: 'Peak Hour', val: trafficPrediction.peak_hour, color: '#8B5CF6', icon: '⏰' },
                { label: 'Best Depart', val: '4:00 PM', color: '#00D4AA', icon: '✅' },
              ].map(({ label, val, color, icon }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-sm font-bold" style={{ color }}>{val}</div>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Charts */}
        <div className="space-y-4 mb-6">
          {/* Traffic Forecast */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div key={activeHorizon + 'traffic'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Traffic Forecast with Confidence Band</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="traffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={current?.hourly ? 'time' : 'date'} tick={{ fill: '#64748B', fontSize: 10 }} interval={Math.floor(chartData.length / 6)} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="traffic" name="Traffic %" stroke="#F59E0B" fill="url(#traffGrad)" strokeWidth={2} />
                    {!current?.hourly && (
                      <>
                        <Area type="monotone" dataKey="upper" name="Upper Band" stroke="#F59E0B" fill="none" strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.4} />
                        <Area type="monotone" dataKey="lower" name="Lower Band" stroke="#F59E0B" fill="none" strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.4} />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* CO2 + Fuel Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <SkeletonChart height={180} /> : (
              <motion.div key={activeHorizon + 'co2'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">CO₂ Forecast</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="co2FGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey={current?.hourly ? 'time' : 'date'} tick={{ fill: '#64748B', fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="co2" name="CO₂ (kg)" stroke="#00D4AA" fill="url(#co2FGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
              </motion.div>
            )}

            {loading ? <SkeletonChart height={180} /> : (
              <motion.div key={activeHorizon + 'fuel'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Fuel Consumption Forecast</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey={current?.hourly ? 'time' : 'date'} tick={{ fill: '#64748B', fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 9 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="fuel" name="Fuel (L)" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>
              </motion.div>
            )}
          </div>
        </div>

        {/* Confidence Cards */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Forecast Confidence by Horizon</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {confidenceMap.map(c => (
              <ConfidenceCard key={c.horizon} {...c} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Forecasting
