/**
 * 评论 module：两级结构中的「模块」维度 — 对应各 Tab 下区块标题（非顶层 Tab 名）。
 * module_name 存稳定英文 code，展示用 {@link getCommentModuleLabel}。
 */

export const COMMENT_MODULE_CODES = [
  'BASIC',
  'CONTACT',
  'SECONDARY_CONTACT',
  'PORTFOLIO',
  'KYC_INFORMATION',
  'KYC_SUPPORTING_DOCUMENTS',
  'KYC_NAME_SCREENING',
  'RISK_OVERVIEW',
  'RISK_VULNERABLE_CLIENT',
  'RISK_INVESTMENT_KNOWLEDGE',
  'DOCS_IDENTITY',
  'DOCS_ADDRESS',
  'DOCS_FORMS',
  'DOCS_STATEMENTS',
  'DOCS_OTHERS',
  'FEE_SCHEDULE'
] as const

export type CommentModuleCode = (typeof COMMENT_MODULE_CODES)[number]

/** 下拉与创建评论：顺序与页面区块大致一致 */
export const COMMENT_MODULE_OPTIONS: { label: string; value: CommentModuleCode }[] = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Contact', value: 'CONTACT' },
  { label: 'Secondary Contact', value: 'SECONDARY_CONTACT' },
  { label: 'Portfolio', value: 'PORTFOLIO' },
  { label: 'Information', value: 'KYC_INFORMATION' },
  { label: 'Supporting Documents', value: 'KYC_SUPPORTING_DOCUMENTS' },
  { label: 'Name Screening Documents', value: 'KYC_NAME_SCREENING' },
  { label: 'Overview', value: 'RISK_OVERVIEW' },
  { label: 'Vulnerable Client Assessment', value: 'RISK_VULNERABLE_CLIENT' },
  { label: 'Investment Knowledge & Experience', value: 'RISK_INVESTMENT_KNOWLEDGE' },
  { label: 'Identity Proof', value: 'DOCS_IDENTITY' },
  { label: 'Address Proof', value: 'DOCS_ADDRESS' },
  { label: 'Forms', value: 'DOCS_FORMS' },
  { label: 'XinXi Statements', value: 'DOCS_STATEMENTS' },
  { label: 'Others Documents', value: 'DOCS_OTHERS' },
  { label: 'Fee Schedule', value: 'FEE_SCHEDULE' }
]

const COMMENT_MODULE_LABELS: Record<string, string> = Object.fromEntries(
  COMMENT_MODULE_OPTIONS.map(o => [o.value, o.label])
) as Record<string, string>

/** 历史数据：旧版按 Tab 存的 module_name */
Object.assign(COMMENT_MODULE_LABELS, {
  GENERAL: 'General',
  KYC: 'KYC',
  RISK: 'Investment Risk Profile',
  DOCUMENTS: 'Documents',
  FEE: 'Fee Schedule'
})

export function getCommentModuleLabel(code?: string | null): string {
  if (code == null || code === '') return ''
  return COMMENT_MODULE_LABELS[code] ?? code
}

/** 从主 Tab 进入 Comments 时，筛选/默认模块为该 Tab 下合理默认区块 */
export function mapTabToCommentModule(tab: string): CommentModuleCode {
  switch (tab) {
    case 'kyc':
      return 'KYC_INFORMATION'
    case 'risk':
      return 'RISK_OVERVIEW'
    case 'documents':
      return 'DOCS_IDENTITY'
    case 'fee':
      return 'FEE_SCHEDULE'
    case 'general':
    default:
      return 'BASIC'
  }
}
