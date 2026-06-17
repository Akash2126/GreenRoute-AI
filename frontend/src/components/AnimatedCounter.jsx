import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const AnimatedCounter = ({
  value = 0,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000,
  className = '',
  once = true,
}) => {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once })

  useEffect(() => {
    if (!inView) return

    let start = null
    const startValue = 0
    const endValue = value

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (endValue - startValue) * eased
      setDisplayed(current)
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [inView, value, duration])

  const formatted = displayed.toFixed(decimals)
  const [intPart, decPart] = formatted.split('.')

  // Add thousands separator
  const withCommas = Number(intPart).toLocaleString()

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {prefix}
      {withCommas}
      {decimals > 0 ? `.${decPart || '0'.repeat(decimals)}` : ''}
      {suffix}
    </motion.span>
  )
}

export default AnimatedCounter
