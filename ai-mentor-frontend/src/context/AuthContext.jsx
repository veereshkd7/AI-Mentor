import { createContext, useContext, useState, useCallback } from 'react'
import { authApi, setAuth, clearAuth, getStoredUser } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(getStoredUser)
  const [loading, setLoading] = useState(false)

  const register = useCallback(async (username, email, password) => {
    setLoading(true)
    try {
      const { data } = await authApi.register({ username, email, password })
      setAuth(data)
      setUser({ username: data.username, email: data.email, roles: data.roles })
      toast.success(`Welcome, ${data.username}! 🎉`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
      return { success: false, error: msg, fieldErrors: err.response?.data?.fieldErrors }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const { data } = await authApi.login({ username, password })
      setAuth(data)
      setUser({ username: data.username, email: data.email, roles: data.roles })
      toast.success(`Welcome back, ${data.username}!`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch (_) {}
    clearAuth()
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
