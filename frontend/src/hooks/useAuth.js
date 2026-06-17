import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import authService from '../services/authService'

// Safely extract a readable string from FastAPI errors.
// FastAPI validation errors: { detail: [{type, loc, msg, input}, ...] }
// FastAPI HTTP errors:       { detail: "some string" }
const extractError = (err, fallback) => {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.response?.data?.message || fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    // Pick the first validation message
    const first = detail[0]
    if (first?.msg) return `${first.loc?.slice(-1)[0] ?? 'Field'}: ${first.msg}`
    return JSON.stringify(first)
  }
  return fallback
}

const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const { setAuth, logout, user, isAuthenticated, token } = useStore()
  const navigate = useNavigate()

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const data = await authService.login(credentials)
      setAuth(
        data.user || { email: credentials.email, username: credentials.email.split('@')[0] },
        data.access_token || data.token
      )
      toast.success('Welcome back! 🌿')
      navigate('/dashboard')
    } catch (err) {
      toast.error(extractError(err, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [setAuth, navigate])

  const signup = useCallback(async (userData) => {
    setLoading(true)
    try {
      const data = await authService.signup(userData)
      setAuth(
        data.user || { email: userData.email, username: userData.username },
        data.access_token || data.token
      )
      toast.success('Account created! Welcome to GreenRoute AI 🌿')
      navigate('/dashboard')
    } catch (err) {
      toast.error(extractError(err, 'Signup failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [setAuth, navigate])

  const handleLogout = useCallback(() => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }, [logout, navigate])

  return { login, signup, logout: handleLogout, loading, user, isAuthenticated, token }
}

export default useAuth

