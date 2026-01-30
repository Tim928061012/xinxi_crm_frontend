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
  // 获取 KYC 数据（使用 client-documents，documentType=SUPPORTING_DOCUMENT）
  async getKYC(clientId: number, clientType: 'Individual' | 'Corporate') {
    const res = await request.get('/client-documents', {
      params: {
        clientId,
        clientType,
        documentType: 'SUPPORTING_DOCUMENT'
      }
    })
    const list = (res as any).data || res || []
    const documents: KYCDocument[] = (list as any[]).map((item) => ({
      id: item.documentId || item.id,
      document: item.originalFilename || item.document || '',
      size: `${Math.round(((item.fileSizeBytes || 0) / 1024) * 100) / 100}KB`,
      uploadTime: item.uploadTime || item.createdAt || item.created_at || ''
    }))
    return { documents } as KYCData
  },

  // 更新 KYC 数据：后端按文件维度管理，这里不做批量更新，返回占位成功结果避免报错
  async updateKYC(clientId: number, data: KYCData) {
    return Promise.resolve({ success: true, clientId, data })
  },

  // 上传 KYC 文档（作为 SUPPORTING_DOCUMENT）
  uploadKYCDocument(clientId: number, clientType: 'Individual' | 'Corporate', file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', String(clientId))
    formData.append('clientType', clientType)
    formData.append('documentType', 'SUPPORTING_DOCUMENT')
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

