export const WORKFLOW_STATUS_ORDER = [
  'PENDING_SUBMISSION',
  'OPERATIONAL_REVIEW',
  'COMPLIANCE_REVIEW',
  'PENDING_SIGNATURE',
  'SIGNATURE_UNDER_REVIEW',
  'ACTIVE'
] as const

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

/** 列表页「Edit / Delete」是否与参考稿一致：仅 Pending Submission 为高亮可点 */
export const canEditDeleteInClientList = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return false
  return normalizeProgressStatus(status) === 'PENDING_SUBMISSION'
}

export const isPendingSubmissionStatus = (status?: string | null, inactive?: boolean | null) => {
  if (inactive) return false
  return normalizeProgressStatus(status) === 'PENDING_SUBMISSION'
}

export type ProgressOwnerBadgeKind = 'rm' | 'operation' | 'compliance' | 'ro' | 'none'

/** 进度列右侧 pill：颜色参照设计稿（RM/ARM / Operation / Compliance / RO） */
export const getProgressOwnerBadgeKind = (
  ownerLabel?: string | null,
  progressStatus?: string | null,
  inactive?: boolean | null
): ProgressOwnerBadgeKind => {
  if (inactive) return 'none'
  const st = normalizeProgressStatus(progressStatus)
  if (st === 'ACTIVE') return 'none'

  const o = (ownerLabel || '').trim()
  const ol = o.toLowerCase()
  if (ol.includes('rm') || ol.includes('arm')) return 'rm'
  if (ol.includes('compliance')) return 'compliance'
  if (ol.includes('operation')) return 'operation'
  if (/\bro\b/.test(ol) || ol === 'ro') return 'ro'

  switch (st) {
    case 'PENDING_SUBMISSION':
      return 'rm'
    case 'OPERATIONAL_REVIEW':
    case 'PENDING_SIGNATURE':
      return 'operation'
    case 'COMPLIANCE_REVIEW':
      return 'compliance'
    case 'SIGNATURE_UNDER_REVIEW':
      return 'ro'
    default:
      return 'none'
  }
}

