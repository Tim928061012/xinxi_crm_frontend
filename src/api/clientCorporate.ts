import request from './request'

// 创建企业客户请求参数（根据后端 ClientCorporate 模型和 Mapper 中的 insert 字段）
export interface CreateCorporateClientRequest {
  corporateId?: number
  contactType: string
  contactNature: string
  rmUserId: number
  armUserId?: number
  introducerId?: number
  clientBusinessId?: string
  relationshipStatus?: string
  companyName: string
  chineseCompanyName?: string
  corporateType?: string
  industry?: string
  isStateOwned?: boolean
  idType?: string
  idNumber?: string
  registrationDate?: string | null
  registrationCountry?: string
  compliance?: boolean
  operation?: boolean
  previousRelationshipStatus?: string
  creatorId?: number
  creatorName?: string
  updatorId?: number
  updatorName?: string
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
}

export const corporateClientApi = {
  // 创建企业客户
  createCorporateClient(data: CreateCorporateClientRequest) {
    return request.post('/client-corporates', data)
  }
}

