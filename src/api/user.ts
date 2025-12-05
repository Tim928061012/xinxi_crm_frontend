import request from './request'

export interface UserProfile {
  name: string
  email: string
  phone?: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export const userApi = {
  // 获取个人信息
  getProfile() {
    // TODO: 替换为实际接口
    return request.get('/user/profile')
  },

  // 更新个人信息
  updateProfile(data: UserProfile) {
    // TODO: 替换为实际接口
    return request.put('/user/profile', data)
  },

  // 修改密码
  changePassword(data: ChangePasswordParams) {
    // TODO: 替换为实际接口
    return request.post('/user/change-password', data)
  }
}
