import axios from 'axios'
import { useAuthStore } from '../store/auth'

// 创建axios实例
const http = axios.create({
  baseURL: '/api'
})

// 请求拦截器 - 添加认证token
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// 响应拦截器 - 处理401未授权错误
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
