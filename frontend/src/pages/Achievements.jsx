import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Lock, Filter } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import AchievementBadge from '../components/AchievementBadge'
import { SkeletonCard } from '../components/LoadingSkeleton'
import { achievementsService } from '../services/forecastService'

// ============================================================
// Mock Achievements Data
// ============================================================
const ACHIEVEMENTS = [
  // Green Milestones
  { id: 'first_green', name: 'First Green Trip', emoji: '🌿', color: '#00D4AA', category: 'Green Milestones', description: 'Complete your first Greenest route trip', unlocked: true, xp: 100, progress: 1, maxProgress: 1 },
  { id: 'eco_10', name: 'Eco Warrior', emoji: '⚔️', color: '#22C55E', category: 'Green Milestones', description: 'Take 10 Greenest route trips', unlocked: true, xp: 250, progress: 10, maxProgress: 10 },
  { id: 'co2_100', name: 'Carbon Crusher', emoji: '💨', color: '#00FF88', category: 'Green Milestones', description: 'Save 100 kg of CO₂', unlocked: true, xp: 500, progress: 100, maxProgress: 100 },
  { id: 'co2_500', name: 'Climate Hero', emoji: '🦸', color: '#00D4AA', category: 'Green Milestones', description: 'Save 500 kg of CO₂', unlocked: false, xp: 1000, progress: 286, maxProgress: 500 },
  { id: 'co2_1000', name: 'Earth Defender', emoji: '🌍', color: '#00FF88', category: 'Green Milestones', description: 'Save 1,000 kg of CO₂', unlocked: false, xp: 2000, progress: 286, maxProgress: 1000 },
  // Efficiency Stars
  { id: 'ecoscore_80', name: 'Efficiency Star', emoji: '⭐', color: '#F59E0B', category: 'Efficiency Stars', description: 'Achieve an EcoScore above 80', unlocked: true, xp: 300, progress: 1, maxProgress: 1 },
  { id: 'ecoscore_90', name: 'Green Genius', emoji: '🧠', color: '#F59E0B', category: 'Efficiency Stars', description: 'Achieve an EcoScore above 90', unlocked: false, xp: 600, progress: 82, maxProgress: 90 },
  { id: 'perfect_week', name: 'Perfect Week', emoji: '📅', color: '#EAB308', category: 'Efficiency Stars', description: 'All green routes for 7 days straight', unlocked: false, xp: 800, progress: 5, maxProgress: 7 },
  // Carbon Heroes
  { id: 'tree_5', name: 'Tree Planter', emoji: '🌳', color: '#22C55E', category: 'Carbon Heroes', description: 'Save CO₂ equivalent to 5 trees', unlocked: true, xp: 200, progress: 14, maxProgress: 5 },
  { id: 'tree_50', name: 'Forest Friend', emoji: '🌲', color: '#16A34A', category: 'Carbon Heroes', description: 'Save CO₂ equivalent to 50 trees', unlocked: false, xp: 1000, progress: 14, maxProgress: 50 },
  { id: 'fuel_50', name: 'Fuel Saver', emoji: '⛽', color: '#EF4444', category: 'Carbon Heroes', description: 'Save 50 liters of fuel', unlocked: true, xp: 400, progress: 98, maxProgress: 50 },
  // Fleet Champion
  { id: 'first_fleet', name: 'Fleet Commander', emoji: '🚛', color: '#8B5CF6', category: 'Fleet Champion', description: 'Add your first fleet vehicle', unlocked: false, xp: 300, progress: 0, maxProgress: 1 },
  { id: 'fleet_eco', name: 'Fleet Optimizer', emoji: '🏆', color: '#7C3AED', category: 'Fleet Champion', description: 'Achieve fleet avg EcoScore 75+', unlocked: false, xp: 800, progress: 0, maxProgress: 1 },
]

const leaderboard = [
  { rank: 1, name: 'Priya S.', co2: 1842, xp: 12400, badge: '🥇' },
  { rank: 2, name: 'Arjun M.', co2: 1523, xp: 10200, badge: '🥈' },
  { rank: 3, name: 'Ravi K.', co2: 1310, xp: 8900, badge: '🥉' },
]

const categories = ['All', 'Green Milestones', 'Efficiency Stars', 'Carbon Heroes', 'Fleet Champion']

const Achievements = () => {
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState(ACHIEVEMENTS)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await achievementsService.getAchievements()
        if (data?.length) setAchievements(data)
      } catch {}
      setTimeout(() => setLoading(false), 600)
    }
    fetch()
  }, [])

  const filtered = activeCategory === 'All'
    ? achievements
    : achievements.filter(a => a.category === activeCategory)

  const unlocked = achievements.filter(a => a.unlocked).length
  const totalXP = achievements.filter(a => a.unlocked).reduce((s, a) => s + (a.xp || 0), 0)

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-4xl select-none"
              style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }}
            >
              🏆
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-slate-100">
                Sustainability <span className="gradient-text">Achievements</span>
              </h1>
              <p className="text-slate-500 text-sm">Earn badges for your green journey milestones</p>
            </div>
          </div>
        </motion.div>

        {/* Overall Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <GlassCard className="p-5 text-center">
            <div className="text-3xl mb-2">🎖️</div>
            <div className="text-3xl font-black gradient-text">{unlocked}/{achievements.length}</div>
            <p className="text-xs text-slate-500 mt-1">Achievements Unlocked</p>
            <div className="mt-3 h-2 rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlocked / achievements.length) * 100}%` }}
                transition={{ duration: 1.5 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4AA, #00FF88)' }}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-3xl font-black text-amber-400">{totalXP.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Total XP Earned</p>
          </GlassCard>

          <GlassCard className="p-5 text-center">
            <div className="text-3xl mb-2">🌿</div>
            <div className="text-3xl font-black text-primary">Eco Warrior</div>
            <p className="text-xs text-slate-500 mt-1">Current Rank</p>
          </GlassCard>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeCategory === cat ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === cat ? '#00D4AA' : '#64748B',
                border: `1px solid ${activeCategory === cat ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {filtered.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex justify-center"
              >
                <AchievementBadge achievement={ach} size="md" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Leaderboard Teaser */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200">Top CO₂ Savers Leaderboard</h3>
            </div>
            <div className="space-y-3">
              {leaderboard.map(({ rank, name, co2, xp, badge }) => (
                <div key={rank} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-2xl">{badge}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-200">{name}</p>
                    <p className="text-xs text-slate-500">{xp.toLocaleString()} XP</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{co2.toLocaleString()} kg</p>
                    <p className="text-xs text-slate-500">CO₂ Saved</p>
                  </div>
                </div>
              ))}

              {/* Your rank */}
              <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <span className="text-2xl">👤</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary">You</p>
                  <p className="text-xs text-slate-500">{totalXP.toLocaleString()} XP · Rank #247</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">286 kg</p>
                  <p className="text-xs text-slate-500">CO₂ Saved</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  )
}

export default Achievements
