import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Bot, TrendingDown, Fuel, Leaf, Calendar } from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import { SkeletonChart } from '../components/LoadingSkeleton'
import forecastService from '../services/forecastService'
import { format, addDays } from 'date-fns'

// ============================================================
// Generate projection data
// ============================================================
const genProjection = (days) =>
  Array.from({ length: days }, (_, i) => ({
    date: format(addDays(new Date(), i), days > 30 ? 'MMM dd' : 'MMM dd'),
    scenarioA: +(3.5 + Math.random() * 1 + i * 0.01).toFixed(2),
    scenarioB: +(2.1 + Math.random() * 0.6 + i * 0.005).toFixed(2),
    fuelA: +(1.8 + Math.random() * 0.5 + i * 0.005).toFixed(2),
    fuelB: +(1.0 + Math.random() * 0.3 + i * 0.002).toFixed(2),
  }))

const genRadarScenario = () => [
  { subject: 'Emissions', A: 55, B: 88, fullMark: 100 },
  { subject: 'Fuel Eff.', A: 60, B: 85, fullMark: 100 },
  { subject: 'EcoScore', A: 62, B: 89, fullMark: 100 },
  { subject: 'Time Eff.', A: 75, B: 80, fullMark: 100 },
  { subject: 'Cost', A: 65, B: 82, fullMark: 100 },
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

const horizonOptions = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
]

const DigitalTwin = () => {
  const [horizon, setHorizon] = useState(30)
  const [activeScenario, setActiveScenario] = useState('B')
  const [loading, setLoading] = useState(false)
  const [forecast, setForecast] = useState(null)
  const [projData, setProjData] = useState(genProjection(30))
  const radarData = genRadarScenario()
  
  const [recommendations, setRecommendations] = useState([])
  const [comparisonText, setComparisonText] = useState('')

  useEffect(() => {
    setProjData(genProjection(horizon))
  }, [horizon])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await forecastService.getForecast(`${horizon}d`)
        setForecast(data)
      } catch {
        setForecast(null)
      } finally {
        setTimeout(() => setLoading(false), 500)
      }
    }
    fetch()
  }, [horizon])

  // Calculate summary savings
  const totalCO2A = projData.reduce((s, d) => s + d.scenarioA, 0)
  const totalCO2B = projData.reduce((s, d) => s + d.scenarioB, 0)
  const savedCO2 = (totalCO2A - totalCO2B).toFixed(1)
  const totalFuelA = projData.reduce((s, d) => s + d.fuelA, 0)
  const totalFuelB = projData.reduce((s, d) => s + d.fuelB, 0)
  const savedFuel = (totalFuelA - totalFuelB).toFixed(1)

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const data = await forecastService.getDigitalTwinAdvice({
          saved_co2: parseFloat(savedCO2),
          saved_fuel: parseFloat(savedFuel),
          horizon_days: horizon,
          avg_ecoscore: 78.0
        })
        setRecommendations(data.recommendations || [])
        setComparisonText(data.comparison || '')
      } catch (err) {
        console.warn("Failed to fetch digital twin AI advice:", err)
        setRecommendations([
          `Switch to the Greenest route for your morning commutes to save up to ${(savedCO2 / horizon).toFixed(2)} kg CO₂ daily.`,
          "Avoid high-congestion rush hours to reduce vehicle idling emissions by 28%.",
          "Consider carpooling or adopting an electric vehicle to cut carbon emissions by 40%.",
          "Adopt smooth eco-driving profiles to optimize fuel efficiency by up to 15%."
        ])
        setComparisonText(`By adopting optimized green routes, you are projected to reduce carbon emissions by ${savedCO2} kg and save ${savedFuel} litres of fuel over the next ${horizon} days.`)
      }
    }
    if (projData?.length > 0) {
      fetchAdvice()
    }
  }, [horizon, savedCO2, savedFuel])

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Cpu size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                Mobility <span className="gradient-text">Digital Twin</span>
              </h1>
              <p className="text-slate-500 text-sm">Simulate and compare future mobility scenarios</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Scenario Tabs */}
          <div className="flex rounded-xl p-1 bg-white/[0.04] border border-white/8">
            {[
              { id: 'A', label: 'Scenario A (Current)', color: '#EF4444' },
              { id: 'B', label: 'Scenario B (GreenRoute)', color: '#00D4AA' },
            ].map(({ id, label, color }) => (
              <button
                key={id}
                onClick={() => setActiveScenario(id)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all relative"
                style={{ color: activeScenario === id ? color : '#64748B' }}
              >
                {activeScenario === id && (
                  <motion.div
                    layoutId="scenario-tab"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: `${color}10`, border: `1px solid ${color}20` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>

          {/* Horizon Selector */}
          <div className="flex rounded-xl p-1 bg-white/[0.04] border border-white/8">
            {horizonOptions.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: horizon === days ? 'rgba(0,212,170,0.12)' : 'transparent',
                  color: horizon === days ? '#00D4AA' : '#64748B',
                  border: horizon === days ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Savings Summary */}
        <motion.div
          key={horizon}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <GlassCard className="p-5" glow>
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-200">
                Projected Savings in {horizon} Days
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'CO₂ Saved', val: `${savedCO2} kg`, color: '#00D4AA', icon: '🌿' },
                { label: 'Fuel Saved', val: `${savedFuel} L`, color: '#F59E0B', icon: '⛽' },
                { label: 'Cost Savings', val: `₹${(savedFuel * 95).toFixed(0)}`, color: '#22C55E', icon: '💰' },
                { label: 'EcoScore Gain', val: '+14 pts', color: '#00FF88', icon: '⭐' },
              ].map(({ label, val, color, icon }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-black" style={{ color }}>{val}</div>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* CO2 Projection */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Carbon Projection</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projData}>
                    <defs>
                      <linearGradient id="scAGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="scBGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 9 }} interval={Math.floor(projData.length / 5)} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="scenarioA" name="Current (kg)" stroke="#EF4444" fill="url(#scAGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="scenarioB" name="GreenRoute (kg)" stroke="#00D4AA" fill="url(#scBGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Fuel Projection */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Fuel Projection</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={projData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 9 }} interval={Math.floor(projData.length / 5)} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="fuelA" name="Current (L)" stroke="#EF4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fuelB" name="GreenRoute (L)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Radar + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Scenario Comparison Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 8 }} />
                    <Radar name="Current" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                    <Radar name="GreenRoute" dataKey="B" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ color: '#64748B', fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Gemini Recommendations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Bot size={14} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Behavioral Recommendations</h3>
              </div>
              {comparisonText && (
                <p className="text-xs text-slate-400 mb-4 italic leading-relaxed">
                  "{comparisonText}"
                </p>
              )}
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default DigitalTwin
