import { describe, expect, it } from 'vitest'
import { CORPORATE_INDUSTRY_OPTIONS } from './corporate-industry-options'
import { EDUCATION_LEVEL_OPTIONS } from './education-level-options'

describe('client form options', () => {
  it('places Investment holding with investment and asset-finance industries', () => {
    const options = CORPORATE_INDUSTRY_OPTIONS as readonly string[]
    const index = options.indexOf('Investment holding')

    expect(options[index - 1]).toBe('Venture Capital & Private Equity')
    expect(options[index + 1]).toBe('Financial Leasing & Asset Financing')
  })

  it('places Doctorate after Master and before PhD', () => {
    const index = EDUCATION_LEVEL_OPTIONS.indexOf('Doctorate')

    expect(EDUCATION_LEVEL_OPTIONS[index - 1]).toBe('Master')
    expect(EDUCATION_LEVEL_OPTIONS[index + 1]).toBe('PhD')
  })
})
