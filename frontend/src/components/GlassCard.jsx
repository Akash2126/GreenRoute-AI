import { motion } from 'framer-motion'

const GlassCard = ({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  as: Tag = 'div',
  style = {},
  ...props
}) => {
  const baseClasses = `
    relative rounded-2xl overflow-hidden
    border border-white/10
    bg-[rgba(255,255,255,0.04)]
    backdrop-blur-[20px]
  `
  const hoverClasses = hover
    ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10'
    : ''
  const glowClasses = glow ? 'shadow-lg shadow-primary/20 border-primary/20' : ''

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,212,170,0.15)' }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`${baseClasses} ${glowClasses} ${className}`}
        onClick={onClick}
        style={style}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <Tag
      className={`${baseClasses} ${glowClasses} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  )
}

export default GlassCard
