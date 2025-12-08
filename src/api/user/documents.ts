import request from '../request'

// 文档类型
export type DocumentType = 'identity' | 'address' | 'forms' | 'statements'

// 文档
export interface Document {
  id?: number
  document: string
  size: string
  uploadTime: string
  type: DocumentType
}

// 文档列表
export interface DocumentsData {
  identity: Document[]
  address: Document[]
  forms: Document[]
  statements: Document[]
}

export const documentsApi = {
  // 获取文档列表
  getDocuments(clientId: number) {
    return request.get(`/user/clients/${clientId}/documents`)
  },

  // 更新文档列表
  updateDocuments(clientId: number, data: DocumentsData) {
    return request.put(`/user/clients/${clientId}/documents`, data)
  },

  // 上传文档
  uploadDocument(clientId: number, type: DocumentType, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return request.post(`/user/clients/${clientId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除文档
  deleteDocument(clientId: number, documentId: number) {
    return request.delete(`/user/clients/${clientId}/documents/${documentId}`)
  },

  // 打开/下载文档
  getDocument(clientId: number, documentId: number) {
    return request.get(`/user/clients/${clientId}/documents/${documentId}`, {
      responseType: 'blob'
    })
  }
}

