import request from './request'

export const dashboardApi = {
  // 获取统计数据
  getStats() {
    // TODO: 替换为实际接口
    return request.get('/dashboard/stats')
  },

  // 获取图表数据
  getChartData(params: any) {
    // TODO: 替换为实际接口
    return request.get('/dashboard/chart', { params })
  }
}
