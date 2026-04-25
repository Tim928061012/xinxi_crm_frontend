import { describe, expect, it } from 'vitest'
import { isReviewerOnlyEditInReviewRole, normalizeRole } from './roles'

describe('roles utils', () => {
  it('normalizes reviewer roles with ROLE_ prefix', () => {
    expect(normalizeRole('ROLE_OPERATION')).toBe('OPERATION')
    expect(normalizeRole('ROLE_COMPLIANCE')).toBe('COMPLIANCE')
    expect(normalizeRole('ROLE_RO')).toBe('RO')
  })

  it('marks prefixed reviewer roles as review-only editable', () => {
    expect(isReviewerOnlyEditInReviewRole('ROLE_OPERATION')).toBe(true)
    expect(isReviewerOnlyEditInReviewRole('ROLE_COMPLIANCE')).toBe(true)
    expect(isReviewerOnlyEditInReviewRole('ROLE_RO')).toBe(true)
  })
})
