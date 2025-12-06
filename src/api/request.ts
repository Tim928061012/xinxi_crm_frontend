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

    // 如果后端返回的数据格式是 { code, data, message }
    if (data && typeof data === 'object' && data.code !== undefined) {
      if (data.code === 200 || data.code === 0) {
        // 保留原始响应对象，以便登录时能获取响应头
        // 确保返回的对象可以添加属性
        const result = { ...data }
        result.__rawResponse = response
        return result
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }

    // 如果后端直接返回数据，也保留原始响应对象
    // 如果 data 是对象，则添加 __rawResponse 属性；否则包装成对象
    if (data && typeof data === 'object') {
      const result = { ...data }
      result.__rawResponse = response
      return result
    } else {
      // 如果 data 是基本类型，包装成对象
      return {
        data,
        __rawResponse: response
      }
    }
  },
  (error) => {
    const { response } = error

    if (response) {
      switch (response.status) {
        case 401:
          // Token 过期或未授权，清除 token 并跳转登录
          ElMessage.error('登录已过期，请重新登录')
          const authStore = useAuthStore()
          // 清除 token
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          authStore.logout()
          // 跳转到登录页
          router.push({ name: 'Login' })
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求错误，未找到该资源')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(response.data?.message || `连接错误${response.status}`)
      }
    } else {
      ElMessage.error('网络连接失败')
    }

    return Promise.reject(error)
  }
)

export default request
