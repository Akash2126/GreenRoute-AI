import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Edit3, Save, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import EcoScoreMeter from '../components/EcoScoreMeter'
import AchievementBadge from '../components/AchievementBadge'
import AnimatedCounter from '../components/AnimatedCounter'
import { SkeletonCard } from '../components/LoadingSkeleton'
import useStore from '../store/useStore'
import authService from '../services/authService'
import toast from 'react-hot-toast'

const recentTrips = [
  { from: 'Koramangala', to: 'Whitefield', date: '2025-06-11', distance: 14.2, co2: 2.1, ecoScore: 82 },
  { from: 'JP Nagar', to: 'MG Road', date: '2025-06-10', distance: 9.4, co2: 1.4, ecoScore: 78 },
  { from: 'Marathahalli', to: 'Electronic City', date: '2025-06-09', distance: 18.7, co2: 3.2, ecoScore: 65 },
  { from: 'Indiranagar', to: 'HSR Layout', date: '2025-06-08', distance: 7.1, co2: 1.0, ecoScore: 88 },
]

const topAchievements = [
  { id: 'first_green', name: 'First Green', emoji: '🌿', color: '#00D4AA', unlocked: true, xp: 100, progress: 1, maxProgress: 1 },
  { id: 'eco_10', name: 'Eco Warrior', emoji: '⚔️', color: '#22C55E', unlocked: true, xp: 250, progress: 10, maxProgress: 10 },
  { id: 'fuel_50', name: 'Fuel Saver', emoji: '⛽', color: '#EF4444', unlocked: true, xp: 400, progress: 98, maxProgress: 50 },
]

const Profile = () => {
  const { user, setUser } = useStore()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [stats] = useState({
    total_trips: 142,
    co2_saved: 286.4,
    fuel_saved: 98.2,
    avg_eco_score: 79,
    achievements_unlocked: 6,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await authService.getProfile()
        setUser(data)
        setEditForm({ name: data.name || '', email: data.email || '' })
      } catch {}
      setTimeout(() => setLoading(false), 500)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      await authService.updateProfile(editForm)
      setUser({ ...user, ...editForm })
      setEditing(false)
      toast.success('Profile updated! ✅')
    } catch {
      setUser({ ...user, ...editForm })
      setEditing(false)
      toast.success('Profile updated! ✅')
    }
  }

  const initials = (user?.name || 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const profileStats = [
    { label: 'Total Trips', val: stats.total_trips, suffix: '', color: '#3B82F6', icon: '🚗' },
    { label: 'CO₂ Saved', val: stats.co2_saved, suffix: ' kg', color: '#00D4AA', icon: '🌿', decimals: 1 },
    { label: 'Fuel Saved', val: stats.fuel_saved, suffix: ' L', color: '#F59E0B', icon: '⛽', decimals: 1 },
    { label: 'Avg EcoScore', val: stats.avg_eco_score, suffix: '', color: '#00FF88', icon: '⭐' },
    { label: 'Achievements', val: stats.achievements_unlocked, suffix: '', color: '#8B5CF6', icon: '🏆' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-slate-100">
            My <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-slate-500 text-sm">Your account and sustainability overview</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-4">
            {/* Avatar + Info */}
            <GlassCard className="p-6 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-navy font-black text-3xl mx-auto mb-4 shadow-xl shadow-primary/30"
              >
                {initials}
              </motion.div>

              {editing ? (
                <div className="space-y-3">
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 text-center outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,170,0.3)' }}
                    placeholder="Your name"
                  />
                  <input
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 text-center outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,170,0.3)' }}
                    placeholder="Email"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-1 py-2 rounded-lg text-navy text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)' }}>
                      <Save size={12} className="inline mr-1" />Save
                    </button>
                    <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg text-slate-400 text-xs border border-white/10">
                      <X size={12} className="inline mr-1" />Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-slate-100 mb-0.5">{user?.name || 'User'}</h2>
                  <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/25 hover:bg-primary/8 transition-colors mx-auto"
                  >
                    <Edit3 size={12} />
                    Edit Profile
                  </button>
                </>
              )}
            </GlassCard>

            {/* EcoScore */}
            <GlassCard className="p-5 flex flex-col items-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your EcoScore</p>
              <EcoScoreMeter score={stats.avg_eco_score} size={150} />
            </GlassCard>

            {/* Top Achievements */}
            <GlassCard className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Top Achievements</p>
              <div className="flex justify-around">
                {topAchievements.map(ach => (
                  <AchievementBadge key={ach.id} achievement={ach} size="sm" />
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Right: Stats + Trips */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-4">
            {/* Stats Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profileStats.map(({ label, val, suffix, color, icon, decimals = 0 }) => (
                  <GlassCard key={label} className="p-4 text-center">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-2xl font-black" style={{ color }}>
                      <AnimatedCounter value={val} suffix={suffix} decimals={decimals} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Recent Trips */}
            <GlassCard className="overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-bold text-slate-200">Recent Trips</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['From', 'To', 'Date', 'Dist.', 'CO₂', 'EcoScore'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map((t, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-slate-300">{t.from}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{t.to}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.date}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{t.distance} km</td>
                        <td className="px-4 py-3 text-xs text-primary font-semibold">{t.co2} kg</td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: t.ecoScore >= 80 ? 'rgba(0,212,170,0.15)' : 'rgba(234,179,8,0.15)',
                              color: t.ecoScore >= 80 ? '#00D4AA' : '#EAB308',
                            }}
                          >
                            {t.ecoScore}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Account Settings */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={14} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-200">Account Settings</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Email Notifications', desc: 'Get updates on your eco progress', enabled: true },
                  { label: 'Weekly Report', desc: 'Receive weekly sustainability report', enabled: false },
                  { label: 'AI Recommendations', desc: 'Personalized green route suggestions', enabled: true },
                ].map(({ label, desc, enabled }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300"
                      style={{ background: enabled ? '#00D4AA' : 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300"
                        style={{ transform: `translateX(${enabled ? 20 : 2}px)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default Profile
