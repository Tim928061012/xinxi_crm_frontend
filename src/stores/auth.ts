import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm } from '@/types/auth'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // 从 localStorage 或 sessionStorage 获取 token
  const token = ref<string | null>(localStorage.getItem('token') || sessionStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isUser = computed(() => user.value?.role === 'user')

  // 登录（根据角色调用不同接口）
  async function login(loginForm: LoginForm, role: 'user' | 'admin' = 'user') {
    try {
      // 根据角色调用不同的登录接口
      const response = role === 'admin' 
        ? await authApi.adminLogin(loginForm)
        : await authApi.userLogin(loginForm)
      
      // 从响应头（X-Auth-Token）或响应体（data.data.token）读取 token
      // 响应拦截器会保留原始响应对象在 __rawResponse 中
      const rawResponse = (response as any).__rawResponse
      let authToken: string | null = null
      
      // 优先从响应头获取 token（不区分大小写）
      if (rawResponse && rawResponse.headers) {
        const headers = rawResponse.headers
        authToken = headers['x-auth-token'] || headers['X-Auth-Token'] || headers['X-AUTH-TOKEN']
      }
      
      // 如果响应头没有，则从响应体获取
      if (!authToken) {
        const responseData = response.data || response
        authToken = responseData.token || responseData.data?.token
      }
      
      // 获取用户信息
      const responseData = response.data || response
      const userData: User = responseData.user || responseData.data?.user || {
        id: responseData.id || '',
        username: loginForm.username,
        name: responseData.name || loginForm.username,
        role: role,
        email: responseData.email || '',
        avatar: responseData.avatar || ''
      }

      if (!authToken) {
        throw new Error('登录失败：未获取到token')
      }

      token.value = authToken
      user.value = userData
      
      // 将 token 保存到 localStorage（也可以使用 sessionStorage）
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || '登录失败，请检查用户名和密码' 
      }
    }
  }

  // 登出（根据角色调用不同接口）
  async function logout() {
    try {
      // 根据当前用户角色调用不同的登出接口
      if (user.value?.role === 'admin') {
        await authApi.adminLogout()
      } else {
        await authApi.userLogout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      // 清除 localStorage 和 sessionStorage 中的 token
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    }
  }

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      // TODO: 调用获取用户信息接口
      const response = await authApi.getUserInfo()
      
      // 模拟响应数据
      // user.value = response.data
      
      // 临时从localStorage获取，后续替换为实际接口
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    } catch (error) {
      console.error('Fetch user info error:', error)
      // 如果获取用户信息失败，清除登录状态
      await logout()
    }
  }

  // 初始化：从localStorage或sessionStorage恢复登录状态
  function initAuth() {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      // 验证token有效性（可选）
      // fetchUserInfo()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isUser,
    login,
    logout,
    fetchUserInfo,
    initAuth
  }
})
