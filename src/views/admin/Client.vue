<template>
  <div class="client-page">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h1 class="page-title">All Clients</h1>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>Administrator</span>
      </div>
    </div>

    <!-- 客户表格 -->
    <div class="table-wrapper" v-if="clientList.length > 0">
      <el-table
        :data="clientList"
        stripe
        class="client-table"
        style="width: 100%"
      >
        <el-table-column prop="client" label="Client" width="200" />
        <el-table-column prop="rm" label="RM" width="200" />
        <el-table-column label="Compliance" width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-switch
                v-model="row.compliance"
                :active-value="true"
                :inactive-value="false"
                @change="handleComplianceChange(row)"
              />
              <span :style="{ color: row.compliance ? '#67c23a' : '#909399' }">
                {{ row.compliance ? 'Yes' : 'No' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Operation" width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-switch
                v-model="row.operation"
                :active-value="true"
                :inactive-value="false"
                @change="handleOperationChange(row)"
              />
              <span :style="{ color: row.operation ? '#67c23a' : '#909399' }">
                {{ row.operation ? 'Yes' : 'No' }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Created Time" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createdTime) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="100">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)" :underline="false">
              View
            </el-link>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <p>No Results Found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { adminClientApi, type AdminClient, type UpdateComplianceOperationParams } from '@/api/client'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const clientList = ref<AdminClient[]>([])

// 加载客户列表
const loadClients = async () => {
  try {
    const response = await adminClientApi.getClients()
    const data = response.data || response || []
    // 转换数据格式
    clientList.value = data.map((item: any) => {
      // 判断客户类型：根据接口返回的数据结构判断
      // 如果有 clientId 或 client_id，可能是个人客户；如果有 corporateId 或 corporate_id，可能是企业客户
      // 或者根据 type 字段判断
      let type: 'individual' | 'corporate' = 'individual' // 默认为个人客户
      if (item.type) {
        type = item.type === 'corporate' || item.type === 'Corporate' ? 'corporate' : 'individual'
      } else if (item.corporateId || item.corporate_id) {
        type = 'corporate'
      }
      
      // 获取客户ID：个人客户使用 clientId，企业客户使用 corporateId
      const id = item.id || (type === 'individual' ? (item.clientId || item.client_id) : (item.corporateId || item.corporate_id))
      
      return {
        id: id,
        clientId: item.clientId || item.client_id,
        client: item.client || item.name || item.clientName || item.client_name || '',
        rm: item.rm || item.relationshipManager || item.relationship_manager || item.rmName || item.rm_name || '',
        compliance: item.compliance === true || item.compliance === 'true' || item.compliance === 'Yes' || item.compliance === 'yes',
        operation: item.operation === true || item.operation === 'true' || item.operation === 'Yes' || item.operation === 'yes',
        createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || item.createTime || '',
        type: type
      }
    })
  } catch (error) {
    console.error('Failed to load client list:', error)
    ElMessage.error('Failed to load client list')
    clientList.value = []
  }
}

// Compliance 切换
const handleComplianceChange = async (row: AdminClient) => {
  const originalCompliance = row.compliance
  try {
    const params: UpdateComplianceOperationParams = {
      compliance: row.compliance,
      operation: row.operation
    }
    
    if (row.type === 'individual') {
      await adminClientApi.updateIndividualComplianceOperation(row.id, params)
    } else {
      await adminClientApi.updateCorporateComplianceOperation(row.id, params)
    }
    
    ElMessage.success(`Compliance ${row.compliance ? 'enabled' : 'disabled'}`)
  } catch (error: any) {
    console.error('Failed to update compliance:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to update compliance'
    ElMessage.error(errorMessage)
    // 恢复原状态
    row.compliance = originalCompliance
  }
}

// Operation 切换
const handleOperationChange = async (row: AdminClient) => {
  const originalOperation = row.operation
  try {
    const params: UpdateComplianceOperationParams = {
      compliance: row.compliance,
      operation: row.operation
    }
    
    if (row.type === 'individual') {
      await adminClientApi.updateIndividualComplianceOperation(row.id, params)
    } else {
      await adminClientApi.updateCorporateComplianceOperation(row.id, params)
    }
    
    ElMessage.success(`Operation ${row.operation ? 'enabled' : 'disabled'}`)
  } catch (error: any) {
    console.error('Failed to update operation:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to update operation'
    ElMessage.error(errorMessage)
    // 恢复原状态
    row.operation = originalOperation
  }
}

// 查看客户详情
const handleView = (row: AdminClient) => {
  // TODO: 实现查看客户详情功能
  ElMessage.info('View client details (to be implemented)')
}

// 监听路由变化，当路由切换到当前页面时刷新数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/client') {
      loadClients()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(() => {
  loadClients()
})

onMounted(() => {
  loadClients()
})
</script>

<style lang="scss" scoped>
.client-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  position: relative;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0;
    width: 100%;
    box-sizing: border-box;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #409eff;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;
      padding: 0;
      margin: 0;
    }
  }

  .table-wrapper {
    width: 100%;
    flex: 1;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
  }

  .client-table {
    background-color: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;

    :deep(.el-table) {
      width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-table__inner-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-table__header-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
      
      .el-table__header {
        width: 100% !important;
        background-color: #409eff;
        color: #fff;
        box-sizing: border-box;

        th {
          background-color: #409eff !important;
          color: #fff !important;
          border: none;
          font-weight: 500;
          padding: 12px 0;
          box-sizing: border-box;
        }
      }
    }

    :deep(.el-table__body-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
      
      .el-table__body {
        width: 100% !important;
        box-sizing: border-box;
        
        tr {
          background-color: #fff;
          width: 100% !important;
          box-sizing: border-box;
          
          &:hover {
            background-color: #f5f7fa;
          }
          
          td {
            padding: 12px 0;
            border-bottom: 1px solid #ebeef5;
            box-sizing: border-box;
          }
        }
      }
    }

    :deep(.el-table__row--striped) {
      background-color: #fafafa;
    }

    :deep(.el-link) {
      font-size: 14px;
      margin-right: 8px;
    }
  }

  .empty-state {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    color: #909399;
    font-size: 16px;
  }
}
</style>

