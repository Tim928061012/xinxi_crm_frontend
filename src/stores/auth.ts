import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm } from '@/types/auth'
import { authApi } from '@/api/auth'
import { isAdminRole, isEmployeeRole, normalizeRole, roleDisplayName } from '@/utils/roles'
import { formatPersonName } from '@/utils/name'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  // 从 localStorage 或 sessionStorage 获取 token
  const token = ref<string | null>(localStorage.getItem('token') || sessionStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => isAdminRole(user.value?.role))
  const isUser = computed(() => isEmployeeRole(user.value?.role))

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
      
      // 获取用户信息（登录接口 body 为 ApiResponse，data 为 AuthSession：含 userId / username，无嵌套 user）
      const responseData = (response as any).data || response
      const payload = (responseData as any)?.data?.userId != null || (responseData as any)?.data?.username != null
        ? (responseData as any).data
        : responseData
      const rawUserData: User =
        (payload as any).user ||
        (payload as any).data?.user ||
        ((payload as any).userId != null || (payload as any).id != null
          ? {
              ...(payload as User),
              username: (payload as any).username || loginForm.username,
              role: (payload as any).role || role
            }
          : {
              id: '',
              username: loginForm.username,
              name: loginForm.username,
              role: role,
              email: '',
              avatar: ''
            })
      const normalized = normalizeRole((rawUserData as any).role || role)
      const userData: User = {
        ...rawUserData,
        id: String((rawUserData as any).id || (rawUserData as any).userId || ''),
        account: rawUserData.account || rawUserData.username,
        role: normalized,
        roleDisplayName: roleDisplayName(normalized),
        name:
          formatPersonName(rawUserData.firstName, rawUserData.lastName) ||
          rawUserData.name ||
          rawUserData.username
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
      // 从错误对象中提取错误消息
      // 优先使用 response.data.message，然后是 error.message，最后是默认消息
      const errorMessage = error.response?.data?.message || error.message || 'Login failed, please check your username and password'
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  // 登出（根据角色调用不同接口）
  async function logout() {
    try {
      // 根据当前用户角色调用不同的登出接口
      if (isAdminRole(user.value?.role)) {
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

  // 仅清理本地登录态，不调用后端接口（用于账号失效等强制退出场景）
  function clearAuthLocal() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  // 获取用户信息
  async function fetchUserInfo() {
    try {
      const response = await authApi.getMe()
      const data = response.data || response
      user.value = {
        id: String(data.userId || data.id || ''),
        username: data.username || data.account || '',
        account: data.account || data.username || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        name: formatPersonName(data.firstName, data.lastName) || data.username || '',
        role: normalizeRole(data.role),
        roleDisplayName: data.roleDisplayName || roleDisplayName(data.role),
        email: data.email || '',
        avatar: data.avatar || ''
      }
      localStorage.setItem('user', JSON.stringify(user.value))
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
      const parsed = JSON.parse(storedUser)
      const nr = normalizeRole(parsed.role)
      user.value = {
        ...parsed,
        name:
          formatPersonName(parsed.firstName, parsed.lastName) ||
          parsed.name ||
          parsed.username ||
          parsed.account ||
          '',
        role: nr,
        roleDisplayName: roleDisplayName(nr)
      }
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
    clearAuthLocal,
    fetchUserInfo,
    initAuth
  }
})
