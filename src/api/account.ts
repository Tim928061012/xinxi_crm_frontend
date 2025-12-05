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
  account: string
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
    // TODO: 替换为实际接口
    return request.get('/admin/accounts', { params })
  },

  // 创建账户
  createAccount(data: CreateAccountParams) {
    // TODO: 替换为实际接口
    return request.post('/admin/accounts', data)
  },

  // 更新账户
  updateAccount(id: number, data: UpdateAccountParams) {
    // TODO: 替换为实际接口
    return request.put(`/admin/accounts/${id}`, data)
  },

  // 删除账户
  deleteAccount(id: number) {
    // TODO: 替换为实际接口
    return request.delete(`/admin/accounts/${id}`)
  },

  // 更新账户状态
  updateAccountStatus(id: number, status: 'enabled' | 'disabled') {
    // TODO: 替换为实际接口
    return request.put(`/admin/accounts/${id}/status`, { status })
  },

  // 重置密码
  resetPassword(id: number) {
    // TODO: 替换为实际接口
    return request.post(`/admin/accounts/${id}/reset-password`)
  }
}

