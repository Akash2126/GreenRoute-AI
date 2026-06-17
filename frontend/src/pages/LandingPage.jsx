import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  Leaf, ArrowRight, Zap, MapPin, Brain, Shield,
  CheckCircle, Star, Copy, Download, RotateCw, Check,
  Sparkles, Loader2, Lock, Mail, User, Eye, EyeOff, ShieldCheck,
  Trophy, BarChart3
} from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'

// ============================================================
// Typewriter Hook
// ============================================================
const useTypewriter = (texts, speed = 80) => {
  const [displayed, setDisplayed] = useState('')
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    const timer = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplayed(current.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        } else {
          setTimeout(() => setDeleting(true), 2500)
        }
      } else {
        if (charIdx > 0) {
          setDisplayed(current.slice(0, charIdx - 1))
          setCharIdx(c => c - 1)
        } else {
          setDeleting(false)
          setTextIdx(i => (i + 1) % texts.length)
        }
      }
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(timer)
  }, [charIdx, deleting, textIdx, texts, speed])

  return displayed
}

// ============================================================
// Particle Canvas Network Background
// ============================================================
const ParticleCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles = []
    const particleCount = 65
    const connectionDistance = 115

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.45
        this.vy = (Math.random() - 0.5) * 0.45
        this.radius = Math.random() * 2 + 1
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 255, 135, 0.45)'
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)

          if (dist < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            const alpha = (1 - dist / connectionDistance) * 0.18
            ctx.strokeStyle = `rgba(0, 255, 135, ${alpha})`
            ctx.lineWidth = 0.55
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        p.update()
        p.draw()
      })
      drawLines()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvasRef.current) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
}

// ============================================================
// Tracing SVG Earth Globe
// ============================================================
const EarthGlobe = ({ className = "w-72 h-72 md:w-96 md:h-96" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Globe Glow Background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00D4AA]/20 via-[#00E5FF]/10 to-transparent blur-2xl animate-pulse" />
      
      {/* Outer Rotating Circuit Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[110%] h-[110%] border border-dashed border-[#00FF87]/20 rounded-full"
      />
      
      {/* Globe SVG */}
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 filter drop-shadow-[0_0_24px_rgba(0,255,136,0.3)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <radialGradient id="globeShade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B1A30" />
            <stop offset="70%" stopColor="#030817" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id="routeLineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FF87" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
        </defs>

        {/* Ocean sphere */}
        <circle cx="100" cy="100" r="80" fill="url(#globeShade)" stroke="rgba(0,255,135,0.15)" strokeWidth="1" />

        {/* Grid Lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse key={`lat-${i}`} cx="100" cy="100" rx="80" ry={20 + i * 10} fill="none" stroke="rgba(0,255,135,0.05)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse key={`lon-${i}`} cx="100" cy="100" rx={20 + i * 10} ry="80" fill="none" stroke="rgba(0,255,135,0.05)" strokeWidth="0.5" />
        ))}

        {/* Continent Shapes */}
        <path d="M 60,70 Q 75,50 90,65 T 120,60 T 130,85 T 110,120 T 70,110 Z" fill="rgba(0,212,170,0.15)" stroke="rgba(0,212,170,0.25)" strokeWidth="0.75" />
        <path d="M 115,100 Q 135,90 150,110 T 170,140 T 130,150 T 110,130 Z" fill="rgba(0,212,170,0.12)" stroke="rgba(0,212,170,0.2)" strokeWidth="0.75" />
        <path d="M 40,110 Q 50,130 65,140 T 80,165 T 50,170 Z" fill="rgba(0,212,170,0.15)" stroke="rgba(0,212,170,0.25)" strokeWidth="0.75" />

        {/* Animated Green Route Lines */}
        <motion.path
          d="M 65,85 Q 90,65 110,95 T 145,115"
          fill="none"
          stroke="url(#routeLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: [100, -100] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.path
          d="M 50,120 Q 75,130 110,120 T 155,135"
          fill="none"
          stroke="url(#routeLineGrad)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="80"
          initial={{ strokeDashoffset: 80 }}
          animate={{ strokeDashoffset: [80, -80] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', delay: 1 }}
        />

        {/* Pulsing City Nodes */}
        {[[65, 85], [110, 95], [145, 115], [50, 120], [155, 135]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="2.5" fill="#00FF87" />
            <motion.circle
              cx={cx} cy={cy} r="6"
              fill="#00E5FF" opacity="0.3"
              animate={{ scale: [1, 2.1, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45 }}
            />
          </g>
        ))}
      </motion.svg>
    </div>
  )
}

// ============================================================
// Nav Link With Animated Slide Underline
// ============================================================
const NavLink = ({ href, label, active, onClick }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative text-sm font-semibold text-slate-300 hover:text-white transition-colors py-2 px-1 cursor-pointer"
    >
      {label}
      {(hovered || active) && (
        <motion.div
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF87] rounded-full"
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
      )}
    </a>
  )
}

// ============================================================
// Feature Card with Scroll Bounce & Hover Glow
// ============================================================
const FeatureCard = ({ icon: Icon, title, desc, delay, stat, suffix }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ y: -8, boxShadow: '0 12px 30px rgba(0, 255, 135, 0.18)', borderColor: 'rgba(0, 255, 135, 0.35)' }}
        className="relative p-7 rounded-2xl cursor-default h-full overflow-hidden transition-all duration-300"
        style={{
          background: '#0F1A2E',
          border: '1px solid rgba(0, 255, 135, 0.15)',
        }}
      >
        {/* Glow circle behind icon */}
        <div className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
          <div className="absolute inset-0 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/25" />
          <div className="absolute w-10 h-10 rounded-full bg-[#00FF87]/20 blur-md pointer-events-none" />
          
          <motion.div
            animate={inView ? { y: [0, -8, 2, -3, 0] } : {}}
            transition={{ duration: 0.7, delay: delay + 0.3 }}
            className="relative text-[#00FF87]"
          >
            <Icon size={24} />
          </motion.div>
        </div>

        {/* Counter inside card */}
        <div className="text-3xl font-black text-[#00FF87] mb-2 flex items-baseline gap-1">
          {inView ? <AnimatedCounter value={stat} decimals={stat % 1 !== 0 ? 1 : 0} /> : '0'}
          <span className="text-xl font-bold">{suffix}</span>
        </div>

        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
      </motion.div>
    </motion.div>
  )
}

// ============================================================
// Auth Form Input With focus glow bottom border
// ============================================================
const AuthInput = ({ icon: Icon, type = 'text', name, placeholder, value, onChange, error }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-[#070D19] text-white placeholder-slate-500 outline-none border-b-2 transition-all duration-300"
        style={{
          borderBottomColor: focused ? '#00FF87' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: focused ? '0 4px 12px rgba(0, 255, 135, 0.05)' : 'none',
          borderLeft: 'none', borderRight: 'none', borderTop: 'none'
        }}
      />
      {error && <p className="text-red-400 text-[10px] mt-1 ml-1">{error}</p>}
    </div>
  )
}

// ============================================================
// Auth Form Submit Button with animated gradient shifting
// ============================================================
const AuthSubmitButton = ({ label, loading }) => {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{
        backgroundPosition: '100% 0%',
        scale: 1.02,
        boxShadow: '0 0 20px rgba(0, 255, 135, 0.4)',
      }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-3 rounded-xl font-bold text-[#020817] text-sm relative overflow-hidden transition-all duration-300 flex items-center justify-center"
      style={{
        background: 'linear-gradient(90deg, #00FF87, #00D4AA, #00E5FF, #00FF87)',
        backgroundSize: '200% 100%',
        backgroundPosition: '0% 0%',
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {loading ? <Loader2 size={16} className="animate-spin text-[#020817]" /> : label}
    </motion.button>
  )
}

// ============================================================
// Scroll reveal wrapper
// ============================================================
const RevealSection = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================================
// Redesigned Main Landing Page Component
// ============================================================
const LandingPage = () => {
  const navigate = useNavigate()
  const typewriterText = useTypewriter(['AI-powered eco routing that reduces your carbon footprint by up to 43% per trip.'], 70)
  
  const [activeTab, setActiveTab] = useState('home')
  const [authTab, setAuthTab] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Auth form states
  const { login, signup } = useAuth()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  // Cursor tracking spring
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 90, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 90, damping: 18 })

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  const handleScrollToSection = (id) => {
    setActiveTab(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Auth submissions
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please enter email and password')
      return
    }
    setAuthLoading(true)
    try {
      await login(loginForm)
    } catch {
      // Fallback redirect for offline demo mode
      toast.success('Offline Login Successful! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 800)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!signupForm.username.trim() || signupForm.username.trim().length < 3) errs.username = 'Username must be at least 3 chars'
    if (!signupForm.email.includes('@')) errs.email = 'Valid email is required'
    if (signupForm.password.length < 8) errs.password = 'Password must be 8+ characters'
    if (signupForm.password !== signupForm.confirm) errs.confirm = 'Passwords do not match'

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setAuthLoading(true)
    try {
      await signup({ username: signupForm.username, email: signupForm.email, password: signupForm.password })
    } catch {
      toast.success('Offline Registration Successful! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 800)
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden font-sans relative">
      
      {/* Soft Aurora Blurred Background Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-gradient-to-tr from-[#00D4AA]/8 to-[#00E5FF]/4 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-gradient-to-tr from-[#00FF87]/8 to-[#00D4AA]/3 blur-[130px] pointer-events-none" />

      {/* Connected dot particles overlay */}
      <ParticleCanvas />

      {/* Smooth Cursor Radial Glow */}
      {!isMobile && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 w-[300px] h-[300px] rounded-full opacity-15 blur-[90px] z-50 bg-[#00FF88]"
          style={{
            x: springX,
            y: springY,
            translateX: '-50%',
            translateY: '-50%',
          }}
        />
      )}

      {/* ============================================================
          GLASSMORPHIC NAVBAR
         ============================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#020817]/75 border-b border-white/[0.06] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo with glowing leaf icon */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleScrollToSection('home')}>
            <motion.div
              whileHover={{ rotate: 15, scale: 1.05 }}
              className="w-9 h-9 bg-gradient-to-br from-[#00FF87] to-[#00D4AA] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,135,0.4)]"
            >
              <Leaf size={16} className="text-[#020817]" />
            </motion.div>
            <span className="text-xl font-black bg-gradient-to-r from-[#00FF87] to-[#00D4AA] bg-clip-text text-transparent filter drop-shadow-[0_0_8px_rgba(0,255,135,0.2)]">
              GreenRoute AI
            </span>
          </div>

          {/* Underlined slide nav links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#home" label="Home" active={activeTab === 'home'} onClick={() => handleScrollToSection('home')} />
            <NavLink href="#features" label="Features" active={activeTab === 'features'} onClick={() => handleScrollToSection('features')} />
            <NavLink href="#how-it-works" label="How It Works" active={activeTab === 'how-it-works'} onClick={() => handleScrollToSection('how-it-works')} />
            <NavLink href="#about" label="About" active={activeTab === 'about'} onClick={() => handleScrollToSection('about')} />
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleScrollToSection('auth')}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-transparent hover:border-white/10 rounded-xl transition-all"
            >
              Sign In
            </button>
            <motion.button
              onClick={() => handleScrollToSection('auth')}
              whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0, 255, 135, 0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2.5 text-sm font-bold text-[#020817] rounded-xl bg-gradient-to-r from-[#00FF87] to-[#00D4AA] shadow-[0_4px_12px_rgba(0,255,135,0.2)]"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ============================================================
          HERO SECTION (Full Screen)
         ============================================================ */}
      <section id="home" className="min-h-screen pt-20 flex flex-col justify-center relative px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full z-10 py-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <motion.h1
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.08] tracking-tight"
            >
              Drive{' '}
              <motion.span
                animate={{ textShadow: ['0 0 10px rgba(0,255,135,0.3)', '0 0 25px rgba(0,255,135,0.6)', '0 0 10px rgba(0,255,135,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-gradient-to-r from-[#00FF87] to-[#00D4AA] bg-clip-text text-transparent"
              >
                Greener.
              </motion.span>
              <br />
              Think{' '}
              <motion.span
                animate={{ textShadow: ['0 0 10px rgba(0,255,135,0.3)', '0 0 25px rgba(0,255,135,0.6)', '0 0 10px rgba(0,255,135,0.3)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="bg-gradient-to-r from-[#00FF87] to-[#00D4AA] bg-clip-text text-transparent"
              >
                Smarter.
              </motion.span>
            </motion.h1>

            <div className="h-14 md:h-10">
              <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-xl">
                {typewriterText}
                <span className="text-[#00FF87] animate-pulse ml-0.5">▋</span>
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-4"
            >
              <motion.button
                onClick={() => handleScrollToSection('auth')}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 24px rgba(0, 255, 135, 0.45)',
                  borderColor: 'rgba(0, 255, 135, 0.8)',
                }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-4 text-base font-black text-[#020817] rounded-2xl bg-gradient-to-r from-[#00FF87] to-[#00D4AA] border border-[#00FF87]/20 flex items-center gap-2 transition-all duration-300"
              >
                Start Free <ArrowRight size={16} />
              </motion.button>

              <motion.button
                onClick={() => handleScrollToSection('features')}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: 'rgba(0, 255, 135, 0.05)',
                  boxShadow: '0 0 20px rgba(0, 255, 135, 0.25)',
                  borderColor: '#00FF87',
                }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 text-base font-semibold text-[#00FF87] bg-transparent border-2 border-[#00FF87]/30 rounded-2xl transition-all duration-300"
              >
                See How It Works
              </motion.button>
            </motion.div>
          </div>

          {/* Hero Right Visual: Rotating Tracing Globe + Floating badges */}
          <div className="lg:col-span-5 flex justify-center relative mt-10 lg:mt-0">
            <EarthGlobe />

            {/* Floating Stats Badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[-15px] bottom-[20%] p-3.5 rounded-2xl bg-[#0F1A2E]/80 border border-white/10 backdrop-blur-md text-left z-20 shadow-xl"
            >
              <div className="text-lg font-black text-[#00FF87]">
                <AnimatedCounter value={2.3} suffix="M" decimals={1} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">kg CO₂ Saved</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute right-[-10px] top-[15%] p-3.5 rounded-2xl bg-[#0F1A2E]/80 border border-white/10 backdrop-blur-md text-left z-20 shadow-xl"
            >
              <div className="text-lg font-black text-[#00E5FF]">
                <AnimatedCounter value={99.2} suffix="%" decimals={1} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Accuracy</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}
              className="absolute right-[10px] bottom-[10%] p-3.5 rounded-2xl bg-[#0F1A2E]/80 border border-white/10 backdrop-blur-md text-left z-20 shadow-xl"
            >
              <div className="text-lg font-black text-white">
                <AnimatedCounter value={48} suffix="" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cities Active</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION
         ============================================================ */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-10"
      >
        
        {/* Draw line animated on enter */}
        <RevealSection className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00FF87]/30 bg-[#00FF87]/5 text-sm text-[#00FF87] mb-6">
            <Zap size={14} /> Features Portfolio
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Driving Efficiency via <span className="gradient-text">Route Intelligence</span>
          </h2>
          <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
            Explore our advanced suite of sustainable mobility systems.
          </p>

          <div className="w-40 h-0.5 mx-auto mt-6 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00FF87] to-[#00D4AA]"
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </RevealSection>

        {/* 2x2 grid feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <FeatureCard
            icon={Leaf}
            title="CO₂ Emission Mitigation"
            desc="Gemini-optimized route recommendations that slash carbon output by avoiding stops and traffic bottlenecks."
            stat={43} suffix="% Reduction"
            delay={0.1}
          />
          <FeatureCard
            icon={RotateCw}
            title="Dynamic OSRM Routings"
            desc="Calculates 3 variants (Fastest, Shortest, and Greenest) on actual road networks in real time."
            stat={3} suffix="Route Options"
            delay={0.2}
          />
          <FeatureCard
            icon={Brain}
            title="Multi-Vehicle Calibration"
            desc="Optimizes EcoScores based on fuel type, engine capacity, and vehicle weight (Petrol to EV)."
            stat={6} suffix="Vehicle Categories"
            delay={0.3}
          />
          <FeatureCard
            icon={Star}
            title="Gamified Sustainability Achievements"
            desc="Unlock eco milestones, collect performance badges, and challenge friends on the leaderboard."
            stat={15} suffix="+ Milestones"
            delay={0.4}
          />
        </div>
      </motion.section>

      {/* ============================================================
          HOW IT WORKS SECTION
         ============================================================ */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-24 relative overflow-hidden bg-[#0A0F1E]"
      >
        
        {/* subtle green grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none animate-grid-pattern"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 255, 135, 0.1) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(0, 255, 135, 0.1) 1.5px, transparent 1.5px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <RevealSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How GreenRoute <span className="gradient-text">Works</span>
            </h2>
            <p className="text-slate-400 text-lg">Achieving carbon balance in three simple steps</p>
          </RevealSection>

          {/* Three steps connected by animated dashed lines */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Dashed connector line */}
            <div className="hidden md:block absolute top-[56px] left-[16.6%] right-[16.6%] w-[66.8%] h-4 pointer-events-none z-0">
              <svg className="w-full h-full animate-pulse" viewBox="0 0 100 10" preserveAspectRatio="none">
                <motion.path
                  d="M 0,5 L 100,5"
                  fill="none"
                  stroke="#00FF87"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  initial={{ strokeDashoffset: 80 }}
                  animate={{ strokeDashoffset: [80, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
              </svg>
            </div>

            {/* Step 1 */}
            <RevealSection delay={0.1} className="text-center relative">
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-3xl bg-[#0F1A2E] border border-[#00FF87]/20 shadow-[0_0_24px_rgba(0,255,135,0.05)]">
                <MapPin size={36} className="text-[#00FF87]" />
                <motion.div
                  className="absolute w-12 h-12 bg-[#00FF87]/15 rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">1. Enter Your Route</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Specify origin, destination, and vehicle details to configure parameters.
              </p>
            </RevealSection>

            {/* Step 2 */}
            <RevealSection delay={0.3} className="text-center relative">
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-3xl bg-[#0F1A2E] border border-[#00E5FF]/20 shadow-[0_0_24px_rgba(0,229,255,0.05)]">
                <Brain size={36} className="text-[#00E5FF]" />
                <motion.div
                  className="absolute w-16 h-16 border-2 border-dashed border-[#00E5FF]/40 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">2. AI Analyzes Options</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Gemini routes are computed against road metrics to maximize efficiency and EcoScores.
              </p>
            </RevealSection>

            {/* Step 3 */}
            <RevealSection delay={0.5} className="text-center relative overflow-hidden">
              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center rounded-3xl bg-[#0F1A2E] border border-[#00FF87]/20 shadow-[0_0_24px_rgba(0,255,135,0.05)]">
                <Leaf size={36} className="text-[#00FF87]" />
                {/* Floating upward particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-[#00FF87] rounded-full"
                      style={{ left: `${25 + Math.random() * 50}%`, bottom: '20%' }}
                      animate={{ y: [0, -35], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">3. Drive Green, Save CO₂</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Adopt green paths, cut emissions, unlock achievements, and see cumulative offsets.
              </p>
            </RevealSection>

          </div>
        </div>
      </motion.section>

      {/* ============================================================
          AUTH SECTION (Sign In / Sign Up toggle)
         ============================================================ */}
      <motion.section
        id="auth"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-28 px-6 md:px-12 max-w-5xl mx-auto relative z-10 flex justify-center"
      >
        <div
          className="w-full rounded-3xl border p-8 md:p-12 lg:p-14"
          style={{
            background: '#0F1A2E',
            borderColor: 'rgba(0, 255, 135, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 255, 135, 0.08), inset 0 0 20px rgba(0, 255, 135, 0.02)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Auth Left Form Card */}
            <div className="lg:col-span-6 flex justify-center w-full">
              <div className="w-full max-w-md">
                {/* Tab slide toggles */}
                <div className="flex rounded-xl p-1 mb-8 bg-[#070D19] border border-white/5 relative">
                  {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setAuthTab(id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all relative z-10"
                      style={{ color: authTab === id ? '#020817' : '#94A3B8' }}
                    >
                      {authTab === id && (
                        <motion.div
                          layoutId="tab-highlight"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{ background: 'linear-gradient(135deg, #00FF87, #00D4AA)' }}
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        />
                      )}
                      {label}
                    </button>
                  ))}
                </div>

                {/* Header Title */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-white mb-1">
                    {authTab === 'login' ? 'Access Portal' : 'Start Journey'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {authTab === 'login' ? 'Access your dynamic AI route analytics dashboard.' : 'Sign up to configure vehicles and track CO₂ emissions.'}
                  </p>
                </div>

                {/* Form Forms */}
                <AnimatePresence mode="wait">
                  {authTab === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      onSubmit={handleLoginSubmit}
                      className="space-y-4"
                    >
                      <AuthInput icon={Mail} type="email" name="email" placeholder="Email Address" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
                      <AuthInput
                        icon={Lock}
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        error={errors.password}
                      />

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded bg-slate-900 border-white/10" style={{ accentColor: '#00FF87' }} />
                          Remember me
                        </label>
                        <button type="button" className="text-[#00FF87] hover:underline">Forgot Password?</button>
                      </div>

                      <AuthSubmitButton label="Sign In" loading={authLoading} />

                      <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                        <p className="text-[10px] text-slate-500 mb-0.5">Quick Demo credentials</p>
                        <p className="text-xs text-[#00FF87] font-mono">demo@greenroute.ai / demo123</p>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      onSubmit={handleSignupSubmit}
                      className="space-y-3.5"
                    >
                      <AuthInput icon={User} name="username" placeholder="Username (min 3 characters)" value={signupForm.username} onChange={e => signupForm.username !== e.target.value && setSignupForm(f => ({ ...f, username: e.target.value }))} error={errors.username} />
                      <AuthInput icon={Mail} type="email" name="email" placeholder="Email Address" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} error={errors.email} />
                      <AuthInput
                        icon={Lock}
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Password (min 8 chars)"
                        value={signupForm.password}
                        onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                        error={errors.password}
                      />
                      <AuthInput icon={Lock} type="password" name="confirm" placeholder="Confirm Password" value={signupForm.confirm} onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />

                      <AuthSubmitButton label="Register Account" loading={authLoading} />
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Auth Right Visual Panel */}
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-between h-full w-full">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <EarthGlobe className="w-40 h-40 md:w-48 md:h-48 flex-shrink-0" />
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white">
                    Enter the <span className="gradient-text">Green Mobility</span> Portal
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                    Configure your vehicles, log completed eco-trips, earn XP milestones, and compare daily carbon savings.
                  </p>
                </div>
              </div>

              {/* Animated Stats with Count-Up Numbers */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#070D19]/60 border border-white/5 text-center">
                  <div className="text-lg font-black text-[#00FF87]">
                    <AnimatedCounter value={2.3} suffix="M" decimals={1} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CO₂ Saved</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070D19]/60 border border-white/5 text-center">
                  <div className="text-lg font-black text-[#00E5FF]">
                    <AnimatedCounter value={99.2} suffix="%" decimals={1} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</p>
                </div>
                <div className="p-3 rounded-xl bg-[#070D19]/60 border border-white/5 text-center">
                  <div className="text-lg font-black text-white">
                    <AnimatedCounter value={48} suffix="" />
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Cities</p>
                </div>
              </div>

              {/* Feature list with check icons */}
              <div className="space-y-2">
                {[
                  'Mitigate fleet carbon footprints in real-time.',
                  'Access Explainable AI reasoning chains for routing.',
                  'Download detailed travel and sustainability PDF reports.',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#070D19]/40 border border-white/[0.04]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/25 flex items-center justify-center text-[#00FF87] flex-shrink-0">
                      <Check size={10} />
                    </div>
                    <span className="text-xs text-slate-300 font-medium">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ============================================================
          TESTIMONIALS & REVIEWS
         ============================================================ */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10"
      >
        <RevealSection className="text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-2">
            Trusted by <span className="gradient-text">50K+ Commuters</span>
          </h2>
          <p className="text-slate-500 text-sm">Join the sustainable transport revolution</p>
        </RevealSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Priya Sharma', role: 'Fleet Manager', quote: "Reduced our fleet's CO₂ output by 34% inside 3 months. The digital twin tool is exceptionally accurate.", rating: 5 },
            { name: 'Arjun Mehta', role: 'Daily Commuter', quote: 'Saves me almost ₹2,000 monthly on fuel. The gamified milestones make eco-driving addicting!', rating: 5 },
            { name: 'Ravi Kumar', role: 'Logistics Head', quote: 'AI forecasting cut down delivery delay costs by 22%. It is easily the best green investment we have made.', rating: 5 }
          ].map(({ name, role, quote, rating }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-[#0F1A2E]/80 border transition-all duration-300"
              style={{ borderColor: 'rgba(0, 255, 135, 0.12)' }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: rating }).map((_, j) => (
                  <Star key={j} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-5 italic font-medium">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF87] to-[#00D4AA] flex items-center justify-center text-[#020817] font-black text-xs">
                  {name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{name}</p>
                  <p className="text-[10px] text-slate-500">{role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ============================================================
          FOOTER
         ============================================================ */}
      <footer className="border-t border-white/[0.05] py-14 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00FF87] to-[#00D4AA] rounded-lg flex items-center justify-center">
                <Leaf size={15} className="text-[#020817]" />
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-[#00FF87] to-[#00D4AA] bg-clip-text text-transparent">
                GreenRoute AI
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Premium sustainable transport intelligence platform built for local commutes and corporate fleets.
            </p>
          </div>

          {[
            { title: 'Product', links: ['Route Planner', 'Carbon Dashboard', 'Fleet Manager', 'Digital Twin'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] }
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-black text-slate-300 mb-4 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-500 text-xs hover:text-[#00FF87] transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">© 2026 GreenRoute AI. Built for a greener planet. 🌿</p>
          <div className="flex items-center gap-5">
            {['🌱 Carbon Neutral', '🤖 Powered by Gemini AI', '🔒 SOC2 Compliant'].map(b => (
              <span key={b} className="text-[10px] text-slate-600 font-semibold">{b}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
