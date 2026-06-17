import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Leaf, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import useAuth from '../hooks/useAuth'

// ============================================================
// Input Field
// ============================================================
const FormInput = ({ icon: Icon, type = 'text', placeholder, value, onChange, name, rightSlot }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
      <Icon size={16} />
    </div>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      onFocus={e => { e.target.style.borderColor = '#00D4AA'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,170,0.1)' }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
    />
    {rightSlot && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>
    )}
  </div>
)

// ============================================================
// Login Form
// ============================================================
const LoginForm = ({ onSwitch }) => {
  const { login, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = e => { e.preventDefault(); login(form) }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput icon={Mail} type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} />
      <FormInput
        icon={Lock}
        type={showPass ? 'text' : 'password'}
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        rightSlot={
          <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-primary transition-colors">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input type="checkbox" className="rounded" style={{ accentColor: '#00D4AA' }} />
          Remember me
        </label>
        <button type="button" className="text-primary hover:text-accent transition-colors">
          Forgot password?
        </button>
      </div>

      <motion.button
        type="submit"
        disabled={loading || !form.email || !form.password}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl font-bold text-navy text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)', boxShadow: '0 8px 24px rgba(0,212,170,0.3)' }}
      >
        {loading ? (
          <div className="spinner w-5 h-5" />
        ) : (
          <>
            Sign In
            <ArrowRight size={16} />
          </>
        )}
      </motion.button>

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary hover:text-accent font-semibold transition-colors">
          Sign up free
        </button>
      </p>

      {/* Demo credentials */}
      <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02] text-center">
        <p className="text-xs text-slate-500 mb-1">Demo credentials</p>
        <p className="text-xs text-slate-400 font-mono">demo@greenroute.ai / demo123</p>
      </div>
    </form>
  )
}

// ============================================================
// Signup Form
// ============================================================
const SignupForm = ({ onSwitch }) => {
  const { signup, loading } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(errs => ({ ...errs, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.username.trim() || form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters'
    if (!form.email.includes('@')) errs.email = 'Valid email required'
    if (form.password.length < 8) errs.password = 'Minimum 8 characters required'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    signup({ username: form.username, email: form.email, password: form.password })
  }

  const benefits = ['Free forever', 'No credit card', 'Instant access', 'Cancel anytime']

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <FormInput icon={User} name="username" placeholder="Username (min. 3 chars)" value={form.username} onChange={handleChange} />
        {errors.username && <p className="text-red-400 text-xs mt-1 ml-1">{errors.username}</p>}
      </div>
      <div>
        <FormInput icon={Mail} type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} />
        {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
      </div>
      <div>
        <FormInput
          icon={Lock}
          type={showPass ? 'text' : 'password'}
          name="password"
          placeholder="Password (min. 8 chars)"
          value={form.password}
          onChange={handleChange}
          rightSlot={
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-500 hover:text-primary transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
      </div>
      <div>
        <FormInput icon={Lock} type="password" name="confirm" placeholder="Confirm password" value={form.confirm} onChange={handleChange} />
        {errors.confirm && <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirm}</p>}
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl font-bold text-navy text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)', boxShadow: '0 8px 24px rgba(0,212,170,0.3)' }}
      >
        {loading ? <div className="spinner w-5 h-5" /> : (<><Leaf size={16} />Create Free Account</>)}
      </motion.button>

      <div className="flex flex-wrap gap-2 justify-center">
        {benefits.map(b => (
          <div key={b} className="flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle size={11} className="text-primary" />
            {b}
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary hover:text-accent font-semibold transition-colors">
          Sign in
        </button>
      </p>
    </form>
  )
}

// ============================================================
// Right Visual Panel
// ============================================================
const HeroPanel = () => {
  const features = [
    { icon: '🌿', label: 'Reduce CO₂ Emissions', sub: 'Up to 43% per trip' },
    { icon: '⚡', label: 'AI Route Optimization', sub: 'Powered by Gemini AI' },
    { icon: '📊', label: 'Real-time Analytics', sub: 'Live emission tracking' },
    { icon: '🏆', label: 'Earn Achievements', sub: 'Gamified sustainability' },
  ]

  return (
    <div className="flex flex-col justify-center h-full p-8 lg:p-12">
      {/* Animated earth */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="text-8xl mb-8 select-none"
        style={{ display: 'inline-block', filter: 'drop-shadow(0 0 30px rgba(0,212,170,0.4))' }}
      >
        🌍
      </motion.div>

      <h2 className="text-3xl font-black text-slate-100 mb-2">
        Drive <span className="gradient-text">Greener</span> Today
      </h2>
      <p className="text-slate-400 mb-8 leading-relaxed">
        Join 50,000+ users reducing their carbon footprint with AI-powered route intelligence.
      </p>

      <div className="space-y-3">
        {features.map(({ icon, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-4 p-3.5 rounded-xl border border-white/8 bg-white/[0.03]"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-200">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-8">
        {[
          { num: '2.3M', label: 'kg CO₂ Saved' },
          { num: '48', label: 'Cities' },
          { num: '99.2%', label: 'Accuracy' },
        ].map(({ num, label }) => (
          <div key={label} className="text-center p-3 rounded-xl border border-white/8 bg-white/[0.03]">
            <div className="text-lg font-black gradient-text">{num}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main Auth Page
// ============================================================
const AuthPage = () => {
  const [tab, setTab] = useState('login')

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,212,170,0.06)_0%,transparent_60%)]" />

      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Leaf size={20} className="text-navy" />
            </div>
            <span className="text-2xl font-black gradient-text">GreenRoute AI</span>
          </div>

          {/* Card */}
          <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-[20px]">
            {/* Tab switcher */}
            <div className="flex rounded-xl p-1 mb-8 bg-white/[0.04] border border-white/8">
              {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative"
                  style={{
                    color: tab === id ? '#0A0F1E' : '#64748B',
                  }}
                >
                  {tab === id && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)' }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-100 mb-1">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-slate-500 text-sm">
                {tab === 'login'
                  ? 'Sign in to your GreenRoute dashboard'
                  : 'Start your sustainable journey today'}
              </p>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
              >
                {tab === 'login'
                  ? <LoginForm onSwitch={() => setTab('signup')} />
                  : <SignupForm onSwitch={() => setTab('login')} />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms</a> &amp;{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>

      {/* Right: Hero visual (hidden on mobile) */}
      <div
        className="hidden lg:flex w-[480px] flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.05), rgba(0,255,136,0.02))' }}
      >
        <div className="absolute inset-0 border-l border-white/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/3 rounded-full blur-3xl" />
        <div className="relative z-10 w-full">
          <HeroPanel />
        </div>
      </div>
    </div>
  )
}

export default AuthPage
