import request from '../request'

// 管理费
export interface ManagementFee {
  enabled: boolean
  yearlyManagementFee?: number
  minimumManagementFee?: number
}

// 回扣
export interface Retrocession {
  enabled: boolean
}

// 绩效费
export interface PerformanceFee {
  enabled: boolean
  hurdleRate?: number
  profitSharedToXinXi?: number
}

// 其他费用
export interface OthersFee {
  enabled: boolean
  details?: string
}

// 费用计划
export interface FeeSchedule {
  managementFee: ManagementFee
  retrocession: Retrocession
  performanceFee: PerformanceFee
  others: OthersFee
}

export const feeScheduleApi = {
  // 获取费用计划（使用 client-fee-schedules 接口）
  async getFeeSchedule(clientId: number, clientType: 'Individual' | 'Corporate') {
    const res = await request.get(`/client-fee-schedules/client/${clientId}`, {
      params: { clientType }
    })
    const raw = (res as any).data || res || {}

    const result: FeeSchedule = {
      managementFee: {
        enabled: raw.managementFeeEnabled === true,
        yearlyManagementFee: raw.yearlyManagementFeePerc ?? undefined,
        minimumManagementFee: raw.minimumManagementFeePa ?? undefined
      },
      retrocession: {
        enabled: raw.retrocessionEnabled === true
      },
      performanceFee: {
        enabled: raw.performanceFeeEnabled === true,
        hurdleRate: raw.hurdleRatePerc ?? undefined,
        profitSharedToXinXi: raw.profitSharedPerc ?? undefined
      },
      others: {
        enabled: raw.othersEnabled === true,
        details: raw.othersDetails ?? undefined
      }
    }

    // 透传后端的主键 ID、更新时间（用于前端保存和显示 Last saved）
    ;(result as any).__id = raw.id ?? null
    ;(result as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
    ;(result as any).__hasExisting = !!raw.id

    return result
  },

  // 创建 / 更新费用计划（调用 /api/client-fee-schedules）
  async updateFeeSchedule(clientId: number, data: FeeSchedule, clientType: 'Individual' | 'Corporate') {
    const payload: any = {
      clientId,
      clientType,
      managementFeeEnabled: data.managementFee.enabled,
      yearlyManagementFeePerc: data.managementFee.yearlyManagementFee ?? null,
      minimumManagementFeePa: data.managementFee.minimumManagementFee ?? null,
      performanceFeeEnabled: data.performanceFee.enabled,
      hurdleRatePerc: data.performanceFee.hurdleRate ?? null,
      profitSharedPerc: data.performanceFee.profitSharedToXinXi ?? null,
      retrocessionEnabled: data.retrocession.enabled,
      othersEnabled: data.others.enabled,
      othersDetails: data.others.details ?? null
    }

    const hasExisting = (data as any).__hasExisting === true
    const id = (data as any).__id

    if (hasExisting && id) {
      // 已存在记录：更新
      const res = await request.put(`/client-fee-schedules/${id}`, payload)
      const raw = (res as any).data || res || {}
      ;(data as any).__id = raw.id ?? id
      ;(data as any).__hasExisting = true
      ;(data as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
      return res
    } else {
      // 不存在记录：创建
      const res = await request.post('/client-fee-schedules', payload)
      const raw = (res as any).data || res || {}
      ;(data as any).__id = raw.id ?? null
      ;(data as any).__hasExisting = !!raw.id
      ;(data as any).__lastUpdatedAt = raw.updatedAt || raw.createdAt || null
      return res
    }
  }
}

