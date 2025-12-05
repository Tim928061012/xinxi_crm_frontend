<template>
  <div class="tasks-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新建任务</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.name" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="已停止" value="stopped" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="任务名称" min-width="200" />
        <el-table-column prop="type" label="任务类型" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending' || row.status === 'stopped'"
              type="primary"
              link
              size="small"
              @click="handleStart(row)"
            >
              启动
            </el-button>
            <el-button
              v-if="row.status === 'running'"
              type="warning"
              link
              size="small"
              @click="handleStop(row)"
            >
              停止
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="请选择任务类型">
            <el-option label="数据采集" value="collect" />
            <el-option label="数据处理" value="process" />
            <el-option label="数据导出" value="export" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建任务')
const taskFormRef = ref<FormInstance>()

const searchForm = reactive({
  name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref([
  // 示例数据
  {
    id: 1,
    name: '示例任务1',
    type: '数据采集',
    status: 'running',
    progress: 65,
    createTime: '2024-01-15 10:30:00'
  }
])

const taskForm = reactive({
  id: null,
  name: '',
  type: '',
  description: ''
})

const taskRules: FormRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ]
}

onMounted(() => {
  loadTasks()
})

const loadTasks = async () => {
  loading.value = true
  try {
    // TODO: 调用接口获取任务列表
    // const response = await taskApi.getTasks({
    //   ...searchForm,
    //   page: pagination.page,
    //   size: pagination.size
    // })
    // tableData.value = response.data.list
    // pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadTasks()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  handleSearch()
}

const handleAdd = () => {
  dialogTitle.value = '新建任务'
  taskForm.id = null
  taskForm.name = ''
  taskForm.type = ''
  taskForm.description = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!taskFormRef.value) return

  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用接口保存任务
        // if (taskForm.id) {
        //   await taskApi.updateTask(taskForm)
        // } else {
        //   await taskApi.createTask(taskForm)
        // }
        ElMessage.success(taskForm.id ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadTasks()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDialogClose = () => {
  taskFormRef.value?.resetFields()
}

const handleStart = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要启动该任务吗？', '提示', {
      type: 'warning'
    })
    // TODO: 调用启动接口
    // await taskApi.startTask(row.id)
    ElMessage.success('任务已启动')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const handleStop = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要停止该任务吗？', '提示', {
      type: 'warning'
    })
    // TODO: 调用停止接口
    // await taskApi.stopTask(row.id)
    ElMessage.success('任务已停止')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const handleView = (row: any) => {
  ElMessage.info('查看任务详情功能开发中')
  // TODO: 跳转到任务详情页
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '提示', {
      type: 'warning'
    })
    // TODO: 调用删除接口
    // await taskApi.deleteTask(row.id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch {
    // 用户取消
  }
}

const handleSizeChange = () => {
  loadTasks()
}

const handlePageChange = () => {
  loadTasks()
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'success',
    completed: '',
    stopped: 'warning'
  }
  return map[status] || ''
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待开始',
    running: '进行中',
    completed: '已完成',
    stopped: '已停止'
  }
  return map[status] || status
}
</script>

<style lang="scss" scoped>
.tasks-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 16px;
  }

  .search-form {
    margin-bottom: 20px;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
