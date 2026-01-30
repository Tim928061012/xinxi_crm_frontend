<template>
  <div class="data-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据管理</span>
          <div>
            <el-button :icon="Download" @click="handleExport">导出数据</el-button>
            <el-button type="primary" :icon="Upload" @click="handleImport">导入数据</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入关键词" clearable />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="source" label="来源" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
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

    <!-- 数据详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="数据详情"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="ID">{{ currentRow?.id }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ currentRow?.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ currentRow?.type }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ currentRow?.source }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentRow?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">
          <div class="data-content">{{ currentRow?.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Upload } from '@element-plus/icons-vue'

const loading = ref(false)
const detailVisible = ref(false)
const currentRow = ref<any>(null)
const selectedRows = ref<any[]>([])

const searchForm = reactive({
  keyword: '',
  type: ''
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
    title: '示例数据1',
    type: '文本',
    source: '任务1',
    content: '这是示例数据的内容',
    createTime: '2024-01-15 10:30:00'
  }
])

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用接口获取数据列表
    // const response = await dataApi.getDataList({
    //   ...searchForm,
    //   page: pagination.page,
    //   size: pagination.size
    // })
    // tableData.value = response.data.list
    // pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('加载数据列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  handleSearch()
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handleView = (row: any) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleEdit = (row: any) => {
  ElMessage.info('编辑功能开发中')
  // TODO: 实现编辑功能
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      'This action cannot be undone. Are you sure you want to delete this?',
      '',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        center: true,
        customClass: 'kyc-delete-confirm-dialog',
        confirmButtonClass: 'kyc-delete-confirm-btn',
        showClose: false
      }
    )
    // TODO: 调用删除接口
    // await dataApi.deleteData(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

const handleExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要导出的数据')
    return
  }
  ElMessage.info('导出功能开发中')
  // TODO: 实现导出功能
}

const handleImport = () => {
  ElMessage.info('导入功能开发中')
  // TODO: 实现导入功能
}

const handleSizeChange = () => {
  loadData()
}

const handlePageChange = () => {
  loadData()
}
</script>

<style lang="scss" scoped>
.data-page {
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

  .data-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
  }
}
</style>
