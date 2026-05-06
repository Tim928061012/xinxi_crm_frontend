/**
 * Corporate 客户 Industry 选项：仅《行業.docx》「Industry Name (Eng)」列 50 项。
 * 历史数据若仍为旧四类（Finance 等），下拉会通过 ClientDetail 将当前值 prepend 展示以便重选。
 */
export const CORPORATE_INDUSTRY_OPTIONS = [
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
] as const satisfies readonly string[]

export type CorporateIndustryOption = (typeof CORPORATE_INDUSTRY_OPTIONS)[number]

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
