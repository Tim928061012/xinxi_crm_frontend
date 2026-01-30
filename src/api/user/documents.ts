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
  // 获取文档列表（从 client-documents 读取并按类型拆分）
  async getDocuments(clientId: number, clientType: 'Individual' | 'Corporate') {
    const res = await request.get('/client-documents', {
      params: {
        clientId,
        clientType
      }
    })
    const list = (res as any).data || res || []
    const docs: DocumentsData = {
      identity: [],
      address: [],
      forms: [],
      statements: []
    }

    const mapOne = (item: any): Document => ({
      id: item.documentId || item.id,
      document: item.originalFilename || item.document || '',
      size: `${Math.round(((item.fileSizeBytes || 0) / 1024) * 100) / 100}KB`,
      uploadTime: item.uploadTime || item.createdAt || item.created_at || '',
      type: 'identity' // 默认值，下面按 documentType 重写
    })

    ;(list as any[]).forEach((item) => {
      const docType = (item.documentType || '').toUpperCase()
      const base = mapOne(item)
      if (docType === 'IDENTITY_PROOF') {
        base.type = 'identity'
        docs.identity.push(base)
      } else if (docType === 'ADDRESS_PROOF') {
        base.type = 'address'
        docs.address.push(base)
      } else if (docType === 'FORMS') {
        base.type = 'forms'
        docs.forms.push(base)
      } else if (docType === 'XINXI_STATEMENTS') {
        base.type = 'statements'
        docs.statements.push(base)
      }
    })

    return docs
  },

  // 更新文档列表：后端按文件维度管理，这里不做批量更新
  async updateDocuments(clientId: number, data: DocumentsData) {
    return Promise.resolve({ success: true, clientId, data })
  },

  // 上传文档
  uploadDocument(clientId: number, clientType: 'Individual' | 'Corporate', type: DocumentType, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', String(clientId))
    formData.append('clientType', clientType)

    let documentType = ''
    if (type === 'identity') documentType = 'IDENTITY_PROOF'
    else if (type === 'address') documentType = 'ADDRESS_PROOF'
    else if (type === 'forms') documentType = 'FORMS'
    else if (type === 'statements') documentType = 'XINXI_STATEMENTS'

    formData.append('documentType', documentType)

    return request.post('/client-documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除文档
  deleteDocument(_clientId: number, documentId: number) {
    return request.delete(`/client-documents/${documentId}`)
  },

  // 打开/下载文档
  getDocument(_clientId: number, documentId: number) {
    return request.get(`/client-documents/${documentId}/download`, {
      responseType: 'blob'
    })
  }
}

