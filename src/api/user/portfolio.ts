import request from '../request'

export interface Portfolio {
  id?: number
  bank: string
  bookingCentre: string
  portfolioNo: string
  uploadTime?: string
}

export interface CreatePortfolioParams {
  clientId: number
  bank: string
  bookingCentre: string
  portfolioNo: string
}

export interface UpdatePortfolioParams extends CreatePortfolioParams {}

export const portfolioApi = {
  // 获取客户的 Portfolio 列表
  getPortfolios(clientId: number, clientType?: string) {
    // 后端接口：/api/client-portfolios?clientId=xxx&clientType=xxx
    const params: any = { clientId }
    if (clientType) {
      params.clientType = clientType
    }
    return request.get('/client-portfolios', { params })
  },

  // 获取 Portfolio 详情
  getPortfolioById(portfolioId: number) {
    return request.get(`/client-portfolios/${portfolioId}`)
  },

  // 创建 Portfolio
  createPortfolio(data: CreatePortfolioParams & { clientType?: string }) {
    // 后端接口：/api/client-portfolios
    // 后端期望的字段：clientId, clientType, bankName, bookingCentre, portfolioNumber
    return request.post('/client-portfolios', {
      clientId: data.clientId,
      clientType: data.clientType || 'Individual', // 默认值，实际应该从client获取
      bankName: data.bank,
      bookingCentre: data.bookingCentre,
      portfolioNumber: data.portfolioNo
    })
  },

  // 更新 Portfolio
  updatePortfolio(portfolioId: number, data: UpdatePortfolioParams) {
    // 后端接口：/api/client-portfolios/{id}
    // 后端期望的字段：bankName, bookingCentre, portfolioNumber
    return request.put(`/client-portfolios/${portfolioId}`, {
      bankName: data.bank,
      bookingCentre: data.bookingCentre,
      portfolioNumber: data.portfolioNo
    })
  },

  // 删除 Portfolio
  deletePortfolio(portfolioId: number) {
    return request.delete(`/client-portfolios/${portfolioId}`)
  }
}

