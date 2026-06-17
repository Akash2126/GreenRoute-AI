import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Plus, X, Car, Zap, Bike, Bus, BarChart2, Star } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GlassCard from '../components/GlassCard'
import EcoScoreMeter from '../components/EcoScoreMeter'
import AnimatedCounter from '../components/AnimatedCounter'
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton'
import { fleetService } from '../services/forecastService'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

// ============================================================
// Demo fleet data
// ============================================================
const mockVehicles = [
  { id: 1, name: 'KA-01-AB-1234', type: 'car_petrol', model: 'Honda City', trips: 42, co2_saved: 48.2, eco_score: 74, last_trip: '2025-06-11', status: 'active' },
  { id: 2, name: 'KA-02-CD-5678', type: 'car_electric', model: 'Tata Nexon EV', trips: 88, co2_saved: 182.4, eco_score: 92, last_trip: '2025-06-12', status: 'active' },
  { id: 3, name: 'KA-03-EF-9012', type: 'motorcycle', model: 'Royal Enfield', trips: 28, co2_saved: 22.1, eco_score: 68, last_trip: '2025-06-10', status: 'active' },
  { id: 4, name: 'KA-05-GH-3456', type: 'truck', model: 'Tata Prima', trips: 15, co2_saved: 34.6, eco_score: 61, last_trip: '2025-06-09', status: 'inactive' },
]

const vehicleIcons = { car_petrol: '🚗', car_electric: '⚡', motorcycle: '🏍️', bus: '🚌', truck: '🚛' }
const vehicleColors = { car_petrol: '#F59E0B', car_electric: '#00D4AA', motorcycle: '#8B5CF6', bus: '#3B82F6', truck: '#EF4444' }

const genFleetChart = () =>
  Array.from({ length: 14 }, (_, i) => ({
    date: format(subDays(new Date(), 13 - i), 'MMM dd'),
    v1: +(1.2 + Math.random()).toFixed(2),
    v2: +(0.4 + Math.random() * 0.5).toFixed(2),
    v3: +(0.8 + Math.random() * 0.8).toFixed(2),
    v4: +(1.5 + Math.random() * 1.2).toFixed(2),
  }))

const fleetBarData = mockVehicles.map(v => ({
  name: v.name.slice(-8),
  eco: v.eco_score,
  co2: v.co2_saved,
  color: vehicleColors[v.type],
}))

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Vehicle Card
// ============================================================
const VehicleCard = ({ vehicle }) => {
  const typeColor = vehicleColors[vehicle.type] || '#64748B'
  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{vehicleIcons[vehicle.type] || '🚗'}</span>
            <div>
              <p className="text-sm font-bold text-slate-200">{vehicle.name}</p>
              <p className="text-xs text-slate-500">{vehicle.model}</p>
            </div>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: `${typeColor}15`,
              color: typeColor,
              border: `1px solid ${typeColor}25`,
            }}
          >
            {vehicle.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${vehicle.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-500'}`}>
          {vehicle.status}
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <EcoScoreMeter score={vehicle.eco_score} size={120} showLabel={false} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Trips', val: vehicle.trips, color: '#3B82F6' },
          { label: 'CO₂ Saved', val: `${vehicle.co2_saved} kg`, color: '#00D4AA' },
        ].map(({ label, val, color }) => (
          <div key={label} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="font-bold" style={{ color }}>{val}</div>
            <div className="text-slate-500 text-[10px]">{label}</div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-600 mt-2 text-right">Last trip: {vehicle.last_trip}</p>
    </GlassCard>
  )
}

// ============================================================
// Add Vehicle Modal
// ============================================================
const AddVehicleModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', model: '', type: 'car_petrol' })
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name || !form.model) { toast.error('All fields required'); return }
    onAdd({ ...form, id: Date.now(), trips: 0, co2_saved: 0, eco_score: 0, last_trip: 'Never', status: 'active' })
    onClose()
    toast.success('Vehicle added! 🚗')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md p-6 rounded-2xl border border-white/10"
        style={{ background: '#0F1629' }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-200">Add Vehicle</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'name', placeholder: 'License Plate (e.g. KA-01-AB-1234)', label: 'License Plate' },
            { name: 'model', placeholder: 'Vehicle Model (e.g. Honda City)', label: 'Model' },
          ].map(({ name, placeholder, label }) => (
            <div key={name}>
              <label className="text-xs text-slate-500 mb-1 block">{label}</label>
              <input
                name={name} value={form[name]} onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Vehicle Type</label>
            <select
              name="type" value={form.type} onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-200 outline-none"
              style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {[
                { val: 'car_petrol', label: 'Car (Petrol)' },
                { val: 'car_electric', label: 'Car (Electric)' },
                { val: 'motorcycle', label: 'Motorcycle' },
                { val: 'bus', label: 'Bus' },
                { val: 'truck', label: 'Truck' },
              ].map(({ val, label }) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-navy text-sm"
            style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)' }}
          >
            Add Vehicle
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ============================================================
// Fleet Page
// ============================================================
const Fleet = () => {
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState(mockVehicles)
  const [showModal, setShowModal] = useState(false)
  const chartData = genFleetChart()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await fleetService.getFleet()
        if (data?.length) setVehicles(data)
      } catch {}
      setTimeout(() => setLoading(false), 600)
    }
    fetch()
  }, [])

  const addVehicle = (v) => setVehicles(prev => [...prev, v])

  const totalTrips = vehicles.reduce((s, v) => s + v.trips, 0)
  const totalCO2 = vehicles.reduce((s, v) => s + v.co2_saved, 0)
  const avgEco = Math.round(vehicles.reduce((s, v) => s + v.eco_score, 0) / vehicles.length)

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Truck size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-100">
                  Fleet <span className="gradient-text">Manager</span>
                </h1>
                <p className="text-slate-500 text-sm">Monitor and optimize your fleet sustainability</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #00D4AA, #00FF88)', color: '#0A0F1E' }}
            >
              <Plus size={16} />
              Add Vehicle
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : [
            { label: 'Total Vehicles', val: vehicles.length, color: '#3B82F6', icon: '🚗' },
            { label: 'Total Trips', val: totalTrips, color: '#8B5CF6', icon: '🗺️' },
            { label: 'CO₂ Saved', val: `${totalCO2.toFixed(1)} kg`, color: '#00D4AA', icon: '🌿' },
            { label: 'Avg EcoScore', val: avgEco, color: '#F59E0B', icon: '⭐' },
          ].map(({ label, val, color, icon }) => (
            <GlassCard key={label} className="p-5 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-2xl font-black" style={{ color }}>{val}</div>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {loading ? <SkeletonChart height={200} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Fleet EcoScore Comparison</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={fleetBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="eco" name="EcoScore" radius={[4, 4, 0, 0]}>
                      {fleetBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {loading ? <SkeletonChart height={200} /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Fleet CO₂ Trend (14 Days)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    {['v1', 'v2', 'v3', 'v4'].map((key, i) => {
                      const colors = ['#F59E0B', '#00D4AA', '#8B5CF6', '#EF4444']
                      return <Line key={key} type="monotone" dataKey={key} name={`V${i + 1}`} stroke={colors[i]} strokeWidth={1.5} dot={false} />
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}
        </div>

        {/* Vehicle Cards Grid */}
        <h2 className="text-base font-bold text-slate-200 mb-4">Fleet Vehicles ({vehicles.length})</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <VehicleCard vehicle={v} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showModal && <AddVehicleModal onClose={() => setShowModal(false)} onAdd={addVehicle} />}
      </AnimatePresence>
    </div>
  )
}

export default Fleet
