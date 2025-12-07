import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  name: string
  role: 'user' | 'admin'
  email: string
  avatar?: string
  firstName?: string
  lastName?: string
  account?: string
}

export interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const authApi = {
  // 普通用户登录
  userLogin(params: LoginParams) {
    return request.post('/auth/user/login', params)
  },

  // 普通用户登出
  userLogout() {
    return request.post('/auth/user/logout')
  },

  // 管理员登录
  adminLogin(params: LoginParams) {
    return request.post('/auth/admin/login', params)
  },

  // 管理员登出
  adminLogout() {
    return request.post('/auth/admin/logout')
  },

  // 获取用户信息
  getUserInfo() {
    return request.get('/auth/userinfo')
  },

  // 获取当前用户信息
  getMe() {
    return request.get('/auth/me')
  },

  // 修改密码
  changePassword(params: ChangePasswordParams) {
    return request.put('/auth/change-password', params)
  }
}
