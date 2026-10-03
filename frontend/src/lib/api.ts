import axios from 'axios'
import { useAuthStore } from '../store/authSlice'

const getBaseURL = () => {
  let url = (process.env.NEXT_PUBLIC_API_URL || '').trim()

  if (!url) {
    return 'http://localhost:5000/api/v1'
  }

  url = url.replace(/\/+$/, '')
  if (url.endsWith('/api/v1')) {
    return url
  }
  if (url.endsWith('/api')) {
    return `${url}/v1`
  }
  return `${url}/api/v1`
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
