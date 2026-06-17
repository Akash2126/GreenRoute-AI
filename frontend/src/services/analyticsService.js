import api from './api'

// ============================================================
// Analytics Service
// ============================================================

export const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/api/analytics/overview')
    return response.data
  },

  getEmissions: async (params) => {
    const response = await api.get('/api/analytics/emissions', { params })
    return response.data
  },

  getEcoScore: async () => {
    const response = await api.get('/api/analytics/ecoscore')
    return response.data
  },

  getFuel: async (params) => {
    const response = await api.get('/api/analytics/fuel', { params })
    return response.data
  },

  getSustainability: async () => {
    const response = await api.get('/api/analytics/sustainability')
    return response.data
  },

  getCarbonIntelligence: async () => {
    const response = await api.get('/api/analytics/carbon-intelligence')
    return response.data
  },
}

export default analyticsService
