import axios from 'axios'
import useStore from '../store/useStore'

// ============================================================
// Axios Instance
// ============================================================
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================
// Request Interceptor — attach Bearer token
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token =
      useStore.getState().token ||
      localStorage.getItem('greenroute_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ============================================================
// Response Interceptor — handle 401 auto logout
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useStore.getState().logout()
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
