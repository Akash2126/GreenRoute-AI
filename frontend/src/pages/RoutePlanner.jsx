import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Car, Zap, Bike, Bus, Truck,
  Leaf, Save, Loader2, Bot, Search, X, Clock, Fuel,
  Wind, BarChart2, ArrowUpDown, ChevronDown, ChevronUp,
  Copy, Download, RotateCw, Check, Sparkles
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import EcoScoreMeter from '../components/EcoScoreMeter'
import Map from '../components/Map'
import useRoutes from '../hooks/useRoutes'
import { reportsService } from '../services/forecastService'
import toast from 'react-hot-toast'

// ─── Config ───────────────────────────────────────────────────
const VEHICLES = [
  { id: 'car_petrol',   emoji: '🚗', label: 'Petrol',   color: '#F59E0B' },
  { id: 'car_electric', emoji: '⚡', label: 'Electric', color: '#00D4AA' },
  { id: 'motorcycle',   emoji: '🏍️', label: 'Moto',    color: '#8B5CF6' },
  { id: 'bus',          emoji: '🚌', label: 'Bus',      color: '#3B82F6' },
  { id: 'truck',        emoji: '🚛', label: 'Truck',    color: '#EF4444' },
]

const ROUTE_CFG = {
  Fastest:  { color: '#3B82F6', icon: '⚡', grad: 'from-blue-500/20 to-blue-500/5'   },
  Shortest: { color: '#8B5CF6', icon: '📏', grad: 'from-purple-500/20 to-purple-500/5' },
  Greenest: { color: '#00D4AA', icon: '🌿', grad: 'from-teal-500/20 to-teal-500/5'   },
}

// ─── Typewriter ───────────────────────────────────────────────
const Typewriter = ({ text }) => {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setOut(''); setDone(false)
    if (!text) return
    let i = 0
    const t = setInterval(() => {
      if (i < text.length) { setOut(text.slice(0, ++i)) }
      else { setDone(true); clearInterval(t) }
    }, 18)
    return () => clearInterval(t)
  }, [text])
  return <p className="text-xs text-slate-300 leading-relaxed">{out}{!done && <span className="text-primary animate-pulse">▋</span>}</p>
}

// ─── Glass panel wrapper ──────────────────────────────────────
const Glass = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: 'rgba(10,15,30,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
      ...style,
    }}
  >
    {children}
  </div>
)

// ─── Route card ───────────────────────────────────────────────
const RouteCard = ({ route, selected, onSelect }) => {
  const cfg = ROUTE_CFG[route.type] || ROUTE_CFG.Greenest
  return (
    <motion.button
      onClick={() => onSelect(route)}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`w-full text-left rounded-2xl p-4 transition-all relative overflow-hidden`}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${cfg.color}18, ${cfg.color}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${selected ? cfg.color + '50' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: selected ? `0 4px 24px ${cfg.color}20` : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.icon}</span>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>{route.type} Route</span>
          {selected && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: `${cfg.color}25`, color: cfg.color }}
            >
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500">EcoScore</span>
          <span className="text-sm font-black" style={{ color: '#00FF88' }}>{route.ecoScore}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-xs">
        {[
          { i: '📏', v: `${route.distance}km` },
          { i: '⏱',  v: `${route.time}min` },
          { i: '⛽',  v: `${route.fuel}L` },
          { i: '🌿',  v: `${route.co2}kg`, c: cfg.color },
        ].map(({ i, v, c }) => (
          <div key={v} className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl bg-white/[0.04]">
            <span className="text-base leading-none">{i}</span>
            <span className="font-bold leading-none" style={{ color: c || '#94a3b8' }}>{v}</span>
          </div>
        ))}
      </div>
    </motion.button>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function RoutePlanner() {
  const [src, setSrc]   = useState('')
  const [dst, setDst]   = useState('')
  const [vehicle, setVehicle] = useState('car_petrol')
  const [showDetails, setShowDetails] = useState(false)
  const [isAiExpanded, setIsAiExpanded] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const {
    routes, selectedRoute, setSelectedRoute,
    planRoute, saveRoute, loading, aiAdvice,
  } = useRoutes()

  const adviceObj = typeof aiAdvice === 'string'
    ? {
        route_recommendation: aiAdvice,
        sustainability_insights: [
          'Eco-routing prioritizes roads with smoother traffic flow, reducing emissions.',
          'Higher speed profiles increase wind resistance and tailpipe output.',
          'Congestion segments result in high idle emissions; green routing bypasses these.'
        ],
        carbon_reduction_suggestions: [
          'Consider combining multiple errands into a single trip to reduce your footprint.',
          'Travel during off-peak hours to avoid heavy bumper-to-bumper traffic.',
          'Accelerate smoothly and keep speed stable to lower engine load.'
        ],
        fuel_saving_suggestions: [
          '60-80 km/h optimal speed limit',
          'Minimize hard braking',
          'Turn off engine when idle > 30s'
        ],
        alternative_transportation: [
          '🚶 Walking: Saves ~0.4 kg CO₂ per km. Ideal for trips under 2 km.',
          '🚴 Cycling: A clean, 0-emission alternative for short commuting.',
          '🚇 Metro/Bus: Greatly reduces personal per-commute emissions.'
        ],
        environmental_impact_summary: 'Consistently choosing this green route reduces carbon output and saves fuel.'
      }
    : aiAdvice;

  const handleCopy = () => {
    if (!adviceObj) return
    const textToCopy = `AI Route Recommendation:\n${adviceObj.route_recommendation}\n\nSustainability Insights:\n${adviceObj.sustainability_insights?.map(x => `• ${x}`).join('\n')}\n\nCarbon Reduction Suggestions:\n${adviceObj.carbon_reduction_suggestions?.map(x => `• ${x}`).join('\n')}\n\nFuel Saving Suggestions:\n${adviceObj.fuel_saving_suggestions?.map(x => `• ${x}`).join('\n')}\n\nAlternative Transportation:\n${adviceObj.alternative_transportation?.map(x => `• ${x}`).join('\n')}\n\nSummary:\n${adviceObj.environmental_impact_summary}`
    navigator.clipboard.writeText(textToCopy)
    toast.success('Recommendation copied! 📋')
  }

  const handleDownloadPdf = async () => {
    if (!selectedRoute || !adviceObj) return
    setDownloadingPdf(true)
    try {
      const payload = {
        ai_advice: adviceObj,
        trip_info: {
          source: src,
          destination: dst,
          vehicle_type: vehicle,
          distance_km: selectedRoute.distance,
          travel_time_min: selectedRoute.time,
          ecoscore: selectedRoute.ecoScore
        }
      }
      const pdfBlob = await reportsService.generateAISummaryReport(payload)
      const blobUrl = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', `greenroute_ai_summary_${src.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success('AI Summary PDF downloaded! 📄')
    } catch (err) {
      console.error('Failed to download PDF:', err)
      toast.error('Could not download AI Summary PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleRegenerate = async () => {
    await handlePlan()
  }

  const mapSrc = routes[0]?.coordinates?.[0] ?? null
  const mapDst = routes[0]?.coordinates?.at(-1) ?? null

  const handlePlan = async () => {
    if (!src.trim() || !dst.trim()) { toast.error('Enter source & destination'); return }
    await planRoute({ source: src, destination: dst, vehicle_type: vehicle })
    setShowDetails(true)
  }

  const handleSave = () => {
    if (!selectedRoute) return
    saveRoute({ ...selectedRoute, source: src, destination: dst, vehicle_type: vehicle })
  }

  const cfg = selectedRoute ? (ROUTE_CFG[selectedRoute.type] || ROUTE_CFG.Greenest) : null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0F1E' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area - Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="px-4 py-8 md:px-8">
        
        {/* Centered Widget Container (78% Width) */}
        <div className="w-[78%] mx-auto max-w-5xl space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Leaf className="text-primary animate-pulse" /> Route Intelligence Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Plan and simulate energy-efficient travel routes using real-time OSRM & geocoding data.
            </p>
          </div>

          {/* Search Inputs Card */}
          <Glass className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary border border-white flex-shrink-0" />
                  <input
                    value={src}
                    onChange={e => setSrc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePlan()}
                    placeholder="From — starting point"
                    className="w-full px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => { e.target.style.borderColor = '#00D4AA'; e.target.style.background = 'rgba(0,212,170,0.04)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white flex-shrink-0" />
                  <input
                    value={dst}
                    onChange={e => setDst(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePlan()}
                    placeholder="To — destination"
                    className="w-full px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => { e.target.style.borderColor = '#EF4444'; e.target.style.background = 'rgba(239,68,68,0.04)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={() => { setSrc(dst); setDst(src) }}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ArrowUpDown size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Bottom Row: Vehicles + Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
              {/* Vehicle selector */}
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
                {VEHICLES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVehicle(v.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                    style={{
                      background: vehicle === v.id ? `${v.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${vehicle === v.id ? v.color + '50' : 'rgba(255,255,255,0.06)'}`,
                      color: vehicle === v.id ? v.color : '#64748B',
                      boxShadow: vehicle === v.id ? `0 0 10px ${v.color}20` : 'none',
                    }}
                  >
                    <span className="text-sm">{v.emoji}</span> {v.label}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handlePlan}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-48 py-2.5 rounded-xl font-bold text-[#0A0F1E] text-sm flex items-center justify-center gap-2 disabled:opacity-60 relative overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00D4AA 0%, #00FF88 100%)', boxShadow: '0 4px 16px rgba(0,212,170,0.3)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                />
                <span className="relative flex items-center gap-2">
                  {loading ? <><Loader2 size={15} className="animate-spin" />Planning...</> : <><Search size={14} />Plan Green Route</>}
                </span>
              </motion.button>
            </div>
          </Glass>

          {/* Interactive Map Widget Card */}
          <div
            className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative w-full h-[500px] bg-[#0A0F1E]"
            style={{
              background: 'rgba(10,15,30,0.6)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Helper Empty State Overlay */}
            {routes.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center">
                  <div className="text-5xl mb-2">📍</div>
                  <p className="text-slate-300 font-bold text-sm">Enter route details above</p>
                  <p className="text-slate-500 text-xs mt-1">Real-time interactive road map will render here</p>
                </div>
              </div>
            )}

            <Map
              routes={routes}
              selectedRoute={selectedRoute}
              source={mapSrc}
              destination={mapDst}
              height="100%"
            />
          </div>

          {/* Route Info & Saving Controls below the map */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-100">Suggested Routes</h3>
                  <p className="text-xs text-slate-400">{src} → {dst}</p>
                </div>
                {selectedRoute && (
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{ background: `${cfg?.color}20`, color: cfg?.color }}
                  >
                    {cfg?.icon} {selectedRoute.type} selected
                  </span>
                )}
              </div>

              {/* Route options cards in a grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {routes.map(r => (
                  <RouteCard
                    key={r.id}
                    route={r}
                    selected={selectedRoute?.id === r.id}
                    onSelect={route => { setSelectedRoute(route); setShowDetails(true) }}
                  />
                ))}
              </div>

              {/* Selected route details panel */}
              {selectedRoute && showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EcoScore card */}
                  <div
                    className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]"
                    style={{ background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.15)' }}
                  >
                    <EcoScoreMeter score={selectedRoute.ecoScore || 0} size={100} />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Your EcoScore</p>
                      <p className="text-3xl font-black text-primary">{selectedRoute.ecoScore}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        {selectedRoute.ecoScore >= 75 ? '🌟 Excellent' : selectedRoute.ecoScore >= 55 ? '✅ Good' : '⚠️ Moderate'}
                      </p>
                    </div>
                  </div>

                  {/* Core stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Wind,       label: 'CO₂ Emissions',      value: `${selectedRoute.co2} kg`,       color: '#00D4AA' },
                      { icon: Fuel,       label: 'Fuel usage',         value: `${selectedRoute.fuel} L`,       color: '#F59E0B' },
                      { icon: Clock,      label: 'Travel time',        value: `${selectedRoute.time} min`,     color: '#3B82F6' },
                      { icon: Navigation, label: 'Road distance',      value: `${selectedRoute.distance} km`,  color: '#8B5CF6' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div
                        key={label}
                        className="p-3.5 rounded-xl flex items-center gap-3 bg-white/[0.02] border border-white/[0.06]"
                        style={{ background: `${color}08`, border: `1px solid ${color}15` }}
                      >
                        <Icon size={16} style={{ color }} />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                          <p className="text-sm font-black" style={{ color }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparisons vs other options */}
                  {routes.length > 1 && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Estimated savings vs alternatives</p>
                      <div className="flex flex-wrap gap-6">
                        {routes.filter(r => r.id !== selectedRoute.id).map(r => (
                          <div key={r.id} className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">{ROUTE_CFG[r.type]?.icon} {r.type}:</span>
                            <span className="text-sm font-bold text-green-400">
                              −{Math.abs(r.co2 - selectedRoute.co2).toFixed(2)} kg CO₂
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Sustainability Assistant Panel */}
                  {aiAdvice && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="md:col-span-2 rounded-2xl overflow-hidden border border-white/10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10,15,30,0.85) 0%, rgba(15,22,41,0.95) 100%)',
                        boxShadow: '0 12px 40px rgba(0,212,170,0.15)',
                      }}
                    >
                      {/* Header */}
                      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/25 relative">
                            <Bot className="text-primary animate-pulse" size={20} />
                            <div className="absolute inset-0 rounded-xl bg-primary/10 animate-ping opacity-30" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                              AI Sustainability Assistant <Sparkles size={14} className="text-accent" />
                            </h3>
                            <p className="text-[10px] text-slate-500">Gemini-powered eco-commute insights</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopy}
                            title="Copy Recommendation"
                            className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 hover:text-primary hover:bg-white/[0.08] transition-all"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            title="Download AI PDF Summary"
                            className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 hover:text-primary hover:bg-white/[0.08] transition-all disabled:opacity-50"
                          >
                            {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                          <button
                            onClick={handleRegenerate}
                            title="Regenerate Insights"
                            className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 hover:text-primary hover:bg-white/[0.08] transition-all"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            onClick={() => setIsAiExpanded(!isAiExpanded)}
                            className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-slate-400 hover:text-primary hover:bg-white/[0.08] transition-all"
                          >
                            {isAiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Content Panel */}
                      <AnimatePresence initial={false}>
                        {isAiExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="p-5 space-y-6 overflow-hidden"
                          >
                            {/* Route Recommendation Summary */}
                            <div className="p-4 rounded-xl bg-primary/[0.02] border border-primary/10 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                              <div className="flex items-start gap-3.5">
                                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mt-0.5 text-primary">
                                  <Leaf size={16} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">Route Recommendation</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 border border-primary/25 rounded-full text-primary font-bold uppercase">Optimal Choice</span>
                                  </div>
                                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    {adviceObj?.route_recommendation}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Two-Column Grid: Insights & Suggestions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Sustainability Insights */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Sustainability Insights
                                </h4>
                                <div className="space-y-2">
                                  {adviceObj?.sustainability_insights?.map((ins, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.08 }}
                                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/20 transition-all flex items-start gap-2.5"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5 text-accent">
                                        <Check size={10} strokeWidth={3} />
                                      </div>
                                      <p className="text-xs text-slate-400 leading-relaxed">{ins}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              {/* Carbon Reduction Suggestions */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Carbon Reduction Suggestions
                                </h4>
                                <div className="space-y-2">
                                  {adviceObj?.carbon_reduction_suggestions?.map((sug, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.08 }}
                                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/20 transition-all flex items-start gap-2.5"
                                    >
                                      <span className="text-lg leading-none mt-0.5 flex-shrink-0">🌱</span>
                                      <p className="text-xs text-slate-400 leading-relaxed">{sug}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Fuel Saving Suggestions (Chips) */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Fuel Saving Suggestions
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {adviceObj?.fuel_saving_suggestions?.map((tip, i) => (
                                  <motion.span
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B] shadow-sm flex items-center gap-1.5"
                                  >
                                    <Fuel size={12} /> {tip}
                                  </motion.span>
                                ))}
                              </div>
                            </div>

                            {/* Alternative Transportation */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" /> Alternative Transportation Suggestions
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {adviceObj?.alternative_transportation?.map((alt, i) => {
                                  let icon = '🚶';
                                  if (alt.toLowerCase().includes('cycle') || alt.toLowerCase().includes('bike') || alt.toLowerCase().includes('cycling')) icon = '🚴';
                                  if (alt.toLowerCase().includes('metro') || alt.toLowerCase().includes('bus') || alt.toLowerCase().includes('train') || alt.toLowerCase().includes('transit')) icon = '🚇';

                                  return (
                                    <motion.div
                                      key={i}
                                      whileHover={{ y: -3 }}
                                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#8B5CF6]/25 transition-all text-center flex flex-col items-center gap-2"
                                    >
                                      <span className="text-2xl">{icon}</span>
                                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{alt}</p>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Environmental Impact KPI Cards */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" /> Environmental Impact Summary
                              </h4>
                              
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                  { label: 'CO₂ Saved', value: `${selectedRoute?.co2_saved_kg?.toFixed(2) || (selectedRoute?.co2 * 0.15).toFixed(2)} kg`, color: '#00D4AA', desc: 'vs standard driving' },
                                  { label: 'Fuel Saved', value: `${selectedRoute?.fuel_saved_l?.toFixed(2) || (selectedRoute?.fuel * 0.15).toFixed(2)} L`, color: '#F59E0B', desc: 'eco efficiency' },
                                  { label: 'Trees Offset', value: `${Math.max(1, Math.round((selectedRoute?.co2_saved_kg || 0) / 0.06)).toFixed(0)}`, color: '#22C55E', desc: 'tree absorption' },
                                  { label: 'EcoScore Impact', value: `+${(selectedRoute?.ecoScore * 0.12).toFixed(1)}%`, color: '#00FF88', desc: 'route viability' },
                                ].map(({ label, value, color, desc }) => (
                                  <div
                                    key={label}
                                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center"
                                    style={{ borderBottom: `2.5px solid ${color}` }}
                                  >
                                    <p className="text-[9px] text-slate-500 uppercase font-black">{label}</p>
                                    <p className="text-lg font-black mt-1" style={{ color }}>{value}</p>
                                    <p className="text-[8px] text-slate-600 mt-0.5">{desc}</p>
                                  </div>
                                ))}
                              </div>

                              <p className="text-[10px] text-slate-500 text-center italic mt-2.5">
                                "{adviceObj?.environmental_impact_summary}"
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Save Trip button */}
                  <div className="md:col-span-2">
                    <motion.button
                      onClick={handleSave}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(0,212,170,0.08)',
                        border: '1px solid rgba(0,212,170,0.25)',
                        color: '#00D4AA',
                      }}
                    >
                      <Save size={16} /> Save This Route
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
