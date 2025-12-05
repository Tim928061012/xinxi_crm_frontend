import request from './request'

export interface User {
  id: number
  username: string
  name: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive'
  createTime: string
}

export interface CreateUserParams {
  username: string
  name: string
  email: string
  role: 'user' | 'admin'
  password: string
  status: 'active' | 'inactive'
}

export const adminApi = {
  // 获取用户列表
  getUsers(params: any) {
    // TODO: 替换为实际接口
    return request.get('/admin/users', { params })
  },

  // 创建用户
  createUser(data: CreateUserParams) {
    // TODO: 替换为实际接口
    return request.post('/admin/users', data)
  },

  // 更新用户
  updateUser(id: number, data: Partial<CreateUserParams>) {
    // TODO: 替换为实际接口
    return request.put(`/admin/users/${id}`, data)
  },

  // 删除用户
  deleteUser(id: number) {
    // TODO: 替换为实际接口
    return request.delete(`/admin/users/${id}`)
  },

  // 更新用户状态
  updateUserStatus(id: number, status: 'active' | 'inactive') {
    // TODO: 替换为实际接口
    return request.put(`/admin/users/${id}/status`, { status })
  },

  // 获取系统信息
  getSystemInfo() {
    // TODO: 替换为实际接口
    return request.get('/admin/system/info')
  },

  // 保存系统配置
  saveSystemConfig(data: any) {
    // TODO: 替换为实际接口
    return request.post('/admin/system/config', data)
  },

  // 清除缓存
  clearCache() {
    // TODO: 替换为实际接口
    return request.post('/admin/system/clear-cache')
  },

  // 系统重启
  restartSystem() {
    // TODO: 替换为实际接口
    return request.post('/admin/system/restart')
  },

  // 测试数据库连接
  testDbConnection(data: any) {
    // TODO: 替换为实际接口
    return request.post('/admin/system/test-db', data)
  },

  // 保存数据库配置
  saveDbConfig(data: any) {
    // TODO: 替换为实际接口
    return request.post('/admin/system/db-config', data)
  },

  // 获取操作日志
  getLogs(params: any) {
    // TODO: 替换为实际接口
    return request.get('/admin/logs', { params })
  }
}
