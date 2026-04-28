import request from './request'
import type { AxiosResponse } from 'axios'

export interface Account {
  id: number
  userId?: number // 后端返回的 userId 字段
  account: string
  firstName: string
  lastName: string
  name: string // 显示用的全名，格式：firstName, lastName
  role?: string // 用户角色，用于判断是否为 admin
  roleDisplayName?: string
  isActive: boolean // 后端返回的 isActive 字段
  status: 'enabled' | 'disabled' // 前端显示用的状态
  createdTime: string
}

export interface CreateAccountParams {
  account: string // UI 上使用的字段名
  firstName: string
  lastName: string
  role: string
}

// 后端接口需要的参数格式
export interface CreateAccountRequest {
  username: string // 后端接口使用的字段名
  firstName: string
  lastName: string
  role: string
}

export interface UpdateAccountParams {
  firstName: string
  lastName: string
  role?: string
}

const ACCOUNT_CACHE_TTL_MS = 60 * 1000
const RM_CACHE_TTL_MS = 60 * 1000

let accountsCache: AxiosResponse | null = null
let accountsCacheAt = 0
let accountsInFlight: Promise<AxiosResponse> | null = null

let rmsCache: AxiosResponse | null = null
let rmsCacheAt = 0
let rmsInFlight: Promise<AxiosResponse> | null = null

const clearAccountApiCache = () => {
  accountsCache = null
  accountsCacheAt = 0
  accountsInFlight = null
  rmsCache = null
  rmsCacheAt = 0
  rmsInFlight = null
}

export const accountApi = {
  // 获取账户列表（需要Admin权限）
  getAccounts(params?: any) {
    // 带筛选参数的查询不走缓存，避免参数污染
    if (params && Object.keys(params).length > 0) {
      return request.get('/system-users', { params })
    }
    const now = Date.now()
    if (accountsCache && now - accountsCacheAt < ACCOUNT_CACHE_TTL_MS) {
      return Promise.resolve(accountsCache)
    }
    if (accountsInFlight) {
      return accountsInFlight
    }
    accountsInFlight = request.get('/system-users', { params }).then(res => {
      accountsCache = res
      accountsCacheAt = Date.now()
      return res
    }).finally(() => {
      accountsInFlight = null
    })
    return accountsInFlight
  },

  // 获取RM列表（所有非admin用户，普通用户可访问）
  getRMs() {
    const now = Date.now()
    if (rmsCache && now - rmsCacheAt < RM_CACHE_TTL_MS) {
      return Promise.resolve(rmsCache)
    }
    if (rmsInFlight) {
      return rmsInFlight
    }
    rmsInFlight = request.get('/system-users/rm-list').then(res => {
      rmsCache = res
      rmsCacheAt = Date.now()
      return res
    }).finally(() => {
      rmsInFlight = null
    })
    return rmsInFlight
  },

  // 获取账户详情
  getAccountById(id: number) {
    return request.get(`/system-users/${id}`)
  },

  // 创建账户
  createAccount(data: CreateAccountParams) {
    // 将前端的 account 转换为后端的 username
    const requestData: CreateAccountRequest = {
      username: data.account,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    }
    return request.post('/system-users', requestData).finally(() => clearAccountApiCache())
  },

  // 更新账户
  updateAccount(id: number, data: UpdateAccountParams) {
    return request.put(`/system-users/${id}`, data).finally(() => clearAccountApiCache())
  },

  // 删除账户
  deleteAccount(id: number) {
    return request.delete(`/system-users/${id}`).finally(() => clearAccountApiCache())
  },

  // 更新账户状态
  updateAccountStatus(id: number, active: boolean) {
    return request.put(`/system-users/${id}/active`, { active }).finally(() => clearAccountApiCache())
  },

  // 重置密码
  resetPassword(id: number) {
    return request.post(`/system-users/${id}/reset-password`).finally(() => clearAccountApiCache())
  }
}
