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
  // 获取费用计划
  getFeeSchedule(clientId: number) {
    return request.get(`/user/clients/${clientId}/fee-schedule`)
  },

  // 更新费用计划
  updateFeeSchedule(clientId: number, data: FeeSchedule) {
    return request.put(`/user/clients/${clientId}/fee-schedule`, data)
  }
}

