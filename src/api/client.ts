import request from './request'

// Admin 客户数据结构（与普通用户的 Client 完全独立）
export interface AdminClient {
  id: number
  clientId?: number // 用于区分个人客户和企业客户
  client: string // 客户名称
  rm: string // Relationship Manager
  compliance: boolean // 合规状态
  operation: boolean // 运营状态
  createdTime: string
  type?: 'individual' | 'corporate' // 客户类型：个人或企业
}

export interface UpdateComplianceOperationParams {
  compliance: boolean
  operation: boolean
}

// Admin 客户 API（与普通用户的 userClientApi 完全独立）
export const adminClientApi = {
  // 获取所有客户列表（管理员视图）
  getClients(params?: any) {
    return request.get('/admin/clients', { params })
  },

  // 修改个人客户的 compliance 和 operation
  updateIndividualComplianceOperation(id: number, data: UpdateComplianceOperationParams) {
    return request.put(`/client-individuals/${id}/compliance-operation`, data)
  },

  // 修改企业客户的 compliance 和 operation
  updateCorporateComplianceOperation(id: number, data: UpdateComplianceOperationParams) {
    return request.put(`/client-corporates/${id}/compliance-operation`, data)
  }
}

