import api from './api'

// ============================================================
// Route Service
// ============================================================

export const routeService = {
  planRoute: async (routeData) => {
    const response = await api.post('/api/routes/plan', routeData)
    return response.data
  },

  saveRoute: async (routeData) => {
    const response = await api.post('/api/routes/save', routeData)
    return response.data
  },

  getHistory: async () => {
    const response = await api.get('/api/routes/history')
    return response.data
  },
}

export default routeService
