import { motion } from 'framer-motion'
import { Clock, Ruler, Fuel, Leaf, Zap } from 'lucide-react'

const typeConfig = {
  Fastest: {
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: '⚡',
    label: 'Fastest Route',
  },
  Shortest: {
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: '📍',
    label: 'Shortest Route',
  },
  Greenest: {
    color: '#00D4AA',
    bg: 'rgba(0,212,170,0.08)',
    border: 'rgba(0,212,170,0.25)',
    badge: 'bg-primary/15 text-primary border-primary/30',
    icon: '🌿',
    label: 'Greenest Route',
  },
}

const EcoBadge = ({ score }) => {
  const color =
    score >= 75 ? '#00D4AA' : score >= 60 ? '#22C55E' : score >= 40 ? '#EAB308' : '#EF4444'
  const label =
    score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Poor'
  return (
    <span
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      ⭐ {score} · {label}
    </span>
  )
}

const RouteCard = ({ route, selected, onSelect }) => {
  const type = route.type || 'Greenest'
  const cfg = typeConfig[type] || typeConfig.Greenest

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onSelect(route)}
      className="p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{
        background: selected ? cfg.bg : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected ? `0 0 20px ${cfg.color}20` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.icon}</span>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <EcoBadge score={route.ecoScore || 0} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: Ruler, label: 'Distance', value: `${route.distance} km` },
          { icon: Clock, label: 'Time', value: `${route.time} min` },
          { icon: Fuel, label: 'Fuel', value: `${route.fuel} L` },
          { icon: Leaf, label: 'CO₂', value: `${route.co2} kg` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${cfg.color}15` }}
            >
              <Icon size={12} style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-none">{label}</p>
              <p className="text-sm font-semibold text-slate-200 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
          style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }}
        />
      )}
    </motion.div>
  )
}

export default RouteCard
