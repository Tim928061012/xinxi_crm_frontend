import { describe, expect, it } from 'vitest'
import { findPendingFormsFile } from './pending-forms'

describe('findPendingFormsFile', () => {
  it('returns the File matching a staged temporary document ID', () => {
    const file = new File(['pdf'], 'signed.pdf', { type: 'application/pdf' })

    expect(findPendingFormsFile(-2, [{ tempId: -2, file }])).toBe(file)
  })

  it('returns undefined for a persisted document ID', () => {
    const file = new File(['pdf'], 'signed.pdf', { type: 'application/pdf' })

    expect(findPendingFormsFile(42, [{ tempId: -2, file }])).toBeUndefined()
  })
})
