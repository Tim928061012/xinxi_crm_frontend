import request from './request'

// 后端返回的数据结构
export interface IntroducerResponse {
  introducerId: number
  contactType: string
  contactNature: 'Individual' | 'Corporate'
  relationshipStatus?: string
  title?: string
  firstName?: string
  lastName?: string
  companyName?: string
  mobilePhone?: string
  email?: string
  rmUserId?: number
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

// 前端使用的数据结构
export interface Introducer {
  id: number // 映射自 introducerId
  introducer: string // 显示名称：个人显示 "firstName, lastName"，企业显示 "companyName"
  contactNature: 'Individual' | 'Corporate'
  rm: string // Relationship Manager 显示名称
  rmUserId?: number // RM 对应的 userId
  status: 'enabled' | 'disabled'
  isActive?: boolean
  createdTime: string // 映射自 createdAt
  // 个人客户字段
  title?: string
  firstName?: string
  lastName?: string
  // 企业客户字段
  companyName?: string
  // 公共字段
  contactType?: string
  clientRelationshipStatus?: string // 映射自 relationshipStatus
  email?: string
  mobilePhone?: string
}

// 创建/更新请求参数（后端格式）
export interface CreateIntroducerRequest {
  contactType: string // "Introducer"
  contactNature: 'Individual' | 'Corporate'
  relationshipStatus?: string
  // 个人客户字段
  title?: string
  firstName?: string
  lastName?: string
  // 企业客户字段
  companyName?: string
  // 公共字段
  rmUserId?: number
  email?: string
  mobilePhone?: string
}

// 前端表单参数
export interface CreateIntroducerParams {
  contactNature: 'Individual' | 'Corporate'
  contactType: string
  clientRelationshipStatus?: string // 前端使用，提交时映射为 relationshipStatus
  // 个人客户字段
  title?: string
  firstName?: string
  lastName?: string
  // 企业客户字段
  companyName?: string
  // 公共字段
  rm: string // 前端显示用
  rmUserId?: number // 提交时使用
  email?: string
  mobilePhone?: string
}

export interface UpdateIntroducerParams extends CreateIntroducerParams {}

export const introducerApi = {
  // 获取介绍人列表
  getIntroducers(params?: any) {
    return request.get('/crm-introducers', { params })
  },

  // 获取介绍人详情
  getIntroducerById(id: number) {
    return request.get(`/crm-introducers/${id}`)
  },

  // 创建介绍人
  createIntroducer(data: CreateIntroducerParams) {
    // 将前端参数转换为后端格式
    const requestData: CreateIntroducerRequest = {
      contactType: data.contactType,
      contactNature: data.contactNature,
      relationshipStatus: data.clientRelationshipStatus || undefined,
      rmUserId: data.rmUserId || undefined,
      email: data.email || undefined,
      mobilePhone: data.mobilePhone || undefined
    }

    if (data.contactNature === 'Individual') {
      requestData.title = data.title
      requestData.firstName = data.firstName
      requestData.lastName = data.lastName
    } else {
      requestData.companyName = data.companyName
    }

    return request.post('/crm-introducers', requestData)
  },

  // 更新介绍人
  updateIntroducer(id: number, data: UpdateIntroducerParams) {
    // 将前端参数转换为后端格式
    const requestData: CreateIntroducerRequest = {
      contactType: data.contactType,
      contactNature: data.contactNature,
      relationshipStatus: data.clientRelationshipStatus || undefined,
      rmUserId: data.rmUserId || undefined,
      email: data.email || undefined,
      mobilePhone: data.mobilePhone || undefined
    }

    if (data.contactNature === 'Individual') {
      requestData.title = data.title
      requestData.firstName = data.firstName
      requestData.lastName = data.lastName
    } else {
      requestData.companyName = data.companyName
    }

    return request.put(`/crm-introducers/${id}`, requestData)
  },

  // 删除介绍人
  deleteIntroducer(id: number) {
    return request.delete(`/crm-introducers/${id}`)
  },

  // 更新介绍人状态
  updateIntroducerStatus(id: number, isActive: boolean) {
    return request.put(`/crm-introducers/${id}/active`, {
      id: id,
      active: isActive
    })
  }
}
