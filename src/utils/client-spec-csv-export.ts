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
  if (b === false) return 'no'
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
  const row = cloneTemplate()
  const g = client.general
  const cn = client.contactNature
  const contact = client.contact || {}
  const sec = client.secondaryContact || {}
  const portfolios = client.portfolios || []

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

  const p0 = portfolios[0]
  const p1 = portfolios[1]
  if (p0) {
    row[31][3] = fmt(p0.bank)
    row[32][3] = fmt(p0.bookingCentre)
    row[33][3] = fmt(p0.portfolioNo)
    row[34][3] = fmt(p0.uploadTime)
  }
  if (p1) {
    row[35][3] = fmt(p1.bank)
    row[36][3] = fmt(p1.bookingCentre)
    row[37][3] = fmt(p1.portfolioNo)
    row[38][3] = fmt(p1.uploadTime)
  }

  row[38][3] = fmt(kyc.kycDate)
  row[39][3] = fmt(kyc.nextReviewDate)
  row[40][3] = fmt(kyc.kycStatus)

  row[41][3] = fmt(risk.investmentRiskRating)
  row[42][3] = fmt(risk.remarks)
  row[43][3] = yn(risk.hongKongPI)

  const v = risk.vulnerableClientAssessment
  if (v) {
    row[44][3] = yn(v.age65AndAbove)
    row[45][3] = yn(v.physicalOrIntellectualDisabilities)
    row[46][3] = yn(v.notProficientInEnglish)
    row[47][3] = yn(v.educationPrimaryOrBelow)
    row[48][3] = yn(v.vulnerableClient)
    row[49][3] = fmt(v.reviewDate)
  }

  const types = risk.investmentKnowledgeExperience?.types || []
  for (let i = 51; i <= 63; i++) {
    const label = row[i][2]
    const t = types.find(x => x.type === label)
    if (t) {
      row[i][3] = yn(t.knowledge)
      row[i][4] = yn(t.experience)
    } else {
      row[i][3] = ''
      row[i][4] = ''
    }
  }

  row[64][3] = yn(fee.managementFee.enabled)
  row[65][3] = fee.managementFee.yearlyManagementFee != null ? String(fee.managementFee.yearlyManagementFee) : ''
  row[66][3] = fee.managementFee.minimumManagementFee != null ? String(fee.managementFee.minimumManagementFee) : ''
  row[67][3] = yn(fee.retrocession.enabled)
  row[68][3] = yn(fee.performanceFee.enabled)
  row[69][3] = fee.performanceFee.hurdleRate != null ? String(fee.performanceFee.hurdleRate) : ''
  row[70][3] = fee.performanceFee.profitSharedToXinXi != null ? String(fee.performanceFee.profitSharedToXinXi) : ''
  row[71][3] = yn(fee.others.enabled)
  row[72][3] = fmt(fee.others.details)

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
