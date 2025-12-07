import request from './request'

// Centre 数据结构（后端格式）
export interface Centre {
  name: string
  isEnabled?: boolean
}

// Booking Centre 数据结构（前端使用）
export interface BookingCentre {
  name: string
  isActive: boolean
}

// 后端返回的数据结构
export interface BankCentreResponse {
  bankId: number
  bankName: string
  centres: Centre[]
  isEnabled?: boolean
  createdAt: string
  updatedAt: string
}

// 前端使用的数据结构
export interface BankCentre {
  id: number // 映射自 bankId
  bank: string // 映射自 bankName
  bookingCentres: BookingCentre[] // 映射自 centres
  bookingCentresDisplay: string // 显示用的字符串，格式：name1, name2, ...
  status: 'enabled' | 'disabled'
  isActive?: boolean // 映射自 isEnabled
  createdTime: string // 映射自 createdAt
}

// 创建/更新请求参数（后端格式）
export interface CreateBankCentreRequest {
  bankId?: number
  bankName: string
  centres: Centre[]
  isEnabled?: boolean
}

// 前端表单参数
export interface CreateBankCentreParams {
  bank: string // 前端使用，提交时映射为 bankName
  bookingCentres: BookingCentre[] // 前端使用，提交时映射为 centres
}

export interface UpdateBankCentreParams extends CreateBankCentreParams {}

export const bankApi = {
  // 获取银行列表
  getBanks(params?: any) {
    return request.get('/bank-centres', { params })
  },

  // 获取银行详情
  getBankById(id: number) {
    return request.get(`/bank-centres/${id}`)
  },

  // 创建银行
  createBank(data: CreateBankCentreParams) {
    // 将前端参数转换为后端格式
    const requestData: CreateBankCentreRequest = {
      bankId: 0,
      bankName: data.bank,
      centres: data.bookingCentres.map(centre => ({
        name: centre.name,
        isEnabled: centre.isActive
      })),
      isEnabled: true
    }
    return request.post('/bank-centres', requestData)
  },

  // 更新银行
  updateBank(id: number, data: UpdateBankCentreParams) {
    // 将前端参数转换为后端格式
    const requestData: CreateBankCentreRequest = {
      bankId: id,
      bankName: data.bank,
      centres: data.bookingCentres.map(centre => ({
        name: centre.name,
        isEnabled: centre.isActive
      }))
    }
    return request.put(`/bank-centres/${id}`, requestData)
  },

  // 删除银行
  deleteBank(id: number) {
    return request.delete(`/bank-centres/${id}`)
  },

  // 更新银行状态
  updateBankStatus(id: number, isActive: boolean) {
    return request.put(`/bank-centres/${id}/active`, {
      id: id,
      active: isActive
    })
  }
}

