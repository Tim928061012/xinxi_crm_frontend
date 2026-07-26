import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
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

describe('ClientDetail staged Forms wiring', () => {
  it('resolves staged files in Documents Open, not KYC Open', () => {
    const source = readFileSync(
      new URL('../views/user/ClientDetail.vue', import.meta.url),
      'utf8'
    )
    const kycOpen = source.slice(
      source.indexOf('const handleOpenKYCDocument'),
      source.indexOf('const handleDeleteKYCDocument')
    )
    const documentOpen = source.slice(
      source.indexOf('const handleOpenDocument'),
      source.indexOf('const safeFileBaseName')
    )

    expect(kycOpen).not.toContain('findPendingFormsFile')
    expect(documentOpen).toContain('findPendingFormsFile')
  })
})
