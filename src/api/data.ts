import request from './request'

export interface DataItem {
  id: number
  title: string
  type: string
  source: string
  content: string
  createTime: string
}

export const dataApi = {
  // 获取数据列表
  getDataList(params: any) {
    // TODO: 替换为实际接口
    return request.get('/data', { params })
  },

  // 获取数据详情
  getDataDetail(id: number) {
    // TODO: 替换为实际接口
    return request.get(`/data/${id}`)
  },

  // 更新数据
  updateData(id: number, data: any) {
    // TODO: 替换为实际接口
    return request.put(`/data/${id}`, data)
  },

  // 删除数据
  deleteData(id: number) {
    // TODO: 替换为实际接口
    return request.delete(`/data/${id}`)
  },

  // 导出数据
  exportData(ids: number[]) {
    // TODO: 替换为实际接口
    return request.post('/data/export', { ids })
  },

  // 导入数据
  importData(file: File) {
    // TODO: 替换为实际接口
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
