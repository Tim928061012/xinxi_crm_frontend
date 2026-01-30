import request from './request'

// 创建个人客户请求参数（根据后端提供的结构）
export interface CreateIndividualClientRequest {
  id: number
  contactType: string
  contactNature: string
  rmUserId: number
  introducerId: number
  clientBusinessId: string
  relationshipStatus: string
  gender: number
  maritalStatus: string
  title: string
  firstName: string
  lastName: string
  chineseName: string
  educationLevel: string
  birthday: string | null
  birthCountry: string
  hasDualCitizenship: boolean
  nationality: string
  idType: string
  idNumber: string
  idExpiryDate: string | null
  compliance: boolean
  operation: boolean
  previousRelationshipStatus: string
  creatorId: number
  creatorName: string
  updatorId: number
  updatorName: string
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export const individualClientApi = {
  // 创建个人客户
  createIndividualClient(data: CreateIndividualClientRequest) {
    return request.post('/client-individuals', data)
  }
}


