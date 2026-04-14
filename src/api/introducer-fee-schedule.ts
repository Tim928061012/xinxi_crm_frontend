import request from './request'

export interface IntroducerManagementFee {
  enabled: boolean
  yearlyManagementFee?: number
  minimumManagementFee?: number
}

export interface IntroducerRetrocession {
  enabled: boolean
}

export interface IntroducerReferralFee {
  enabled: boolean
  hurdleRate?: number
  profitSharedToXinXi?: number
}

export interface IntroducerOthersFee {
  enabled: boolean
  details?: string
}

export interface IntroducerFeeSchedule {
  managementFee: IntroducerManagementFee
  retrocession: IntroducerRetrocession
  referralFee: IntroducerReferralFee
  others: IntroducerOthersFee
}

export const introducerFeeScheduleApi = {
  async getFeeSchedule(introducerId: number, contactNature: 'Individual' | 'Corporate') {
    const res = await request.get(`/introducer-fee-schedules/introducer/${introducerId}`, {
      params: { contactNature }
    })
    const raw = (res as any).data || res || {}

    const result: IntroducerFeeSchedule = {
      managementFee: {
        enabled: raw.managementFeeEnabled === true,
        yearlyManagementFee: raw.yearlyManagementFeePerc ?? undefined,
        minimumManagementFee: raw.minimumManagementFeePa ?? undefined
      },
      retrocession: {
        enabled: raw.retrocessionEnabled === true
      },
      referralFee: {
        enabled: raw.performanceFeeEnabled === true,
        hurdleRate: raw.hurdleRatePerc ?? undefined,
        profitSharedToXinXi: raw.profitSharedPerc ?? undefined
      },
      others: {
        enabled: raw.othersEnabled === true,
        details: raw.othersDetails ?? undefined
      }
    }

    ;(result as any).__id = raw.id ?? null
    ;(result as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
    ;(result as any).__hasExisting = !!raw.id

    return result
  },

  async updateFeeSchedule(introducerId: number, data: IntroducerFeeSchedule, contactNature: 'Individual' | 'Corporate') {
    const payload: Record<string, unknown> = {
      introducerId,
      introducerType: contactNature,
      managementFeeEnabled: data.managementFee.enabled,
      yearlyManagementFeePerc: data.managementFee.yearlyManagementFee ?? null,
      minimumManagementFeePa: data.managementFee.minimumManagementFee ?? null,
      performanceFeeEnabled: data.referralFee.enabled,
      hurdleRatePerc: data.referralFee.hurdleRate ?? null,
      profitSharedPerc: data.referralFee.profitSharedToXinXi ?? null,
      retrocessionEnabled: data.retrocession.enabled,
      othersEnabled: data.others.enabled,
      othersDetails: data.others.details ?? null
    }

    const hasExisting = (data as any).__hasExisting === true
    const id = (data as any).__id

    if (hasExisting && id) {
      const res = await request.put(`/introducer-fee-schedules/${id}`, payload)
      const raw = (res as any).data || res || {}
      ;(data as any).__id = raw.id ?? id
      ;(data as any).__hasExisting = true
      ;(data as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
      return res
    }
    const res = await request.post('/introducer-fee-schedules', payload)
    const raw = (res as any).data || res || {}
    ;(data as any).__id = raw.id ?? null
    ;(data as any).__hasExisting = !!raw.id
    ;(data as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
    return res
  }
}
