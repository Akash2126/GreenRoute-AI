import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, LayoutDashboard, Map, BarChart3, CloudLightning,
  Cpu, Truck, Brain, Trophy, User, Menu, X, ChevronDown,
  LogOut, Settings, Activity
} from 'lucide-react'
import useStore from '../store/useStore'

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'Route Planner', icon: Map },
  { path: '/carbon-intelligence', label: 'Analytics', icon: BarChart3 },
  { path: '/climate-center', label: 'Climate', icon: CloudLightning },
  { path: '/fleet', label: 'Fleet', icon: Truck },
]

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isAuthenticated, logout } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const dropRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setUserDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(10,15,30,0.95)] backdrop-blur-[20px] border-b border-white/10 shadow-lg shadow-black/30'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-300">
              <Leaf size={18} className="text-navy" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">GreenRoute AI</span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      active
                        ? 'text-primary'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                    {active && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card hover:border-primary/30 transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-navy font-bold text-xs">
                    {initials}
                  </div>
                  <span className="text-sm text-slate-300 hidden sm:block">{user?.name || user?.email?.split('@')[0]}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${userDropOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userDropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 glass-card border border-white/10 shadow-xl shadow-black/50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-slate-200">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {[
                          { to: '/profile', icon: User, label: 'Profile' },
                          { to: '/achievements', icon: Trophy, label: 'Achievements' },
                          { to: '/dashboard', icon: Activity, label: 'Dashboard' },
                        ].map(({ to, icon: Icon, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setUserDropOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Icon size={15} />
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border-t border-white/5 mt-1"
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" className="text-sm text-slate-300 hover:text-primary px-3 py-1.5 transition-colors">
                  Login
                </Link>
                <Link
                  to="/auth"
                  className="btn-primary text-sm px-4 py-2 rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg glass-card text-slate-400 hover:text-primary transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[rgba(10,15,30,0.98)] backdrop-blur-[20px] border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {isAuthenticated
                ? navLinks.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === path
                          ? 'text-primary bg-primary/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))
                : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="btn-primary block text-center text-sm py-2.5 rounded-xl">
                    Get Started
                  </Link>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
