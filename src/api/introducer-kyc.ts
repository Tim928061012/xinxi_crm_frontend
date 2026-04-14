import request from './request'
import { formatFileSizeMb } from '@/utils/file-size'

export interface KYCDocument {
  id?: number
  document: string
  size: string
  uploadTime: string
}

export interface KycInfo {
  kycDate?: string
  kycStatus?: string
  nextReviewDate?: string
}

export interface IntroducerKYCData {
  kycDate?: string
  kycStatus?: string
  nextReviewDate?: string
  documents: KYCDocument[]
  nameScreeningDocuments: KYCDocument[]
}

export const introducerKycApi = {
  async getKycInfo(introducerId: number, contactNature: 'Individual' | 'Corporate') {
    const res = await request.get(`/crm-introducers/${introducerId}/kyc-info`, {
      params: { contactNature }
    })
    const data = (res as any).data ?? res ?? {}
    return {
      kycDate: data.kycDate ?? '',
      kycStatus: data.kycStatus ?? '',
      nextReviewDate: data.nextReviewDate ?? ''
    } as KycInfo
  },

  async updateKycInfo(introducerId: number, contactNature: 'Individual' | 'Corporate', info: KycInfo) {
    await request.put(`/crm-introducers/${introducerId}/kyc-info`, info, {
      params: { contactNature }
    })
  },

  async getKYC(introducerId: number, contactNature: 'Individual' | 'Corporate') {
    const [kycInfo, supportingRes, nameScreeningRes] = await Promise.all([
      introducerKycApi.getKycInfo(introducerId, contactNature),
      request.get('/introducer-documents', {
        params: { introducerId, introducerType: contactNature, documentType: 'SUPPORTING_DOCUMENT' }
      }),
      request.get('/introducer-documents', {
        params: { introducerId, introducerType: contactNature, documentType: 'NAME_SCREENING' }
      })
    ])
    const mapDoc = (list: any[]) =>
      (list || []).map((item: any) => ({
        id: item.documentId || item.id,
        document: item.originalFilename || item.document || '',
        size: formatFileSizeMb(item.fileSizeBytes || 0),
        uploadTime: item.uploadTime || item.createdAt || item.created_at || ''
      })) as KYCDocument[]
    const documents = mapDoc((supportingRes as any).data || supportingRes || [])
    const nameScreeningDocuments = mapDoc((nameScreeningRes as any).data || nameScreeningRes || [])
    return { ...kycInfo, documents, nameScreeningDocuments } as IntroducerKYCData
  },

  async updateKYC(introducerId: number, contactNature: 'Individual' | 'Corporate', data: IntroducerKYCData) {
    await introducerKycApi.updateKycInfo(introducerId, contactNature, {
      kycDate: data.kycDate,
      kycStatus: data.kycStatus,
      nextReviewDate: data.nextReviewDate
    })
    return { success: true, introducerId, data }
  },

  uploadKYCDocument(
    introducerId: number,
    contactNature: 'Individual' | 'Corporate',
    file: File,
    documentType: 'SUPPORTING_DOCUMENT' | 'NAME_SCREENING' = 'SUPPORTING_DOCUMENT'
  ) {
    const formData = new FormData()
    formData.append('files', file)
    formData.append('introducerId', String(introducerId))
    formData.append('introducerType', contactNature)
    formData.append('documentType', documentType)
    return request.post('/introducer-documents/upload', formData)
  },

  uploadKYCDocumentsBatch(
    introducerId: number,
    contactNature: 'Individual' | 'Corporate',
    files: File[],
    documentType: 'SUPPORTING_DOCUMENT' | 'NAME_SCREENING' = 'SUPPORTING_DOCUMENT'
  ) {
    if (files.length > 10) {
      return Promise.reject(new Error('At most 10 files per batch'))
    }
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    formData.append('introducerId', String(introducerId))
    formData.append('introducerType', contactNature)
    formData.append('documentType', documentType)
    return request.post('/introducer-documents/upload', formData)
  },

  deleteKYCDocument(_introducerId: number, documentId: number) {
    return request.delete(`/introducer-documents/${documentId}`)
  },

  getKYCDocument(_introducerId: number, documentId: number) {
    return request.get(`/introducer-documents/${documentId}/download`, {
      responseType: 'blob'
    })
  }
}
