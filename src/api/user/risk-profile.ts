import request from '../request'

// 投资类型
export interface InvestmentType {
  type: string
  knowledge: boolean
  experience: boolean
}

// 投资风险评级
export type RiskRating = 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive'

// 脆弱客户评估
export interface VulnerableClientAssessment {
  age65AndAbove: boolean
  physicalOrIntellectualDisabilities: boolean
  notProficientInEnglish: boolean
  educationPrimaryOrBelow: boolean
  vulnerableClient: boolean
  reviewDate?: string
}

// 投资知识与经验
export interface InvestmentKnowledgeExperience {
  types: InvestmentType[]
}

// 投资风险档案
export interface InvestmentRiskProfile {
  investmentRiskRating?: RiskRating
  remarks?: string
  hongKongPI: boolean
  vulnerableClientAssessment: VulnerableClientAssessment
  investmentKnowledgeExperience: InvestmentKnowledgeExperience
}

// 工具函数：后端 Date(ISO/标准) <-> 前端 dd/MM/yyyy
const formatIsoToDdMmYyyy = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const d = new Date(value)
  if (isNaN(d.getTime())) return undefined
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const parseDdMmYyyyToIso = (value?: string | null): string | null => {
  if (!value) return null
  const parts = value.split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(d.getTime())) return null
  // 使用 ISO8601，匹配后端 Date 默认解析格式
  return d.toISOString()
}

export const riskProfileApi = {
  // 获取投资风险档案（使用 client-risk-profiles/assessment 接口）
  async getRiskProfile(clientId: number, clientType: 'Individual' | 'Corporate') {
    const res = await request.get(`/client-risk-profiles/assessment/${clientId}`, {
      params: { clientType }
    })
    const dto = (res as any).data || res || {}
    const profile = dto.riskProfile || {}
    const hasExisting = !!dto.riskProfile
    const experiences: any[] = dto.investmentExperiences || []

    const result: InvestmentRiskProfile = {
      investmentRiskRating: profile.riskRating,
      remarks: profile.remarks || '',
      hongKongPI: profile.isHkPi === true,
      vulnerableClientAssessment: {
        age65AndAbove: profile.vAge65Plus === true,
        physicalOrIntellectualDisabilities: profile.vDisability === true,
        // 后端字段是“语言熟练”，前端需要“英文不熟练”，取反
        notProficientInEnglish: profile.vLanguageProficient === false,
        educationPrimaryOrBelow: profile.vLowEducationInvestment === true,
        vulnerableClient: profile.isVulnerableClient === true,
        reviewDate: formatIsoToDdMmYyyy(profile.reviewDate)
      },
      // 先用默认结构填充，之后根据 experiences 覆盖
      investmentKnowledgeExperience: {
        types: [
          { type: 'Alternative Investments', knowledge: false, experience: false },
          { type: 'Bonds', knowledge: false, experience: false },
          { type: 'Bonds With Special Features', knowledge: false, experience: false },
          { type: 'Commodities', knowledge: false, experience: false },
          { type: 'Deposits (including foreign currency deposits)', knowledge: false, experience: false },
          { type: 'Equities', knowledge: false, experience: false },
          { type: 'Equity Funds / Money Market Funds', knowledge: false, experience: false },
          { type: 'Synthetic ETF / Futures-based ETF / Leveraged and Inverse Products', knowledge: false, experience: false },
          { type: 'Other Mutual Funds', knowledge: false, experience: false },
          { type: 'Derivatives', knowledge: false, experience: false },
          { type: 'Foreign Exchange (e.g. Spot)', knowledge: false, experience: false },
          { type: 'Security Tokens', knowledge: false, experience: false },
          { type: 'Margin/Leveraged Trading', knowledge: false, experience: false }
        ]
      }
    }

    // 用后端的投资经验数据覆盖默认值
    experiences.forEach((exp) => {
      const t = result.investmentKnowledgeExperience.types.find(
        (x) => x.type === exp.investmentType
      )
      if (t) {
        t.knowledge = exp.hasKnowledge === true
        t.experience = exp.hasExperience === true
      }
    })

    // 透传后端的更新时间（用于前端显示 Last saved）
    ;(result as any).__lastUpdatedAt = profile.updatedAt || profile.createdAt || null
    // 标记是否已有风评记录（用于决定用 POST 还是 PUT）
    ;(result as any).__hasExisting = hasExisting

    return result
  },

  // 更新/保存投资风险档案（调用 client-risk-profiles/assessment 接口）
  async updateRiskProfile(clientId: number, data: InvestmentRiskProfile, clientType: 'Individual' | 'Corporate') {
    const riskProfilePayload: any = {
      clientId,
      clientType,
      riskRating: data.investmentRiskRating,
      isHkPi: data.hongKongPI,
      remarks: data.remarks || '',
      vAge65Plus: data.vulnerableClientAssessment.age65AndAbove,
      vDisability: data.vulnerableClientAssessment.physicalOrIntellectualDisabilities,
      // 后端字段是“语言熟练”，前端是“英文不熟练”，取反
      vLanguageProficient: !data.vulnerableClientAssessment.notProficientInEnglish,
      vLowEducationInvestment: data.vulnerableClientAssessment.educationPrimaryOrBelow,
      isVulnerableClient: data.vulnerableClientAssessment.vulnerableClient,
      reviewDate: parseDdMmYyyyToIso(data.vulnerableClientAssessment.reviewDate) // 转为 ISO，后端才可解析
    }

    // 构造投资经验列表
    const investmentExperiences = data.investmentKnowledgeExperience.types.map((t) => ({
      clientId,
      clientType,
      investmentType: t.type,
      hasKnowledge: t.knowledge,
      hasExperience: t.experience
    }))

    const payload = {
      riskProfile: riskProfilePayload,
      investmentExperiences
    }
    const hasExisting = (data as any).__hasExisting === true

    if (hasExisting) {
      // 已存在记录，走更新接口
      return request.put(`/client-risk-profiles/assessment/${clientId}`, payload, {
        params: { clientType }
      })
    } else {
      // 不存在记录，走创建接口
      const res = await request.post('/client-risk-profiles/assessment', payload)
      ;(data as any).__hasExisting = true
      return res
    }
  }
}

