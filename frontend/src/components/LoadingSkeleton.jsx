import { motion } from 'framer-motion'

const shimmer = `
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
`

const SkeletonBox = ({ className = '', style = {} }) => (
  <div
    className={`rounded-lg ${className}`}
    style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
)

export const SkeletonCard = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`p-5 rounded-2xl border border-white/5 bg-white/[0.03] ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-8 w-8 rounded-lg" />
    </div>
    <SkeletonBox className="h-8 w-32 mb-2" />
    <SkeletonBox className="h-3 w-20" />
  </motion.div>
)

export const SkeletonChart = ({ className = '', height = 200 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`p-5 rounded-2xl border border-white/5 bg-white/[0.03] ${className}`}
  >
    <SkeletonBox className="h-5 w-40 mb-4" />
    <SkeletonBox style={{ height }} />
  </motion.div>
)

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`p-5 rounded-2xl border border-white/5 bg-white/[0.03] ${className}`}
  >
    <SkeletonBox className="h-5 w-32 mb-4" />
    {/* Header */}
    <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox key={i} className="h-3" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, ci) => (
          <SkeletonBox key={ci} className="h-4" />
        ))}
      </div>
    ))}
  </motion.div>
)

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox
        key={i}
        className="h-4"
        style={{ width: i === lines - 1 ? '65%' : '100%' }}
      />
    ))}
  </div>
)

const LoadingSkeleton = ({ variant = 'card', ...props }) => {
  if (variant === 'chart') return <SkeletonChart {...props} />
  if (variant === 'table') return <SkeletonTable {...props} />
  if (variant === 'text') return <SkeletonText {...props} />
  return <SkeletonCard {...props} />
}

export default LoadingSkeleton
