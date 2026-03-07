import request from '../request'

// KYC 文档
export interface KYCDocument {
  id?: number
  document: string
  size: string
  uploadTime: string
}

// KYC 顶部信息（文件上传之前）
export interface KycInfo {
  kycDate?: string       // dd/mm/yyyy
  kycStatus?: string    // completed | incompleted
  nextReviewDate?: string // dd/mm/yyyy
}

// KYC 数据
export interface KYCData {
  kycDate?: string
  kycStatus?: string
  nextReviewDate?: string
  documents: KYCDocument[]
  nameScreeningDocuments: KYCDocument[]
}

export const kycApi = {
  // 获取 KYC 信息（顶部三个字段）
  async getKycInfo(clientId: number, clientType: 'Individual' | 'Corporate') {
    const res = await request.get(`/user/clients/${clientId}/kyc-info`, {
      params: { clientType }
    })
    const data = (res as any).data ?? res ?? {}
    return {
      kycDate: data.kycDate ?? '',
      kycStatus: data.kycStatus ?? '',
      nextReviewDate: data.nextReviewDate ?? ''
    } as KycInfo
  },

  // 更新 KYC 信息（顶部三个字段）
  async updateKycInfo(clientId: number, clientType: 'Individual' | 'Corporate', info: KycInfo) {
    await request.put(`/user/clients/${clientId}/kyc-info`, info, {
      params: { clientType }
    })
  },

  // 获取 KYC 数据（Supporting + Name Screening 两类文档）
  async getKYC(clientId: number, clientType: 'Individual' | 'Corporate') {
    const [kycInfo, supportingRes, nameScreeningRes] = await Promise.all([
      kycApi.getKycInfo(clientId, clientType),
      request.get('/client-documents', {
        params: { clientId, clientType, documentType: 'SUPPORTING_DOCUMENT' }
      }),
      request.get('/client-documents', {
        params: { clientId, clientType, documentType: 'NAME_SCREENING' }
      })
    ])
    const mapDoc = (list: any[]) => (list || []).map((item: any) => ({
      id: item.documentId || item.id,
      document: item.originalFilename || item.document || '',
      size: `${Math.round(((item.fileSizeBytes || 0) / 1024) * 100) / 100}KB`,
      uploadTime: item.uploadTime || item.createdAt || item.created_at || ''
    })) as KYCDocument[]
    const documents = mapDoc((supportingRes as any).data || supportingRes || [])
    const nameScreeningDocuments = mapDoc((nameScreeningRes as any).data || nameScreeningRes || [])
    return { ...kycInfo, documents, nameScreeningDocuments } as KYCData
  },

  // 更新 KYC 数据：保存顶部信息 + 后端按文件维度管理
  async updateKYC(clientId: number, clientType: 'Individual' | 'Corporate', data: KYCData) {
    await kycApi.updateKycInfo(clientId, clientType, {
      kycDate: data.kycDate,
      kycStatus: data.kycStatus,
      nextReviewDate: data.nextReviewDate
    })
    return { success: true, clientId, data }
  },

  // 上传 KYC 文档（documentType: SUPPORTING_DOCUMENT | NAME_SCREENING）
  uploadKYCDocument(clientId: number, clientType: 'Individual' | 'Corporate', file: File, documentType: 'SUPPORTING_DOCUMENT' | 'NAME_SCREENING' = 'SUPPORTING_DOCUMENT') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', String(clientId))
    formData.append('clientType', clientType)
    formData.append('documentType', documentType)
    return request.post('/client-documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除 KYC 文档
  deleteKYCDocument(_clientId: number, documentId: number) {
    return request.delete(`/client-documents/${documentId}`)
  },

  // 打开/下载 KYC 文档
  getKYCDocument(_clientId: number, documentId: number) {
    return request.get(`/client-documents/${documentId}/download`, {
      responseType: 'blob'
    })
  }
}

