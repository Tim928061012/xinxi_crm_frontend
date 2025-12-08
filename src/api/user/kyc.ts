import request from '../request'

// KYC 文档
export interface KYCDocument {
  id?: number
  document: string
  size: string
  uploadTime: string
}

// KYC 数据
export interface KYCData {
  documents: KYCDocument[]
}

export const kycApi = {
  // 获取 KYC 数据
  getKYC(clientId: number) {
    return request.get(`/user/clients/${clientId}/kyc`)
  },

  // 更新 KYC 数据
  updateKYC(clientId: number, data: KYCData) {
    return request.put(`/user/clients/${clientId}/kyc`, data)
  },

  // 上传 KYC 文档
  uploadKYCDocument(clientId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/user/clients/${clientId}/kyc/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除 KYC 文档
  deleteKYCDocument(clientId: number, documentId: number) {
    return request.delete(`/user/clients/${clientId}/kyc/documents/${documentId}`)
  },

  // 打开/下载 KYC 文档
  getKYCDocument(clientId: number, documentId: number) {
    return request.get(`/user/clients/${clientId}/kyc/documents/${documentId}`, {
      responseType: 'blob'
    })
  }
}

