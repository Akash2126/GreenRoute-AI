import { motion } from 'framer-motion'

const TreeSVG = ({ index, delay }) => (
  <motion.div
    initial={{ opacity: 0, scaleY: 0 }}
    animate={{ opacity: 1, scaleY: 1 }}
    transition={{ delay: delay + index * 0.08, duration: 0.5, ease: 'backOut' }}
    style={{ transformOrigin: 'bottom' }}
    title="1 tree equivalent"
  >
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
      {/* Trunk */}
      <rect x="11" y="26" width="6" height="10" rx="2" fill="#8B5A2B" />
      {/* Bottom layer */}
      <polygon points="14,18 4,32 24,32" fill="#22C55E" />
      {/* Middle layer */}
      <polygon points="14,10 6,24 22,24" fill="#16A34A" />
      {/* Top layer */}
      <polygon points="14,2 8,16 20,16" fill="#00D4AA" />
    </svg>
  </motion.div>
)

const EmissionTree = ({ co2Saved = 0, className = '' }) => {
  // 1 tree absorbs ~21 kg CO2/year → per trip: use kg saved
  const treesEquiv = Math.max(1, Math.round(co2Saved / 0.05))
  const displayTrees = Math.min(treesEquiv, 20) // max 20 displayed
  const hasMore = treesEquiv > 20

  return (
    <div className={className}>
      <div className="flex items-end gap-1 flex-wrap">
        {Array.from({ length: displayTrees }).map((_, i) => (
          <TreeSVG key={i} index={i} delay={0.1} />
        ))}
        {hasMore && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="text-primary font-bold text-sm self-center ml-1"
          >
            +{treesEquiv - 20} more
          </motion.span>
        )}
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-400 text-sm mt-3"
      >
        ≈{' '}
        <span className="text-primary font-bold text-lg">{treesEquiv}</span>{' '}
        tree{treesEquiv !== 1 ? 's' : ''} saved{' '}
        <span className="text-slate-500 text-xs">
          ({co2Saved.toFixed(2)} kg CO₂)
        </span>
      </motion.p>
    </div>
  )
}

export default EmissionTree
