import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null
  }),
  
  actions: {
    /**
     * 设置用户token
     * @param {string} token - 用户认证token
     */
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    /**
     * 设置用户信息
     * @param {Object} user - 用户信息对象
     */
    setUser(user) {
      this.user = user
    },
    
    /**
     * 用户退出登录
     * 清除token、用户信息和本地存储
     */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
    
    /**
     * 获取用户个人信息
     * @throws {Error} 当请求失败时抛出错误
     */
    async fetchProfile() {
      if (!this.token) return
      
      try {
        const { data } = await http.get('/auth/profile')
        this.setUser(data.user)
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        throw error
      }
    }
  }
})
