import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Map, Zap, CloudSun, Cpu, Truck,
  Brain, Trophy, User, ChevronLeft, ChevronRight, Leaf,
  BarChart3, Activity
} from 'lucide-react'
import useStore from '../store/useStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#00D4AA' },
  { path: '/planner', label: 'Route Planner', icon: Map, color: '#3B82F6' },
  { path: '/carbon-intelligence', label: 'Carbon Intel', icon: Zap, color: '#00FF88' },
  { path: '/climate-center', label: 'Climate Center', icon: CloudSun, color: '#06B6D4' },
  { path: '/digital-twin', label: 'Digital Twin', icon: Cpu, color: '#8B5CF6' },
  { path: '/fleet', label: 'Fleet Manager', icon: Truck, color: '#F59E0B' },
  { path: '/forecasting', label: 'Forecasting', icon: Activity, color: '#EC4899' },
  { path: '/xai', label: 'Explainable AI', icon: Brain, color: '#EF4444' },
  { path: '/achievements', label: 'Achievements', icon: Trophy, color: '#F59E0B' },
  { path: '/profile', label: 'Profile', icon: User, color: '#64748B' },
]

const Sidebar = () => {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, user } = useStore()

  const displayName = user?.username || user?.name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen sticky top-0 flex flex-col border-r border-white/5 overflow-hidden flex-shrink-0 z-40"
      style={{ background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo Area */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
          <Leaf size={16} className="text-navy" />
        </div>
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base font-bold gradient-text whitespace-nowrap"
          >
            GreenRoute AI
          </motion.span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(({ path, label, icon: Icon, color }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              title={sidebarCollapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                    border: `1px solid ${color}30`,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                className="flex-shrink-0 relative z-10 transition-transform group-hover:scale-110"
                style={{ color: active ? color : undefined }}
              />
              {!sidebarCollapsed && (
                <motion.span
                  className="text-sm font-medium relative z-10 whitespace-nowrap"
                  style={{ color: active ? color : undefined }}
                >
                  {label}
                </motion.span>
              )}
              {/* Active dot */}
              {active && !sidebarCollapsed && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 relative z-10"
                  style={{ background: color }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/5 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-navy font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="mt-2 w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-primary hover:bg-white/5 transition-all duration-200"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={16} />
            : (
              <span className="flex items-center gap-2 text-xs">
                <ChevronLeft size={16} />
                Collapse
              </span>
            )
          }
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
