import axios from 'axios'
import { useAuthStore } from '../store/authSlice'

const getBaseURL = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
  url = url.trim().replace(/\/+$/, '')
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`
  }
  return url
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
