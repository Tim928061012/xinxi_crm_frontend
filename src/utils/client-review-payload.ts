import type { KYCData } from '@/api/user/kyc'
import type { InvestmentRiskProfile } from '@/api/user/risk-profile'
import type { FeeSchedule } from '@/api/user/fee-schedule'
import type { ClientType, WorkflowActionPayload } from '@/api/user/workflow'

const parseDdMmYyyyToIso = (value?: string | null): string | null => {
  if (!value) return null
  const parts = value.split('/')
  if (parts.length !== 3) return null
  const [day, month, year] = parts
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const buildRiskAssessmentPayload = (
  clientId: number,
  data: InvestmentRiskProfile,
  clientType: ClientType
) => {
  const v = data.vulnerableClientAssessment
  return {
    riskProfile: {
      clientId,
      clientType,
      riskRating: data.investmentRiskRating,
      isHkPi: data.hongKongPI === true,
      remarks: data.remarks ?? '',
      vAge65Plus: v ? v.age65AndAbove === true : false,
      vDisability: v ? v.physicalOrIntellectualDisabilities === true : false,
      vLanguageProficient: v ? v.notProficientInEnglish !== true : true,
      vLowEducationInvestment: v ? v.educationPrimaryOrBelow === true : false,
      isVulnerableClient: v ? v.vulnerableClient === true : false,
      reviewDate: v ? parseDdMmYyyyToIso(v.reviewDate) : null
    },
    investmentExperiences: data.investmentKnowledgeExperience.types.map((item) => ({
      clientId,
      clientType,
      investmentType: item.type,
      hasKnowledge: item.knowledge === true,
      hasExperience: item.experience === true
    }))
  }
}

export const buildFeeSchedulePayload = (
  clientId: number,
  data: FeeSchedule,
  clientType: ClientType
) => ({
  clientId,
  clientType,
  managementFeeEnabled: data.managementFee.enabled === true,
  yearlyManagementFeePerc: data.managementFee.yearlyManagementFee ?? null,
  minimumManagementFeePa: data.managementFee.minimumManagementFee ?? null,
  performanceFeeEnabled: data.performanceFee.enabled === true,
  hurdleRatePerc: data.performanceFee.hurdleRate ?? null,
  profitSharedPerc: data.performanceFee.profitSharedToXinXi ?? null,
  retrocessionEnabled: data.retrocession.enabled === true,
  othersEnabled: data.others.enabled === true,
  othersDetails: data.others.details ?? null
})

export const buildClientReviewPayload = (
  clientId: number,
  clientType: ClientType,
  clientDetail: NonNullable<WorkflowActionPayload['clientDetail']>,
  kycData: KYCData,
  riskProfile: InvestmentRiskProfile,
  feeSchedule: FeeSchedule
): Required<WorkflowActionPayload> => ({
  clientDetail,
  kycInfo: {
    kycDate: kycData.kycDate,
    kycStatus: kycData.kycStatus,
    nextReviewDate: kycData.nextReviewDate
  },
  riskAssessment: buildRiskAssessmentPayload(clientId, riskProfile, clientType),
  feeSchedule: buildFeeSchedulePayload(clientId, feeSchedule, clientType)
})
