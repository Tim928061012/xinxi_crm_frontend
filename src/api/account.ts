import request from './request'

export interface Account {
  id: number
  account: string
  firstName: string
  lastName: string
  name: string // 显示用的全名，格式：lastName, firstName
  status: 'enabled' | 'disabled'
  createdTime: string
}

export interface CreateAccountParams {
  account: string // UI 上使用的字段名
  firstName: string
  lastName: string
}

// 后端接口需要的参数格式
export interface CreateAccountRequest {
  username: string // 后端接口使用的字段名
  firstName: string
  lastName: string
}

export interface UpdateAccountParams {
  firstName: string
  lastName: string
}

export const accountApi = {
  // 获取账户列表
  getAccounts(params?: any) {
    return request.get('/system-users', { params })
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
      lastName: data.lastName
    }
    return request.post('/system-users', requestData)
  },

  // 更新账户
  updateAccount(id: number, data: UpdateAccountParams) {
    return request.put(`/system-users/${id}`, data)
  },

  // 删除账户
  deleteAccount(id: number) {
    return request.delete(`/system-users/${id}`)
  },

  // 更新账户状态
  updateAccountStatus(id: number, active: boolean) {
    return request.put(`/system-users/${id}/active`, { active })
  },

  // 重置密码
  resetPassword(id: number) {
    return request.post(`/system-users/${id}/reset-password`)
  }
}

