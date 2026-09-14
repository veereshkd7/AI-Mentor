import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-refresh on 401
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig) })
          .catch(err => Promise.reject(err))
      }
      orig._retry   = true
      isRefreshing  = true
      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) { clearAuth(); window.location.href = '/login'; return Promise.reject(error) }
      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken: refresh })
        localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      } catch (e) {
        processQueue(e, null); clearAuth(); window.location.href = '/login'
        return Promise.reject(e)
      } finally { isRefreshing = false }
    }
    return Promise.reject(error)
  }
)

export const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

export const setAuth = (data) => {
  localStorage.setItem('accessToken',  data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  localStorage.setItem('user', JSON.stringify({
    username: data.username, email: data.email, roles: data.roles,
  }))
}

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export const authApi = {
  register: (data)         => api.post('/auth/register', data),
  login:    (data)         => api.post('/auth/login', data),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:   ()             => api.post('/auth/logout'),
}

export const mentorApi = {
  roadmap:      (data) => api.post('/mentor/roadmap',   data),
  explain:      (data) => api.post('/mentor/explain',   data),
  interview:    (data) => api.post('/mentor/interview', data),
  quiz:         (data) => api.post('/mentor/quiz',      data),
  history:      ()     => api.get('/mentor/history'),
  getSession:   (id)   => api.get(`/mentor/history/${id}`),
  deleteSession:(id)   => api.delete(`/mentor/history/${id}`),
}

export const userApi = {
  getProfile:    ()      => api.get('/user/profile'),
  updateProfile: (data)  => api.put('/user/profile', data),
  deleteAccount: (pass)  => api.delete('/user/account', { data: { password: pass } }),
}

export default api
