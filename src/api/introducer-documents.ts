import request from './request'
import { formatFileSizeMb } from '@/utils/file-size'

/** Introducer Documents Tab：不含 XinXi Statements */
export type IntroducerDocumentType = 'identity' | 'address' | 'forms' | 'others'

export interface IntroducerDocument {
  id?: number
  document: string
  size: string
  uploadTime: string
  type: IntroducerDocumentType
}

export interface IntroducerDocumentsData {
  identity: IntroducerDocument[]
  address: IntroducerDocument[]
  forms: IntroducerDocument[]
  others: IntroducerDocument[]
}

export const introducerDocumentsApi = {
  async getDocuments(introducerId: number, contactNature: 'Individual' | 'Corporate') {
    const res = await request.get('/introducer-documents', {
      params: {
        introducerId,
        introducerType: contactNature
      }
    })
    const list = (res as any).data || res || []
    const docs: IntroducerDocumentsData = {
      identity: [],
      address: [],
      forms: [],
      others: []
    }

    const mapOne = (item: any): IntroducerDocument => ({
      id: item.documentId || item.id,
      document: item.originalFilename || item.document || '',
      size: formatFileSizeMb(item.fileSizeBytes || 0),
      uploadTime: item.uploadTime || item.createdAt || item.created_at || '',
      type: 'identity'
    })

    ;(list as any[]).forEach(item => {
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
      } else if (docType === 'OTHER_DOCUMENTS') {
        base.type = 'others'
        docs.others.push(base)
      }
    })

    return docs
  },

  async updateDocuments(_introducerId: number, _data: IntroducerDocumentsData) {
    return Promise.resolve({ success: true })
  },

  uploadDocument(
    introducerId: number,
    contactNature: 'Individual' | 'Corporate',
    type: IntroducerDocumentType,
    file: File
  ) {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('introducerId', String(introducerId))
    formData.append('introducerType', contactNature)

    let documentType = ''
    if (type === 'identity') documentType = 'IDENTITY_PROOF'
    else if (type === 'address') documentType = 'ADDRESS_PROOF'
    else if (type === 'forms') documentType = 'FORMS'
    else if (type === 'others') documentType = 'OTHER_DOCUMENTS'

    formData.append('documentType', documentType)

    return request.post('/introducer-documents/upload', formData)
  },

  uploadDocumentsBatch(
    introducerId: number,
    contactNature: 'Individual' | 'Corporate',
    type: IntroducerDocumentType,
    files: File[]
  ) {
    if (files.length > 10) {
      return Promise.reject(new Error('At most 10 files per batch'))
    }
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    formData.append('introducerId', String(introducerId))
    formData.append('introducerType', contactNature)

    let documentType = ''
    if (type === 'identity') documentType = 'IDENTITY_PROOF'
    else if (type === 'address') documentType = 'ADDRESS_PROOF'
    else if (type === 'forms') documentType = 'FORMS'
    else if (type === 'others') documentType = 'OTHER_DOCUMENTS'

    formData.append('documentType', documentType)
    return request.post('/introducer-documents/upload', formData)
  },

  deleteDocument(_introducerId: number, documentId: number) {
    return request.delete(`/introducer-documents/${documentId}`)
  },

  getDocument(_introducerId: number, documentId: number) {
    return request.get(`/introducer-documents/${documentId}/download`, {
      responseType: 'blob'
    })
  }
}
