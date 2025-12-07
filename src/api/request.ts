import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// 根据环境变量决定baseURL
// 开发环境：使用相对路径 /api，由 Vite 代理转发到后端
// 生产环境：使用环境变量配置的完整URL，或使用相对路径由 Nginx 代理
const getBaseURL = () => {
  // 开发环境使用代理，直接使用 /api
  if (import.meta.env.DEV) {
    return '/api'
  }
  // 生产环境：如果配置了完整URL则使用，否则使用相对路径（由Nginx代理）
  return import.meta.env.VITE_API_BASE_URL || '/api'
}

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动添加 token 到请求头
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 从 localStorage 或 sessionStorage 获取 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    if (token && config.headers) {
      config.headers['X-Auth-Token'] = token
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response

    // 如果后端返回的数据格式是 { code, data, message } 或 { success, data, message }
    if (data && typeof data === 'object') {
      // 检查 success 字段（优先级高于 code）
      if (data.success !== undefined) {
        if (data.success === true) {
          // 成功，保留原始响应对象
          const result = { ...data }
          result.__rawResponse = response
          return result
        } else {
          // success 为 false，不显示错误消息，让调用方处理，避免重复提示
          return Promise.reject(new Error(data.message || 'Request failed'))
        }
      }
      
      // 检查 code 字段（兼容旧格式）
      if (data.code !== undefined) {
        if (data.code === 200 || data.code === 0) {
          // 保留原始响应对象，以便登录时能获取响应头
          const result = { ...data }
          result.__rawResponse = response
          return result
        } else {
          // 403 权限错误特殊处理
          if (data.code === 403) {
            const error = new Error(data.msg || data.message || 'Permission denied')
            // 标记为权限错误，方便调用方处理
            ;(error as any).code = 403
            ;(error as any).isPermissionError = true
            return Promise.reject(error)
          }
          // 不在这里显示错误消息，让调用方处理，避免重复提示
          const error = new Error(data.msg || data.message || 'Request failed')
          ;(error as any).code = data.code
          return Promise.reject(error)
        }
      }
      
      // 如果既没有 success 也没有 code，直接返回数据
      const result = { ...data }
      result.__rawResponse = response
      return result
    }

    // 如果后端直接返回数据，也保留原始响应对象
    // 如果 data 是基本类型，包装成对象
    return {
      data,
      __rawResponse: response
    }
  },
  (error) => {
    const { response, config } = error
    // 检查是否是登录接口，如果是登录接口，不在这里显示错误，让调用方处理
    const isLoginRequest = config?.url?.includes('/auth/') && (config?.url?.includes('/login') || config?.method === 'post')

    if (response) {
      const status = response.status
      
      // 401 特殊处理：未授权，需要跳转到登录页
      if (status === 401) {
        if (isLoginRequest) {
          // 登录请求的 401，不显示错误，让调用方处理
          return Promise.reject(error)
        }
        // 其他请求的 401，说明 token 过期或未授权，需要清除 token 并跳转登录
        const authStore = useAuthStore()
        // 清除 token
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        // 清除用户信息
        authStore.logout()
        // 跳转到登录页
        router.push({ name: 'Login' })
        return Promise.reject(error)
      }
      
      // 403 权限错误特殊处理
      if (status === 403) {
        const error = new Error(response.data?.msg || response.data?.message || 'Permission denied')
        ;(error as any).code = 403
        ;(error as any).isPermissionError = true
        ;(error as any).response = response
        return Promise.reject(error)
      }
      
      // 业务错误（400-499，除了 401 和 403）：不显示错误，让调用方处理，避免重复提示
      if (status >= 400 && status < 500) {
        return Promise.reject(error)
      }
      
      // 服务器错误（500+）：显示错误
      if (status >= 500) {
        ElMessage.error(response.data?.message || 'Server error')
        return Promise.reject(error)
      }
    } else {
      // 网络错误：显示错误
      ElMessage.error('Network connection failed')
    }

    return Promise.reject(error)
  }
)

export default request
