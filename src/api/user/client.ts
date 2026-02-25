import request from '../request'

// Portfolio 数据结构
export interface Portfolio {
  id?: number
  bank: string
  bookingCentre: string
  portfolioNo: string
  uploadTime?: string
}

// 个人客户 General 信息
export interface IndividualGeneralInfo {
  contactType: string // "Client"
  contactNature: 'Individual'
  clientId?: string
  clientRelationshipStatus?: string
  title?: string
  firstName: string
  lastName: string
  chineseName?: string
  idType?: string
  idNo?: string
  idExpiry?: string
  rm: string
  rmUserId?: number
  arm?: string
  armUserId?: number
  introducer?: string
  introducerId?: number
  gender?: 'Male' | 'Female'
  maritalStatus?: string
  educationLevel?: string
  birthday?: string
  countryOfBirth?: string
  dualCitizenship?: boolean
  nationality?: string
}

// 企业客户 General 信息
export interface CorporateGeneralInfo {
  contactType: string // "Client"
  contactNature: 'Corporate'
  clientId?: string
  clientRelationshipStatus?: string
  companyName: string
  corporateType?: string
  industry?: string
  stateOwned?: boolean
  rm: string
  rmUserId?: number
  arm?: string
  armUserId?: number
  introducer?: string
  introducerId?: number
  chineseName?: string
  idType?: string
  idNo?: string
  dateOfCompanySearch?: string
  countryOfRegistration?: string
}

// Contact 信息（公共）
export interface ContactInfo {
  mobilePhone?: string
  homePhone?: string
  primaryEmail?: string
  address?: string
  jurisdictionDiffers?: boolean
}

// Client 完整数据结构
export interface Client {
  id: number
  clientId?: number
  contactNature: 'Individual' | 'Corporate'
  general: IndividualGeneralInfo | CorporateGeneralInfo
  contact: ContactInfo
  portfolios: Portfolio[]
  createdTime: string
  updatedTime?: string
}

// 创建/更新 Client 请求参数
export interface CreateClientParams {
  contactNature: 'Individual' | 'Corporate'
  general: IndividualGeneralInfo | CorporateGeneralInfo
  contact: ContactInfo
}

export interface UpdateClientParams extends CreateClientParams {}

export const userClientApi = {
  // 获取客户列表
  getClients(params?: any) {
    return request.get('/user/clients', { params })
  },

  // 获取客户详情
  getClientById(id: number, clientType?: 'Individual' | 'Corporate') {
    const params = clientType ? { clientType } : {}
    return request.get(`/user/clients/${id}`, { params })
  },

  // 创建客户
  createClient(data: CreateClientParams) {
    return request.post('/user/clients', data)
  },

  // 更新客户
  updateClient(id: number, data: UpdateClientParams) {
    return request.put(`/user/clients/${id}`, data)
  },

  // 删除客户
  deleteClient(id: number) {
    return request.delete(`/user/clients/${id}`)
  }
}

