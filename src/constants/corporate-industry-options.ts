/**
 * Corporate 客户 Industry 选项：
 * - 保留系统原有 4 项
 * - 自《行業.docx》「Industry Name (Eng)」列补充 50 项（与文档一致）
 */
export const LEGACY_CORPORATE_INDUSTRY_OPTIONS = [
  'Finance',
  'Technology',
  'Manufacturing',
  'Retail'
] as const

export const EXTENDED_CORPORATE_INDUSTRY_OPTIONS = [
  'Virtual Assets & Web3 Services',
  'Precious Metals & Stones Dealers',
  'Gaming, Casinos & Betting',
  'Art & Antiques Dealing',
  'Money Service Operators (MSO)',
  'Arms, Defense & Military Equipment',
  'Oil, Gas & Mining (Extractive)',
  'Shipping & Marine Logistics',
  'Real Estate Development & Brokerage',
  'Trust & Company Service Providers',
  'Third-Party Payment Processors',
  'Waste Management & Scrap Metal',
  'Luxury Goods & Yacht/Supercar Retail',
  'Cross-border E-commerce & Trade Agent',
  'Non-Governmental Organizations (NGOs)',
  'Nightlife, Clubs & Cash-heavy Catering',
  'Professional Services (Legal & Accounting)',
  'Pharmaceuticals, Biotech & MedTech',
  'Commodity & Raw Material Trading',
  'Renewable Energy & CleanTech',
  'Construction & Civil Engineering',
  'Telecommunications & Infra',
  'Automotive & Parts Manufacturing',
  'Electronics & Semiconductors',
  'Online Gaming & Digital Entertainment',
  'Travel, Private Jet & Luxury Hospitality',
  'Mass Media, Advertising & PR',
  'Private Education & Study Abroad',
  'Wholesales & Consumer Goods Retail',
  'Agriculture, Forestry & Fisheries',
  'Healthcare Providers & Clinics',
  'Software Development & SI',
  'Venture Capital & Private Equity',
  'Financial Leasing & Asset Financing',
  'HR, Executive Search & Staffing',
  'Chemical & Hazardous Materials',
  'Commercial Banking',
  'Licensed Insurance & Brokerage',
  'Government Bodies & Public Authorities',
  'Listed Companies (HKEX/Main Exchanges)',
  'SEC/SFC Licensed Intermediaries',
  'Public Utilities (Water, Electricity, Gas)',
  'Universities & Higher Education',
  'Management Consulting',
  'Warehousing & General Logistics',
  'Printing, Packaging & Stationery',
  'Food & Beverage (Non-cash dominated)',
  'Office Equipment & Managed IT Services',
  'Property Management',
  'Environmental & Carbon Advisory'
] as const

/** 下拉展示顺序：原选项在前，文档 50 类在后 */
export const CORPORATE_INDUSTRY_OPTIONS: readonly string[] = [
  ...LEGACY_CORPORATE_INDUSTRY_OPTIONS,
  ...EXTENDED_CORPORATE_INDUSTRY_OPTIONS
]

/** 模糊匹配：不区分大小写；空格分词，各词均需在选项名中出现（子串） */
export function corporateIndustryOptionMatches(label: string, query: string): boolean {
  const lc = label.toLowerCase()
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (!tokens.length) return true
  return tokens.every(t => lc.includes(t))
}
