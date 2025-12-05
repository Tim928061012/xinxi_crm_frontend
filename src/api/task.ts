import request from './request'

export interface Task {
  id: number
  name: string
  type: string
  status: string
  progress: number
  createTime: string
}

export interface TaskParams {
  name: string
  type: string
  description?: string
}

export const taskApi = {
  // 获取任务列表
  getTasks(params: any) {
    // TODO: 替换为实际接口
    return request.get('/tasks', { params })
  },

  // 创建任务
  createTask(data: TaskParams) {
    // TODO: 替换为实际接口
    return request.post('/tasks', data)
  },

  // 更新任务
  updateTask(id: number, data: TaskParams) {
    // TODO: 替换为实际接口
    return request.put(`/tasks/${id}`, data)
  },

  // 删除任务
  deleteTask(id: number) {
    // TODO: 替换为实际接口
    return request.delete(`/tasks/${id}`)
  },

  // 启动任务
  startTask(id: number) {
    // TODO: 替换为实际接口
    return request.post(`/tasks/${id}/start`)
  },

  // 停止任务
  stopTask(id: number) {
    // TODO: 替换为实际接口
    return request.post(`/tasks/${id}/stop`)
  }
}
