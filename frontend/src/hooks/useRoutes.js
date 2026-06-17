import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import routeService from '../services/routeService'

// Mock fallback routes for demo mode
const generateMockRoutes = (source, destination) => [
  {
    id: 'fastest',
    type: 'Fastest',
    distance: 12.4,
    time: 22,
    fuel: 1.2,
    co2: 2.8,
    ecoScore: 68,
    coordinates: [
      [12.9716, 77.5946],
      [12.9800, 77.6000],
      [12.9900, 77.6100],
      [12.9950, 77.6200],
    ],
    color: '#3B82F6',
  },
  {
    id: 'shortest',
    type: 'Shortest',
    distance: 10.8,
    time: 28,
    fuel: 1.0,
    co2: 2.3,
    ecoScore: 74,
    coordinates: [
      [12.9716, 77.5946],
      [12.9750, 77.5980],
      [12.9820, 77.6050],
      [12.9950, 77.6200],
    ],
    color: '#8B5CF6',
  },
  {
    id: 'greenest',
    type: 'Greenest',
    distance: 11.6,
    time: 25,
    fuel: 0.8,
    co2: 1.6,
    ecoScore: 89,
    coordinates: [
      [12.9716, 77.5946],
      [12.9760, 77.5970],
      [12.9850, 77.6020],
      [12.9950, 77.6200],
    ],
    color: '#00D4AA',
  },
]

// Normalize a route object from the backend into the shape the UI expects.
// Backend uses: route_type, distance_km, travel_time_min, fuel_l, co2_kg, ecoscore, waypoints
// Frontend uses: type, distance, time, fuel, co2, ecoScore, coordinates
const normalizeRoute = (r, idx) => ({
  id: r.id || r.route_type || ['fastest', 'shortest', 'greenest'][idx] || `route-${idx}`,
  type: r.route_type
    ? r.route_type.charAt(0).toUpperCase() + r.route_type.slice(1)
    : r.type || 'Route',
  distance: r.distance_km ?? r.distance ?? 0,
  time:     r.travel_time_min ?? r.time ?? 0,
  fuel:     r.fuel_l ?? r.fuel_consumption_l ?? r.fuel ?? 0,
  co2:      r.co2_kg ?? r.co2_emissions_kg ?? r.co2 ?? 0,
  ecoScore: r.ecoscore ?? r.ecoScore ?? r.eco_score ?? 0,
  coordinates: r.waypoints
    ? r.waypoints.map(wp => [wp.lat ?? wp[0], wp.lon ?? wp[1]])
    : r.coordinates || [],
  co2_saved_kg: r.co2_saved_kg ?? 0,
  fuel_saved_l: r.fuel_saved_l ?? 0,
  color: r.color || '#00D4AA',
})

const useRoutes = () => {
  const [loading, setLoading] = useState(false)
  const [aiAdvice, setAiAdvice] = useState(null)
  const { routes, setRoutes, selectedRoute, setSelectedRoute, addToHistory } = useStore()

  const planRoute = useCallback(async (routeData) => {
    setLoading(true)
    try {
      const data = await routeService.planRoute(routeData)
      const rawRoutes = data.routes || data
      const routesArr = Array.isArray(rawRoutes)
        ? rawRoutes.map(normalizeRoute)
        : []
      setRoutes(routesArr)
      setAiAdvice(data.ai_advice || null)
      if (routesArr.length > 0) {
        setSelectedRoute(routesArr.find(r => r.type === 'Greenest') || routesArr[0])
      }
      toast.success('Routes calculated! 🗺️')
      return routesArr
    } catch (err) {
      console.warn('API unavailable, using demo routes:', err.message)
      const mock = generateMockRoutes(routeData.source, routeData.destination)
      setRoutes(mock)
      setSelectedRoute(mock[2])
      setAiAdvice({
        route_recommendation: 'Taking the Greenest route saves 1.2 kg CO₂ compared to the fastest option, making it the most sustainable choice.',
        sustainability_insights: [
          'This route avoids the highway congestion zone, bypassing heavy idling areas.',
          'Passes through secondary streets that maintain steady, lower speed profiles.',
        ],
        carbon_reduction_suggestions: [
          'Consider leaving 10 minutes early to avoid minor traffic bottlenecks.',
          'Avoid high acceleration when pulling away from stops along the suburban path.',
        ],
        fuel_saving_suggestions: [
          'Maintain a steady 50-60 km/h on urban avenues to save up to 12% fuel.',
          'Minimize air conditioner usage on mild weather segments.',
        ],
        alternative_transportation: [
          '🚶 Walking: 0 kg CO₂. A clean, active commute alternative.',
          '🚴 Cycling: 0 kg CO₂. Cuts commute time while maintaining 0 emissions.',
          '🚇 Metro: Saves 88% emissions over petrol-based commuting.',
        ],
        environmental_impact_summary: 'Consistently choosing this green route reduces carbon output by 43% and saves fuel.',
      })
      toast.success('Demo routes loaded! 🌿')
      return mock
    } finally {
      setLoading(false)
    }
  }, [setRoutes, setSelectedRoute])


  const saveRoute = useCallback(async (routeData) => {
    try {
      await routeService.saveRoute(routeData)
      addToHistory(routeData)
      toast.success('Route saved! ✅')
    } catch (err) {
      addToHistory({ ...routeData, savedAt: new Date().toISOString() })
      toast.success('Route saved locally! ✅')
    }
  }, [addToHistory])

  const getHistory = useCallback(async () => {
    try {
      const data = await routeService.getHistory()
      return data
    } catch {
      return []
    }
  }, [])

  return {
    routes,
    selectedRoute,
    setSelectedRoute,
    planRoute,
    saveRoute,
    getHistory,
    loading,
    aiAdvice,
  }
}

export default useRoutes
