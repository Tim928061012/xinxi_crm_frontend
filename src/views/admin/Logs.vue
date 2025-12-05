<template>
  <div class="logs-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="请选择操作类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="150" />
        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="createTime" label="操作时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              详情
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

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="日志详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ currentRow?.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentRow?.username }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getActionType(currentRow?.action)">
            {{ getActionText(currentRow?.action) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ currentRow?.module }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentRow?.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentRow?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ currentRow?.description }}
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="log-content">{{ formatJson(currentRow?.requestData) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="log-content">{{ formatJson(currentRow?.responseData) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const detailVisible = ref(false)
const currentRow = ref<any>(null)

const searchForm = reactive({
  username: '',
  action: '',
  dateRange: null as [string, string] | null
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
    username: 'admin',
    action: 'login',
    module: '用户认证',
    description: '用户登录系统',
    ip: '192.168.1.100',
    createTime: '2024-01-15 10:30:00',
    requestData: { username: 'admin' },
    responseData: { success: true }
  },
  {
    id: 2,
    username: 'user',
    action: 'create',
    module: '任务管理',
    description: '创建新任务',
    ip: '192.168.1.101',
    createTime: '2024-01-15 11:00:00',
    requestData: { name: '新任务' },
    responseData: { success: true, id: 1 }
  }
])

onMounted(() => {
  loadLogs()
})

const loadLogs = async () => {
  loading.value = true
  try {
    // TODO: 调用接口获取日志列表
    // const response = await adminApi.getLogs({
    //   ...searchForm,
    //   startTime: searchForm.dateRange?.[0],
    //   endTime: searchForm.dateRange?.[1],
    //   page: pagination.page,
    //   size: pagination.size
    // })
    // tableData.value = response.data.list
    // pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('加载日志列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadLogs()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.action = ''
  searchForm.dateRange = null
  handleSearch()
}

const handleView = (row: any) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleSizeChange = () => {
  loadLogs()
}

const handlePageChange = () => {
  loadLogs()
}

const getActionType = (action: string) => {
  const map: Record<string, string> = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger'
  }
  return map[action] || ''
}

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    login: '登录',
    logout: '登出',
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return map[action] || action
}

const formatJson = (data: any) => {
  if (!data) return ''
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style lang="scss" scoped>
.logs-page {
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

  .log-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
  }
}
</style>
