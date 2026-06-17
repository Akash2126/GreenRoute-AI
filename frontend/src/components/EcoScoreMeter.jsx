import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const getColor = (score) => {
  if (score >= 75) return { primary: '#00D4AA', secondary: '#00FF88', label: 'Excellent', bg: 'rgba(0,212,170,0.1)' }
  if (score >= 60) return { primary: '#22C55E', secondary: '#4ADE80', label: 'Good', bg: 'rgba(34,197,94,0.1)' }
  if (score >= 40) return { primary: '#EAB308', secondary: '#FDE047', label: 'Moderate', bg: 'rgba(234,179,8,0.1)' }
  return { primary: '#EF4444', secondary: '#F87171', label: 'Poor', bg: 'rgba(239,68,68,0.1)' }
}

const EcoScoreMeter = ({ score = 0, size = 180, showLabel = true, animate = true }) => {
  const [displayed, setDisplayed] = useState(0)
  const { primary, secondary, label, bg } = getColor(score)

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (displayed / 100) * circumference * 0.75
  const center = size / 2

  useEffect(() => {
    if (!animate) {
      setDisplayed(score)
      return
    }
    let start = null
    const duration = 1500
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score, animate])

  // SVG arc: 3/4 of circle starting from bottom-left
  const startAngle = 135
  const endAngle = startAngle + 270 * (displayed / 100)

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const start = polarToCartesian(center, center, radius, 135)
  const end = polarToCartesian(center, center, radius, 405)
  const activeEnd = polarToCartesian(center, center, radius, endAngle)
  const largeArc = 270 > 180 ? 1 : 0
  const activeLargeArc = 270 * (displayed / 100) > 180 ? 1 : 0

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background track */}
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gauge-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primary} />
              <stop offset="100%" stopColor={secondary} />
            </linearGradient>
          </defs>
          {/* Active arc */}
          {displayed > 0 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: displayed / 100 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${activeLargeArc} 1 ${activeEnd.x} ${activeEnd.y}`}
              fill="none"
              stroke={`url(#gauge-grad-${score})`}
              strokeWidth={10}
              strokeLinecap="round"
              filter={`drop-shadow(0 0 8px ${primary}60)`}
            />
          )}
        </svg>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-black"
            style={{ color: primary, textShadow: `0 0 20px ${primary}60` }}
          >
            {displayed}
          </motion.span>
          <span className="text-xs text-slate-500 font-medium mt-0.5">EcoScore</span>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: bg, color: primary, border: `1px solid ${primary}30` }}
        >
          {label}
        </motion.div>
      )}
    </div>
  )
}

export default EcoScoreMeter
