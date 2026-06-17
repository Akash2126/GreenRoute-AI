import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

const HexagonPath = ({ size = 80, color = '#00D4AA', locked = false }) => {
  const w = size
  const h = size * 1.155
  const points = [
    [w / 2, 0],
    [w, h / 4],
    [w, (3 * h) / 4],
    [w / 2, h],
    [0, (3 * h) / 4],
    [0, h / 4],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`hex-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={locked ? 0.15 : 0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={locked ? 0.05 : 0.15} />
        </linearGradient>
      </defs>
      <polygon
        points={points}
        fill={`url(#hex-grad-${color.replace('#', '')})`}
        stroke={color}
        strokeOpacity={locked ? 0.2 : 0.6}
        strokeWidth={2}
        filter={locked ? 'none' : `drop-shadow(0 0 8px ${color}60)`}
      />
    </svg>
  )
}

const AchievementBadge = ({
  achievement,
  size = 'md',
}) => {
  const {
    id,
    name,
    description,
    icon: IconComponent,
    emoji,
    color = '#00D4AA',
    unlocked = false,
    progress = 0,
    maxProgress = 100,
    xp = 0,
    category,
  } = achievement

  const sizeMap = {
    sm: { hex: 60, iconSize: 18, fontSize: 'text-xs', containerW: 120 },
    md: { hex: 80, iconSize: 24, fontSize: 'text-sm', containerW: 160 },
    lg: { hex: 100, iconSize: 30, fontSize: 'text-base', containerW: 200 },
  }

  const s = sizeMap[size] || sizeMap.md
  const hexH = s.hex * 1.155
  const progressPct = Math.min(100, (progress / maxProgress) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={unlocked ? { scale: 1.05, y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
      className="flex flex-col items-center gap-2 cursor-default select-none"
      style={{ width: s.containerW }}
    >
      {/* Hexagon */}
      <div className="relative flex items-center justify-center">
        <div className={unlocked ? '' : 'grayscale opacity-40'}>
          <HexagonPath size={s.hex} color={color} locked={!unlocked} />
        </div>

        {/* Icon in center */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingTop: hexH * 0.1 }}
        >
          {unlocked ? (
            emoji ? (
              <span style={{ fontSize: s.iconSize }}>{emoji}</span>
            ) : IconComponent ? (
              <IconComponent size={s.iconSize} style={{ color }} />
            ) : null
          ) : (
            <Lock size={s.iconSize * 0.8} className="text-slate-600" />
          )}
        </div>

        {/* Unlock animation ring */}
        {unlocked && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut', repeat: Infinity, repeatDelay: 3 }}
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}`, borderRadius: '50%' }}
          />
        )}
      </div>

      {/* Name & XP */}
      <div className="text-center">
        <p
          className={`${s.fontSize} font-bold leading-tight`}
          style={{ color: unlocked ? color : '#475569' }}
        >
          {name}
        </p>
        {xp > 0 && unlocked && (
          <p className="text-xs text-slate-500 mt-0.5">+{xp} XP</p>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-[10px] text-slate-500 text-center leading-snug px-1">
          {description}
        </p>
      )}

      {/* Progress bar (if not unlocked and has progress) */}
      {!unlocked && progress > 0 && (
        <div className="w-full px-2">
          <div className="progress-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="progress-bar-fill"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 text-center">
            {progress}/{maxProgress}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default AchievementBadge
