import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Leaf, Fuel, Star, Target, Lightbulb,
  TrendingUp, Users, ChevronRight, Flame
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton'
import analyticsService from '../services/analyticsService'
import forecastService from '../services/forecastService'
import { format, subMonths } from 'date-fns'

// ============================================================
// Animated Progress Ring
// ============================================================
const ProgressRing = ({ pct, color, size = 100, label, value, suffix }) => {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
            filter={`drop-shadow(0 0 6px ${color}60)`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{value}</span>
          <span className="text-[9px] text-slate-500">{suffix}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center">{label}</p>
    </div>
  )
}

// ============================================================
// SDG Card
// ============================================================
const SDGCard = ({ num, icon, title, desc, progress, color }) => (
  <GlassCard className="p-5">
    <div className="flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
            SDG {num}
          </span>
          <span className="text-sm font-bold text-slate-200">{title}</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{desc}</p>
        <div className="h-2 rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color }}>{progress}% impact</p>
      </div>
    </div>
  </GlassCard>
)

// ============================================================
// Generate cumulative reduction
// ============================================================
const genCumulativeData = () => {
  let cumulative = 0
  return Array.from({ length: 12 }, (_, i) => {
    const monthly = 18 + Math.random() * 15
    cumulative += monthly
    return {
      month: format(subMonths(new Date(), 11 - i), 'MMM yy'),
      monthly: +monthly.toFixed(1),
      cumulative: +cumulative.toFixed(1),
    }
  })
}

const ClimateCenter = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [tips, setTips] = useState([])
  const [insight, setInsight] = useState('')
  const [goalCO2, setGoalCO2] = useState(50)
  const cumulativeData = genCumulativeData()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await analyticsService.getSustainability()
        setStats(data)
      } catch {
        setStats({
          total_co2_saved: 286.4,
          trees_equivalent: 14,
          fuel_saved: 98.2,
          sustainability_score: 78,
        })
      }

      try {
        const tipsData = await forecastService.getClimateTips()
        if (tipsData && tipsData.tips) {
          setTips(tipsData.tips)
          setInsight(tipsData.sustainability_insight)
        }
      } catch (err) {
        console.error("Failed to fetch climate tips:", err)
      } finally {
        setTimeout(() => setLoading(false), 700)
      }
    }
    fetch()
  }, [])

  const co2Saved = stats?.total_co2_saved || 286.4
  const treesCount = stats?.trees_equivalent || Math.round(co2Saved / 22)
  const homeDays = Math.round(co2Saved / 16)
  const oilBarrels = (co2Saved / 430).toFixed(1)

  const stories = [
    { icon: '🌳', text: `Your CO₂ savings equal planting ${treesCount} trees this year` },
    { icon: '✈️', text: `You've avoided emissions equivalent to a Mumbai-Delhi flight (~${(co2Saved * 0.8).toFixed(0)} kg CO₂)` },
    { icon: '🏠', text: `Your savings match powering a home for ${homeDays} days on clean energy` },
    { icon: '🌊', text: `Equivalent to removing ${oilBarrels} barrels of oil from circulation` },
  ]

  const getTipIcon = (tipText, index) => {
    const text = tipText.toLowerCase()
    if (text.includes('walk') || text.includes('cycle') || text.includes('bike')) return '🚶'
    if (text.includes('peak') || text.includes('hour') || text.includes('traffic') || text.includes('congestion')) return '🌙'
    if (text.includes('ev') || text.includes('electric') || text.includes('hybrid')) return '⚡'
    if (text.includes('highway') || text.includes('speed') || text.includes('drive')) return '🛣️'
    if (text.includes('tire') || text.includes('pressure')) return '🌡️'
    if (text.includes('fuel') || text.includes('efficiency')) return '⛽'
    if (text.includes('tree') || text.includes('carbon') || text.includes('co2')) return '🌳'
    const standardIcons = ['💡', '🌿', '🌱', '🌍', '🚗']
    return standardIcons[index % standardIcons.length]
  }

  const personalStats = [
    { label: 'CO₂ Saved', value: stats?.total_co2_saved || 286.4, suffix: ' kg', color: '#00D4AA', pct: 72, icon: '🌱' },
    { label: 'Trees Equal', value: stats?.trees_equivalent || 14, suffix: '', color: '#22C55E', pct: 56, icon: '🌳' },
    { label: 'Fuel Saved', value: stats?.fuel_saved || 98.2, suffix: ' L', color: '#F59E0B', pct: 65, icon: '⛽' },
    { label: 'Eco Score', value: stats?.sustainability_score || 78, suffix: '', color: '#00FF88', pct: 78, icon: '⭐' },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="text-xs flex gap-2">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="font-bold text-slate-200">{p.value} kg</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header with globe */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-5xl select-none"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,170,0.4))' }}
            >
              🌍
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                Climate <span className="gradient-text">Center</span>
              </h1>
              <p className="text-slate-500">Your personal environmental impact dashboard</p>
            </div>
          </div>
        </motion.div>

        {/* Personal Impact Rings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-6 mb-6">
            <h2 className="text-sm font-bold text-slate-300 mb-6">Your Climate Impact</h2>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {personalStats.map(({ label, value, suffix, color, pct, icon }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className="text-3xl mb-2">{icon}</span>
                    <ProgressRing pct={pct} color={color} size={100} label={label} value={value.toFixed(1)} suffix={suffix.trim() || 'pts'} />
                  </div>
                ))}
              </div>
            )}

            {/* AI Sustainability Insight */}
            {insight && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#00D4AA]/10 to-emerald-500/5 border border-[#00D4AA]/15 flex items-start gap-3.5"
              >
                <span className="text-2xl flex-shrink-0">🤖</span>
                <div>
                  <p className="text-xs font-black text-[#00D4AA] uppercase tracking-wider mb-1">AI Sustainability Insight</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* Cumulative CO2 Reduction Timeline */}
        {loading ? <SkeletonChart className="mb-6" height={220} /> : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <GlassCard className="p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Carbon Reduction Timeline (12 Months)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative CO₂ Saved" stroke="#00D4AA" fill="url(#cumGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="monthly" name="Monthly Saved" stroke="#00FF88" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        )}

        {/* SDG Impact */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-200 mb-4">UN Sustainable Development Goal Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SDGCard
              num="11" icon="🏙️"
              title="Sustainable Cities"
              desc="Every green route contributes to reducing urban air pollution and supporting sustainable urban mobility."
              progress={68} color="#00D4AA"
            />
            <SDGCard
              num="13" icon="🌡️"
              title="Climate Action"
              desc="Your CO₂ reductions directly combat climate change and support global emission reduction targets."
              progress={78} color="#22C55E"
            />
            <SDGCard
              num="7" icon="⚡"
              title="Clean Energy"
              desc="EV route optimization and fuel efficiency improvements promote clean energy transportation."
              progress={55} color="#3B82F6"
            />
          </div>
        </div>

        {/* Environmental storytelling */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-200 mb-4">Your Impact Stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stories.map(({ icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <GlassCard hover className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <p className="text-sm text-slate-300">{text}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Climate Tips + Goal Setter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Climate Tips */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={16} className="text-accent" />
              <h3 className="text-sm font-bold text-slate-200">AI Climate Tips</h3>
            </div>
            <div className="space-y-3">
              {(tips.length > 0 ? tips : [
                'Walk or cycle for trips under 2 km — saves ~0.4 kg CO₂ per trip',
                'Avoid peak hour driving (8-10 AM, 5-8 PM) to reduce idle emissions by 30%',
                'Switching to an EV for your regular commute can cut emissions by 70%',
                'Highway driving at 80-90 km/h is 20% more fuel-efficient than 120 km/h',
                'Properly inflated tires improve fuel efficiency by up to 3%',
              ]).map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <span className="text-xl flex-shrink-0">{getTipIcon(tip, i)}</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Goal Setter */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-200">Carbon Reduction Goal</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Set your monthly CO₂ savings target</p>

            <div className="text-center mb-4">
              <div className="text-5xl font-black gradient-text mb-1">{goalCO2}</div>
              <p className="text-sm text-slate-400">kg CO₂ / month</p>
            </div>

            <input
              type="range"
              min={10} max={200} value={goalCO2}
              onChange={e => setGoalCO2(Number(e.target.value))}
              className="w-full mb-4"
              style={{ accentColor: '#00D4AA' }}
            />

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Trees equivalent per month</span>
                <span className="text-primary font-bold">{Math.round(goalCO2 / 1.75)} trees</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel savings estimate</span>
                <span className="text-accent font-bold">~{(goalCO2 / 2.3).toFixed(1)} L</span>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-xs text-primary leading-relaxed">
                🎯 To reach your goal of <strong>{goalCO2} kg</strong>, take the Greenest route for at least{' '}
                <strong>{Math.round(goalCO2 / 1.6)}</strong> trips this month.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Community Impact */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-200">Community Impact</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Community CO₂ Saved', value: '2.3M', unit: 'kg', icon: '🌱' },
                { label: 'Active Users', value: '50K+', unit: '', icon: '👥' },
                { label: 'Trees Planted', value: '109K', unit: '', icon: '🌳' },
                { label: 'Cities Covered', value: '48', unit: '', icon: '🏙️' },
              ].map(({ label, value, unit, icon }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-black gradient-text">{value}<span className="text-sm">{unit}</span></div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  )
}

export default ClimateCenter
