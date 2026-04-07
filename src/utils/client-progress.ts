export const WORKFLOW_STATUS_ORDER = [
  'PENDING_SUBMISSION',
  'OPERATIONAL_REVIEW',
  'COMPLIANCE_REVIEW',
  'PENDING_SIGNATURE',
  'SIGNATURE_UNDER_REVIEW',
  'ACTIVE'
] as const

export type WorkflowModule = 'GENERAL' | 'KYC' | 'RISK' | 'DOCUMENTS' | 'FEE'

const STATUS_LABEL_MAP: Record<string, string> = {
  PENDING_SUBMISSION: 'Pending Submission',
  OPERATIONAL_REVIEW: 'Operational Review',
  COMPLIANCE_REVIEW: 'Compliance Review',
  PENDING_SIGNATURE: 'Pending Signature',
  SIGNATURE_UNDER_REVIEW: 'Signature Under Review',
  ACTIVE: 'Active'
}

export const normalizeProgressStatus = (status?: string | null) => (status || '').trim().toUpperCase()

export const getProgressLabel = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return 'Inactive'
  const normalized = normalizeProgressStatus(status)
  return STATUS_LABEL_MAP[normalized] || status || '-'
}

export const getProgressTagType = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return 'info'
  switch (normalizeProgressStatus(status)) {
    case 'ACTIVE':
      return 'success'
    case 'PENDING_SUBMISSION':
      return 'warning'
    default:
      return 'primary'
  }
}

export const getProgressSortWeight = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return WORKFLOW_STATUS_ORDER.length + 1
  const index = WORKFLOW_STATUS_ORDER.indexOf(normalizeProgressStatus(status) as (typeof WORKFLOW_STATUS_ORDER)[number])
  return index === -1 ? WORKFLOW_STATUS_ORDER.length : index
}

export const isClientEditable = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return false
  const normalized = normalizeProgressStatus(status)
  return normalized === 'PENDING_SUBMISSION' || normalized === 'ACTIVE'
}

export const mapTabToCommentModule = (tab: string): WorkflowModule => {
  switch (tab) {
    case 'kyc':
      return 'KYC'
    case 'risk':
      return 'RISK'
    case 'documents':
      return 'DOCUMENTS'
    case 'fee':
      return 'FEE'
    default:
      return 'GENERAL'
  }
}
