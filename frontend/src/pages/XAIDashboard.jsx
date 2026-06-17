import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronRight, Info } from 'lucide-react'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import { SkeletonChart } from '../components/LoadingSkeleton'
import forecastService from '../services/forecastService'

// ============================================================
// Mock XAI data
// ============================================================
const trafficFactors = [
  { name: 'Time of Day', value: 42, color: '#00D4AA' },
  { name: 'Weather', value: 21, color: '#3B82F6' },
  { name: 'Day of Week', value: 20, color: '#8B5CF6' },
  { name: 'Distance', value: 17, color: '#F59E0B' },
]

const emissionFactors = [
  { name: 'Vehicle Type', value: 38, color: '#EF4444' },
  { name: 'Distance', value: 28, color: '#F59E0B' },
  { name: 'Speed Profile', value: 18, color: '#8B5CF6' },
  { name: 'Traffic', value: 16, color: '#3B82F6' },
]

const ecoScoreRadar = [
  { subject: 'Distance', score: 72, fullMark: 100 },
  { subject: 'Emissions', score: 85, fullMark: 100 },
  { subject: 'Fuel Eff.', score: 78, fullMark: 100 },
  { subject: 'Traffic', score: 65, fullMark: 100 },
  { subject: 'Time', score: 70, fullMark: 100 },
]

const reasoningChain = [
  { step: 1, icon: '📍', label: 'Route Analysis', desc: 'Analyzed 12.4 km route with 3 alternatives via OSM graph' },
  { step: 2, icon: '🚦', label: 'Traffic Check', desc: 'Detected heavy traffic on NH-44 (78%) — rerouted via ORR' },
  { step: 3, icon: '🌡️', label: 'Emission Calc', desc: 'Calculated 2.1 kg CO₂ using IPCC emission factors for petrol car' },
  { step: 4, icon: '⛽', label: 'Fuel Estimate', desc: 'Estimated 1.2 L fuel at 10.3 km/L efficiency for this route' },
  { step: 5, icon: '⭐', label: 'EcoScore', desc: 'Computed 82/100 EcoScore weighting emissions (40%), time (30%), fuel (30%)' },
  { step: 6, icon: '🌿', label: 'Recommendation', desc: 'Greenest route selected — 43% lower CO₂ vs fastest option' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-slate-400 mb-1">{label || payload[0]?.payload?.name}</p>
      {payload.map(p => (
        <div key={p.name} className="text-xs flex gap-2">
          <span style={{ color: p.color || p.fill }}>Importance:</span>
          <span className="font-bold text-slate-200">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

const XAIDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [xaiData, setXaiData] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [traffic, emission] = await Promise.all([
          forecastService.getXAITraffic(),
          forecastService.getXAIEmission(),
        ])
        setXaiData({ traffic, emission })
      } catch {
        setXaiData({ traffic: trafficFactors, emission: emissionFactors })
      } finally {
        setTimeout(() => setLoading(false), 600)
      }
    }
    fetch()
  }, [])

  const formulaVals = {
    distance: '12.4 km',
    vehicle: 'Petrol Car',
    factor: '0.17 kg/km',
    traffic: '1.0x',
    result: '2.1 kg CO₂',
  }

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Brain size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                Explainable <span className="gradient-text">AI Dashboard</span>
              </h1>
              <p className="text-slate-500 text-sm">Understand how the AI makes every prediction and recommendation</p>
            </div>
          </div>
        </motion.div>

        {/* Section 1: Traffic Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-1">Traffic Prediction Factors</h3>
                <p className="text-xs text-slate-500 mb-4">What drives traffic predictions?</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trafficFactors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 50]} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {trafficFactors.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Section 2: Emission Breakdown */}
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-1">Emission Calculation Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Per-route emission factor importance</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={emissionFactors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 50]} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {emissionFactors.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Formula */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-xs text-slate-500 mb-2 font-semibold">IPCC Formula</p>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    CO₂ = Distance × Emission_Factor × Traffic_Multiplier
                    <br />
                    = <span className="text-primary">{formulaVals.distance}</span> ×{' '}
                    <span className="text-accent">{formulaVals.factor}</span> ×{' '}
                    <span className="text-yellow-400">{formulaVals.traffic}</span>{' '}
                    = <span className="text-white font-bold">{formulaVals.result}</span>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Section 3: EcoScore Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {loading ? <SkeletonChart height={220} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">EcoScore Factor Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={ecoScoreRadar}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 8 }} />
                    <Radar name="EcoScore" dataKey="score" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* Confidence Gauges */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Forecast Confidence by Horizon</h3>
              <div className="space-y-3">
                {[
                  { horizon: '1 Hour', pct: 95, color: '#00D4AA' },
                  { horizon: '24 Hours', pct: 87, color: '#22C55E' },
                  { horizon: '7 Days', pct: 72, color: '#F59E0B' },
                  { horizon: '30 Days', pct: 58, color: '#F97316' },
                  { horizon: '90 Days', pct: 41, color: '#EF4444' },
                ].map(({ horizon, pct, color }) => (
                  <div key={horizon}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{horizon}</span>
                      <span style={{ color }} className="font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Section 5: AI Reasoning Chain */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <Brain size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-200">AI Reasoning Chain</h3>
              <span className="text-xs text-slate-500 ml-auto">Step-by-step route decision logic</span>
            </div>
            <div className="space-y-3">
              {reasoningChain.map(({ step, icon, label, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="flex items-start gap-4 relative"
                >
                  {/* Connector line */}
                  {i < reasoningChain.length - 1 && (
                    <div className="absolute left-5 top-8 w-px h-full bg-gradient-to-b from-primary/30 to-transparent" style={{ height: 'calc(100% + 12px)' }} />
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg relative z-10"
                    style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-primary">Step {step}</span>
                      <span className="text-sm font-semibold text-slate-200">{label}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  )
}

export default XAIDashboard
