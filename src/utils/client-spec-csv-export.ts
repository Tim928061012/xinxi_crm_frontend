import type { Client, CorporateGeneralInfo, IndividualGeneralInfo } from '@/api/user/client'
import type { KycInfo } from '@/api/user/kyc'
import type { FeeSchedule } from '@/api/user/fee-schedule'
import type { InvestmentRiskProfile } from '@/api/user/risk-profile'

/** 与 `工作簿1.xlsx` Sheet1 一致：五列表头 + 73 行模板 */
export const CLIENT_SPEC_CSV_HEADER = [
  'First-level menu',
  'Second-level menu',
  'Field',
  'Value1',
  'Value2'
] as const

export const CLIENT_SPEC_CSV_TEMPLATE_ROWS: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ['General', 'Basic', 'Contact Type', '', ''],
  ['', '', 'Contact Nature', '', ''],
  ['', '', 'Client Id', '', ''],
  ['', '', 'Client Relationship Status', '', ''],
  ['', '', 'Title', '', ''],
  ['', '', 'First Name', '', ''],
  ['', '', 'Last Name', '', ''],
  ['', '', 'Chinese Name', '', ''],
  ['', '', 'Id Type', '', ''],
  ['', '', 'Id No.', '', ''],
  ['', '', 'Id Expiry (dd/mm/yyyy)', '', ''],
  ['', '', 'RM', '', ''],
  ['', '', 'ARM', '', ''],
  ['', '', 'Introducer', '', ''],
  ['', '', 'Gender', '', ''],
  ['', '', 'Marital Status', '', ''],
  ['', '', 'Education Level', '', ''],
  ['', '', 'Birthday (dd/mm/yyyy)', '', ''],
  ['', '', 'Country/Region of Birth', '', ''],
  ['', '', 'Dual Citizenship', '', ''],
  ['', '', 'Nationality', '', ''],
  ['', 'Contact', 'Mobile Phone', '', ''],
  ['', '', 'Home Phone', '', ''],
  ['', '', 'Jurisdiction of Contact No. and Address Differs', '', ''],
  ['', '', 'Primary Email', '', ''],
  ['', '', 'Address', '', ''],
  ['', 'Secondary Contact', 'Mobile Phone', '', ''],
  ['', '', 'Home Phone', '', ''],
  ['', '', 'Jurisdiction of Contact No. and Address Differs', '', ''],
  ['', '', 'Primary Email', '', ''],
  ['', '', 'Address', '', ''],
  ['', 'Portfolio', 'Bank', '', ''],
  ['', '', 'Booking Centre', '', ''],
  ['', '', 'Portfolio No.', '', ''],
  ['', '', 'Upload Time', '', ''],
  ['', '', 'Bank', '', ''],
  ['', '', 'Booking Centre', '', ''],
  ['', '', 'Portfolio No.', '', ''],
  ['', '', 'Upload Time', '', ''],
  ['KYC', 'Information', 'KYC Date (dd/mm/yyyy)', '', ''],
  ['', '', 'Next Review Date (dd/mm/yyyy)', '', ''],
  ['', '', 'KYC Status', '', ''],
  ['Investment Risk Profile', 'Overview', 'Investment Risk Rating', '', ''],
  ['', '', 'Remarks', '', ''],
  ['', '', 'HongKong PI', '', ''],
  ['', 'Vulnerable Client Assessment', '1. Age 65 years old and above', '', ''],
  ['', '', '2. Physical or intellectual disabilities', '', ''],
  ['', '', '3. Not proficient in written or spoken English', '', ''],
  ['', '', '4. Education primary or below and has no investment', '', ''],
  ['', '', 'Vulnerable Client', '', ''],
  ['', '', 'Review Date (dd/mm/yyyy)', '', ''],
  ['', 'Investment Knowledge & Experience', 'Alternative Investments', 'yes', 'no'],
  ['', '', 'Bonds', 'yes', 'no'],
  ['', '', 'Bonds With Special Features', 'yes', 'no'],
  ['', '', 'Commodities', 'yes', 'no'],
  ['', '', 'Deposits (including foreign currency deposits)', 'yes', 'no'],
  ['', '', 'Equities', 'yes', 'no'],
  ['', '', 'Equity Funds / Money Market Funds', 'yes', 'no'],
  ['', '', 'Synthetic ETF / Futures-based ETF / Leveraged and Inverse Products', 'yes', 'no'],
  ['', '', 'Other Mutual Funds', 'yes', 'no'],
  ['', '', 'Derivatives', 'yes', 'no'],
  ['', '', 'Foreign Exchange (e.g. Spot)', 'yes', 'no'],
  ['', '', 'Security Tokens', 'yes', 'no'],
  ['', '', 'Margin/Leveraged Trading', 'yes', 'no'],
  ['Fee Schedule', '-', 'Management Fee', 'yes', ''],
  ['', '', 'Yearly Management Fee (%)', '', ''],
  ['', '', 'Minimum Management Fee (p.a.)', '', ''],
  ['', '', 'Retrocession', 'yes', ''],
  ['', '', 'Performance Fee', 'yes', ''],
  ['', '', 'Hurdle Rate (%)', '', ''],
  ['', '', 'Profit shared to XinXi (%)', '', ''],
  ['', '', 'Others', 'yes', ''],
  ['', '', 'Details', '', '']
]

type SpecRow = [string, string, string, string, string]

function escapeCsvField(value: string): string {
  const s = value ?? ''
  // Spec 导出中的数字统一按文本原样写入，避免 Excel 自动转科学计数法（含 Portfolio No. / Id No. 等）。
  if (/^-?\d+(?:\.\d+)?$/.test(s)) {
    return `="${s}"`
  }
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function fmt(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function yn(b: boolean | undefined): string {
  if (b === true) return 'yes'
  return ''
}

/** 将常见日期串规范为 dd/mm/yyyy（已为该格式则原样返回） */
export function toDdMmYyyy(value?: string | null): string {
  if (!value) return ''
  const t = String(value).trim()
  const m1 = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m1) return `${m1[1]}/${m1[2]}/${m1[3]}`
  const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) {
    const [, y, mo, d] = m2
    return `${d}/${mo}/${y}`
  }
  const m3 = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (m3) {
    const [, y, mo, d] = m3
    return `${d}/${mo}/${y}`
  }
  return t
}

function cloneTemplate(): SpecRow[] {
  return CLIENT_SPEC_CSV_TEMPLATE_ROWS.map(r => [...r] as SpecRow)
}

/**
 * 按工作簿模板填充一行客户完整数据（需传入 KYC / 风险 / 费用接口结果）
 */
export function fillClientSpecExportRows(
  client: Client,
  kyc: KycInfo,
  risk: InvestmentRiskProfile,
  fee: FeeSchedule
): SpecRow[] {
  const template = cloneTemplate()
  const g = client.general
  const cn = client.contactNature
  const contact = client.contact || {}
  const sec = client.secondaryContact || {}
  const portfolios = client.portfolios || []
  const portfolioCount = Math.max(1, portfolios.length)

  // 0~30 为 General/Contact/Secondary Contact；39 起为 KYC~Fee。
  // Portfolio 区改为按记录数动态平铺（最少 1 组，超过 2 组继续追加）。
  const row: SpecRow[] = [
    ...template.slice(0, 31),
    ...Array.from({ length: portfolioCount }).flatMap((_, i) => ([
      ['', i === 0 ? 'Portfolio' : '', 'Bank', '', ''],
      ['', '', 'Booking Centre', '', ''],
      ['', '', 'Portfolio No.', '', ''],
      ['', '', 'Upload Time', '', '']
    ] as SpecRow[])),
    ...template.slice(39)
  ]

  const indexOfField = (field: string) => row.findIndex(r => r[2] === field)

  row[0][3] = fmt((g as { contactType?: string }).contactType) || 'Client'
  row[1][3] = fmt(cn)
  row[2][3] = fmt((g as { clientId?: string }).clientId)
  row[3][3] = fmt((g as { clientRelationshipStatus?: string }).clientRelationshipStatus)

  if (cn === 'Individual') {
    const ig = g as IndividualGeneralInfo
    row[4][3] = fmt(ig.title)
    row[5][3] = fmt(ig.firstName)
    row[6][3] = fmt(ig.lastName)
    row[7][3] = fmt(ig.chineseName)
    row[8][3] = fmt(ig.idType)
    row[9][3] = fmt(ig.idNo)
    row[10][3] = toDdMmYyyy(ig.idExpiry)
    row[14][3] = fmt(ig.gender)
    row[15][3] = fmt(ig.maritalStatus)
    row[16][3] = fmt(ig.educationLevel)
    row[17][3] = toDdMmYyyy(ig.birthday)
    row[18][3] = fmt(ig.countryOfBirth)
    row[19][3] = yn(ig.dualCitizenship)
    row[20][3] = fmt(ig.nationality)
  } else {
    const cg = g as CorporateGeneralInfo
    row[4][3] = fmt(contact.title)
    row[5][3] = fmt(cg.companyName)
    row[6][3] = fmt(contact.lastName)
    row[7][3] = fmt(cg.chineseName)
    row[8][3] = fmt(cg.idType)
    row[9][3] = fmt(cg.idNo)
    row[10][3] = toDdMmYyyy(contact.idExpiry)
    row[14][3] = ''
    row[15][3] = ''
    row[16][3] = ''
    row[17][3] = ''
    row[18][3] = ''
    row[19][3] = ''
    row[20][3] = ''
  }

  row[11][3] = fmt((g as { rm?: string }).rm)
  row[12][3] = fmt((g as { arm?: string }).arm)
  row[13][3] = fmt((g as { introducer?: string }).introducer)

  row[21][3] = fmt(contact.mobilePhone)
  row[22][3] = fmt(contact.homePhone)
  row[23][3] = yn(contact.jurisdictionDiffers)
  row[24][3] = fmt(contact.primaryEmail)
  row[25][3] = fmt(contact.address)

  row[26][3] = fmt(sec.mobilePhone)
  row[27][3] = fmt(sec.homePhone)
  row[28][3] = yn(sec.jurisdictionDiffers)
  row[29][3] = fmt(sec.primaryEmail)
  row[30][3] = fmt(sec.address)

  const portfolioStart = 31
  for (let i = 0; i < portfolioCount; i++) {
    const p = portfolios[i]
    const offset = portfolioStart + i * 4
    row[offset][3] = fmt(p?.bank)
    row[offset + 1][3] = fmt(p?.bookingCentre)
    row[offset + 2][3] = fmt(p?.portfolioNo)
    row[offset + 3][3] = fmt(p?.uploadTime)
  }

  row[indexOfField('KYC Date (dd/mm/yyyy)')][3] = fmt(kyc.kycDate)
  row[indexOfField('Next Review Date (dd/mm/yyyy)')][3] = fmt(kyc.nextReviewDate)
  row[indexOfField('KYC Status')][3] = fmt(kyc.kycStatus)

  row[indexOfField('Investment Risk Rating')][3] = fmt(risk.investmentRiskRating)
  row[indexOfField('Remarks')][3] = fmt(risk.remarks)
  row[indexOfField('HongKong PI')][3] = yn(risk.hongKongPI)

  const v = risk.vulnerableClientAssessment
  if (v) {
    row[indexOfField('1. Age 65 years old and above')][3] = yn(v.age65AndAbove)
    row[indexOfField('2. Physical or intellectual disabilities')][3] = yn(v.physicalOrIntellectualDisabilities)
    row[indexOfField('3. Not proficient in written or spoken English')][3] = yn(v.notProficientInEnglish)
    row[indexOfField('4. Education primary or below and has no investment')][3] = yn(v.educationPrimaryOrBelow)
    row[indexOfField('Vulnerable Client')][3] = yn(v.vulnerableClient)
    row[indexOfField('Review Date (dd/mm/yyyy)')][3] = fmt(v.reviewDate)
  }

  const types = risk.investmentKnowledgeExperience?.types || []
  const investmentTypeLabels = [
    'Alternative Investments',
    'Bonds',
    'Bonds With Special Features',
    'Commodities',
    'Deposits (including foreign currency deposits)',
    'Equities',
    'Equity Funds / Money Market Funds',
    'Synthetic ETF / Futures-based ETF / Leveraged and Inverse Products',
    'Other Mutual Funds',
    'Derivatives',
    'Foreign Exchange (e.g. Spot)',
    'Security Tokens',
    'Margin/Leveraged Trading'
  ]
  for (const label of investmentTypeLabels) {
    const i = indexOfField(label)
    if (i < 0) continue
    const t = types.find(x => x.type === label)
    if (t) {
      row[i][3] = yn(t.knowledge)
      row[i][4] = yn(t.experience)
    } else {
      row[i][3] = ''
      row[i][4] = ''
    }
  }

  row[indexOfField('Management Fee')][3] = yn(fee.managementFee.enabled)
  row[indexOfField('Yearly Management Fee (%)')][3] =
    fee.managementFee.yearlyManagementFee != null ? String(fee.managementFee.yearlyManagementFee) : ''
  row[indexOfField('Minimum Management Fee (p.a.)')][3] =
    fee.managementFee.minimumManagementFee != null ? String(fee.managementFee.minimumManagementFee) : ''
  row[indexOfField('Retrocession')][3] = yn(fee.retrocession.enabled)
  row[indexOfField('Performance Fee')][3] = yn(fee.performanceFee.enabled)
  row[indexOfField('Hurdle Rate (%)')][3] =
    fee.performanceFee.hurdleRate != null ? String(fee.performanceFee.hurdleRate) : ''
  row[indexOfField('Profit shared to XinXi (%)')][3] =
    fee.performanceFee.profitSharedToXinXi != null ? String(fee.performanceFee.profitSharedToXinXi) : ''
  row[indexOfField('Others')][3] = yn(fee.others.enabled)
  row[indexOfField('Details')][3] = fmt(fee.others.details)

  return row
}

function csvBlockLines(rows: SpecRow[]): string[] {
  const headerLine = CLIENT_SPEC_CSV_HEADER.map(escapeCsvField).join(',')
  return [headerLine, ...rows.map(r => r.map(escapeCsvField).join(','))]
}

/** 单客户：UTF-8 BOM + 表头 + 73 行数据，末尾 CRLF */
export function buildClientSpecCsv(rows: SpecRow[]): string {
  const lines = csvBlockLines(rows)
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

/** 多客户：每段重复「表头 + 73 行」，段之间 CRLF 衔接 */
export function buildMultiClientSpecCsv(blocks: SpecRow[][]): string {
  if (!blocks.length) return '\uFEFF\r\n'
  const text = blocks.map(b => csvBlockLines(b).join('\r\n')).join('\r\n')
  return `\uFEFF${text}\r\n`
}
