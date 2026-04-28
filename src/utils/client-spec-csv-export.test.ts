import { describe, expect, it } from 'vitest'
import { fillClientSpecExportRows } from './client-spec-csv-export'

describe('client-spec-csv-export yes/no mapping', () => {
  const baseClient = {
    id: 1,
    contactNature: 'Individual',
    general: {
      contactType: 'Client',
      contactNature: 'Individual',
      firstName: 'Chris',
      lastName: 'Zhou',
      rm: 'RM'
    },
    contact: {},
    secondaryContact: {},
    portfolios: [],
    createdTime: '2026-01-01 00:00:00'
  } as any

  const baseKyc = {
    kycDate: '',
    nextReviewDate: '',
    kycStatus: ''
  } as any

  const baseRisk = {
    hongKongPI: false,
    vulnerableClientAssessment: {
      age65AndAbove: false,
      physicalOrIntellectualDisabilities: false,
      notProficientInEnglish: false,
      educationPrimaryOrBelow: false,
      vulnerableClient: false,
      reviewDate: ''
    },
    investmentKnowledgeExperience: {
      types: []
    }
  } as any

  const baseFee = {
    managementFee: { enabled: false },
    retrocession: { enabled: false },
    performanceFee: { enabled: false },
    others: { enabled: false, details: '' }
  } as any

  const fieldValue = (rows: Array<[string, string, string, string, string]>, field: string, col: 3 | 4) =>
    rows.find(r => r[2] === field)?.[col]

  it('uses No as default for empty boolean fields', () => {
    const rows = fillClientSpecExportRows(baseClient, baseKyc, baseRisk, baseFee)

    expect(fieldValue(rows, 'HongKong PI', 3)).toBe('No')
    expect(fieldValue(rows, 'Vulnerable Client', 3)).toBe('No')
    expect(fieldValue(rows, 'Alternative Investments', 3)).toBe('No')
    expect(fieldValue(rows, 'Alternative Investments', 4)).toBe('No')
    expect(fieldValue(rows, 'Management Fee', 3)).toBe('No')
    expect(fieldValue(rows, 'Retrocession', 3)).toBe('No')
    expect(fieldValue(rows, 'Performance Fee', 3)).toBe('No')
    expect(fieldValue(rows, 'Others', 3)).toBe('No')
  })

  it('uses Yes for true boolean fields', () => {
    const rows = fillClientSpecExportRows(
      baseClient,
      baseKyc,
      {
        ...baseRisk,
        hongKongPI: true,
        investmentKnowledgeExperience: {
          types: [{ type: 'Alternative Investments', knowledge: true, experience: true }]
        }
      },
      {
        ...baseFee,
        managementFee: { enabled: true },
        retrocession: { enabled: true },
        performanceFee: { enabled: true },
        others: { enabled: true, details: 'x' }
      }
    )

    expect(fieldValue(rows, 'HongKong PI', 3)).toBe('Yes')
    expect(fieldValue(rows, 'Alternative Investments', 3)).toBe('Yes')
    expect(fieldValue(rows, 'Alternative Investments', 4)).toBe('Yes')
    expect(fieldValue(rows, 'Management Fee', 3)).toBe('Yes')
    expect(fieldValue(rows, 'Retrocession', 3)).toBe('Yes')
    expect(fieldValue(rows, 'Performance Fee', 3)).toBe('Yes')
    expect(fieldValue(rows, 'Others', 3)).toBe('Yes')
  })
})
