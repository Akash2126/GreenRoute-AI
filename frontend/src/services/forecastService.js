import api from './api'

// ============================================================
// Forecast / AI Service
// ============================================================

export const forecastService = {
  getAIAdvisor: async (data) => {
    const response = await api.post('/api/ai/advisor', data)
    return response.data
  },

  getTraffic: async () => {
    const response = await api.get('/api/ai/traffic')
    return response.data
  },

  getForecast: async (horizon = '24h') => {
    const response = await api.get('/api/ai/forecast', { params: { horizon } })
    return response.data
  },

  getXAITraffic: async () => {
    const response = await api.get('/api/ai/xai/traffic')
    return response.data
  },

  getXAIEmission: async () => {
    const response = await api.get('/api/ai/xai/emission')
    return response.data
  },

  getClimateTips: async () => {
    const response = await api.get('/api/ai/climate-tips')
    return response.data
  },

  getDigitalTwinAdvice: async (data) => {
    const response = await api.post('/api/ai/digital-twin', data)
    return response.data
  },
}

// Fleet Service
export const fleetService = {
  getFleet: async () => {
    const response = await api.get('/api/fleet/')
    return response.data
  },

  getFleetAnalytics: async () => {
    const response = await api.get('/api/fleet/analytics')
    return response.data
  },

  addVehicle: async (data) => {
    const response = await api.post('/api/fleet/', data)
    return response.data
  },
}

// Achievements Service
export const achievementsService = {
  getAchievements: async () => {
    const response = await api.get('/api/achievements/')
    return response.data
  },
}

// Reports Service
export const reportsService = {
  generateReport: async (data) => {
    const response = await api.post('/api/reports/generate', data, { responseType: 'blob' })
    return response.data
  },
  generateAISummaryReport: async (data) => {
    const response = await api.post('/api/reports/ai-summary', data, { responseType: 'blob' })
    return response.data
  },
}

export default forecastService
