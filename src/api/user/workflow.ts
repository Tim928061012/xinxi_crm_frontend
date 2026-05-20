import request from '../request'

export type ClientType = 'Individual' | 'Corporate'

export interface ClientProgressLog {
  logId: number
  actionType: string
  actionLabel?: string
  actionStatus: string
  actionStatusLabel?: string
  fromStatus?: string
  toStatus?: string
  actorRole?: string
  actorRoleLabel?: string
  actorName?: string
  message?: string
  createdAt: string
  latest?: boolean
}

export interface ClientProgressData {
  clientId: number
  clientType: ClientType
  progressStatus: string
  progressLabel?: string
  ownerRole?: string
  ownerRoleLabel?: string
  inactive: boolean
  signatureSubmittedByUserId?: number | null
  /** 客户创建人（客户表 creator），与进度日志无关；供 Progress 弹窗 Created By */
  createdByName?: string | null
  /** 客户表 created_at（首次保存），供 Progress「Created Time」；不用日志时间 */
  clientCreatedAt?: string | null
  availableActions: string[]
  logs: ClientProgressLog[]
}

export interface ClientComment {
  commentId: number
  parentCommentId?: number | null
  moduleName?: string
  title?: string
  description: string
  createdByUserId?: number
  createdByRole?: string
  createdByRoleLabel?: string
  createdByName?: string
  createdAt: string
  deletable?: boolean
  replies: ClientComment[]
}

export interface CreateCommentPayload {
  moduleName: string
  description: string
}

export interface ReplyCommentPayload {
  description: string
}

export interface WorkflowActionPayload {
  clientDetail?: any
}

const clientParams = (clientType: ClientType) => ({ clientType })

export const workflowApi = {
  /**
   * @param opts.skipErrorToast 为 true 时不触发全局 5xx/网络 Toast（供 Progress 等场景做重试）
   */
  getProgress(clientId: number, clientType: ClientType, opts?: { skipErrorToast?: boolean }) {
    return request.get(`/user/clients/${clientId}/progress`, {
      params: clientParams(clientType),
      ...(opts?.skipErrorToast ? { skipErrorToast: true as const } : {})
    } as Parameters<typeof request.get>[1])
  },

  submit(clientId: number, clientType: ClientType) {
    return request.post(`/user/clients/${clientId}/progress/submit`, null, { params: clientParams(clientType) })
  },

  withdraw(clientId: number, clientType: ClientType) {
    return request.post(`/user/clients/${clientId}/progress/withdraw`, null, { params: clientParams(clientType) })
  },

  submitSignature(clientId: number, clientType: ClientType) {
    return request.post(`/user/clients/${clientId}/progress/submit-signature`, null, { params: clientParams(clientType) })
  },

  approve(clientId: number, clientType: ClientType, payload?: WorkflowActionPayload) {
    return request.post(`/user/clients/${clientId}/progress/approve`, payload || {}, { params: clientParams(clientType) })
  },

  reject(clientId: number, clientType: ClientType, payload?: WorkflowActionPayload) {
    return request.post(`/user/clients/${clientId}/progress/reject`, payload || {}, { params: clientParams(clientType) })
  },

  deactivate(clientId: number, clientType: ClientType) {
    return request.post(`/user/clients/${clientId}/progress/deactivate`, null, { params: clientParams(clientType) })
  },

  activate(clientId: number, clientType: ClientType) {
    return request.post(`/user/clients/${clientId}/progress/activate`, null, { params: clientParams(clientType) })
  },

  getComments(clientId: number, clientType: ClientType, moduleName?: string) {
    return request.get(`/user/clients/${clientId}/comments`, {
      params: {
        ...clientParams(clientType),
        ...(moduleName ? { moduleName } : {})
      }
    })
  },

  createComment(clientId: number, clientType: ClientType, payload: CreateCommentPayload) {
    return request.post(`/user/clients/${clientId}/comments`, payload, {
      params: clientParams(clientType)
    })
  },

  replyComment(clientId: number, clientType: ClientType, commentId: number, payload: ReplyCommentPayload) {
    return request.post(`/user/clients/${clientId}/comments/${commentId}/reply`, payload, {
      params: clientParams(clientType)
    })
  },

  deleteComment(clientId: number, clientType: ClientType, commentId: number) {
    return request.delete(`/user/clients/${clientId}/comments/${commentId}`, {
      params: clientParams(clientType)
    })
  }
}
