import { describe, expect, it } from 'vitest'
import { buildClientReviewPayload } from './client-review-payload'

describe('buildClientReviewPayload', () => {
  it('includes every editable review section and explicit false knowledge values', () => {
    const clientDetail = {
      contactNature: 'Individual' as const,
      general: { firstName: 'Ada' },
      contact: { email: 'ada@example.com' },
      secondaryContact: {},
      portfolios: []
    }

    const payload = buildClientReviewPayload(
      42,
      'Individual',
      clientDetail,
      {
        kycDate: '01/07/2026',
        kycStatus: 'completed',
        nextReviewDate: '01/07/2027',
        documents: [{ id: 1, document: 'support.pdf', size: '1 MB', uploadTime: 'now' }],
        nameScreeningDocuments: []
      },
      {
        investmentRiskRating: 'Balanced',
        remarks: 'reviewed',
        hongKongPI: false,
        vulnerableClientAssessment: {
          age65AndAbove: false,
          physicalOrIntellectualDisabilities: false,
          notProficientInEnglish: true,
          educationPrimaryOrBelow: false,
          vulnerableClient: false,
          reviewDate: '02/07/2026'
        },
        investmentKnowledgeExperience: {
          types: [
            { type: 'Bonds', knowledge: false, experience: false },
            { type: 'Equities', knowledge: true, experience: false }
          ]
        }
      },
      {
        managementFee: { enabled: true, yearlyManagementFee: 1.25, minimumManagementFee: 1000 },
        retrocession: { enabled: false },
        performanceFee: { enabled: true, hurdleRate: 5, profitSharedToXinXi: 20 },
        others: { enabled: false, details: '' }
      }
    )

    expect(payload.clientDetail).toEqual(clientDetail)
    expect(payload.kycInfo).toEqual({
      kycDate: '01/07/2026',
      kycStatus: 'completed',
      nextReviewDate: '01/07/2027'
    })
    expect(payload.riskAssessment.riskProfile).toMatchObject({
      clientId: 42,
      clientType: 'Individual',
      riskRating: 'Balanced',
      isHkPi: false,
      vLanguageProficient: false
    })
    expect(payload.riskAssessment.investmentExperiences).toEqual([
      {
        clientId: 42,
        clientType: 'Individual',
        investmentType: 'Bonds',
        hasKnowledge: false,
        hasExperience: false
      },
      {
        clientId: 42,
        clientType: 'Individual',
        investmentType: 'Equities',
        hasKnowledge: true,
        hasExperience: false
      }
    ])
    expect(payload.riskAssessment.investmentExperiences[0]).toHaveProperty('hasKnowledge', false)
    expect(payload.riskAssessment.investmentExperiences[0]).toHaveProperty('hasExperience', false)
    expect(payload.feeSchedule).toEqual({
      clientId: 42,
      clientType: 'Individual',
      managementFeeEnabled: true,
      yearlyManagementFeePerc: 1.25,
      minimumManagementFeePa: 1000,
      performanceFeeEnabled: true,
      hurdleRatePerc: 5,
      profitSharedPerc: 20,
      retrocessionEnabled: false,
      othersEnabled: false,
      othersDetails: ''
    })
  })
})
