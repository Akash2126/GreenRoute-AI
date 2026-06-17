import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import useStore from './store/useStore'

// Pages
import LandingPage      from './pages/LandingPage'
import AuthPage         from './pages/AuthPage'
import Dashboard        from './pages/Dashboard'
import RoutePlanner     from './pages/RoutePlanner'
import CarbonIntelligence from './pages/CarbonIntelligence'
import ClimateCenter    from './pages/ClimateCenter'
import DigitalTwin      from './pages/DigitalTwin'
import Forecasting      from './pages/Forecasting'
import XAIDashboard     from './pages/XAIDashboard'
import Achievements     from './pages/Achievements'
import Fleet            from './pages/Fleet'
import Profile          from './pages/Profile'

// ─── Page transition wrapper ─────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.2, ease: 'easeIn' } },
}

function PageTransition({ children }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Protected route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const token           = useStore((s) => s.token)
  // Also check localStorage fallback
  const hasToken = isAuthenticated || !!localStorage.getItem('greenroute_token')
  return hasToken ? children : <Navigate to="/auth" replace />
}

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-gray-400 text-sm">Loading GreenRoute AI…</span>
      </div>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 22, 41, 0.95)',
            color: '#E2E8F0',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00D4AA', secondary: '#0A0F1E' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#0A0F1E' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <InnerRoutes />
      </Suspense>
    </BrowserRouter>
  )
}

function InnerRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><LandingPage /></motion.div>} />
        <Route path="/auth" element={<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><AuthPage /></motion.div>} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Dashboard /></motion.div></ProtectedRoute>
        } />
        <Route path="/planner" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><RoutePlanner /></motion.div></ProtectedRoute>
        } />
        <Route path="/carbon-intelligence" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><CarbonIntelligence /></motion.div></ProtectedRoute>
        } />
        <Route path="/climate-center" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><ClimateCenter /></motion.div></ProtectedRoute>
        } />
        <Route path="/digital-twin" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><DigitalTwin /></motion.div></ProtectedRoute>
        } />
        <Route path="/forecasting" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Forecasting /></motion.div></ProtectedRoute>
        } />
        <Route path="/xai" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><XAIDashboard /></motion.div></ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Achievements /></motion.div></ProtectedRoute>
        } />
        <Route path="/fleet" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Fleet /></motion.div></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"><Profile /></motion.div></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
