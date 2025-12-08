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

export const riskProfileApi = {
  // 获取投资风险档案
  getRiskProfile(clientId: number) {
    return request.get(`/user/clients/${clientId}/risk-profile`)
  },

  // 更新投资风险档案
  updateRiskProfile(clientId: number, data: InvestmentRiskProfile) {
    return request.put(`/user/clients/${clientId}/risk-profile`, data)
  }
}

