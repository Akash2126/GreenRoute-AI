import api from './api'

// ============================================================
// Auth Service
// ============================================================

export const authService = {
  signup: async (data) => {
    const response = await api.post('/api/auth/signup', data)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile')
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/auth/profile', data)
    return response.data
  },
}

export default authService
