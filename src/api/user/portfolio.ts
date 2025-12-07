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
  getPortfolios(clientId: number) {
    return request.get(`/clients/${clientId}/portfolios`)
  },

  // 获取 Portfolio 详情
  getPortfolioById(clientId: number, portfolioId: number) {
    return request.get(`/clients/${clientId}/portfolios/${portfolioId}`)
  },

  // 创建 Portfolio
  createPortfolio(data: CreatePortfolioParams) {
    return request.post(`/clients/${data.clientId}/portfolios`, {
      bank: data.bank,
      bookingCentre: data.bookingCentre,
      portfolioNo: data.portfolioNo
    })
  },

  // 更新 Portfolio
  updatePortfolio(clientId: number, portfolioId: number, data: UpdatePortfolioParams) {
    return request.put(`/clients/${clientId}/portfolios/${portfolioId}`, {
      bank: data.bank,
      bookingCentre: data.bookingCentre,
      portfolioNo: data.portfolioNo
    })
  },

  // 删除 Portfolio
  deletePortfolio(clientId: number, portfolioId: number) {
    return request.delete(`/clients/${clientId}/portfolios/${portfolioId}`)
  }
}

