<template>
  <div class="client-page">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">All Clients</h1>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.username || authStore.user?.account || 'admin' }}</span>
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
        <el-table-column label="RM" width="200">
          <template #default="{ row }">
            <span>{{ row.rm }}</span>
            <!-- 仅当 RM 被禁用时显示红点 -->
            <span
              v-if="row.rmDisabled"
              class="rm-disabled-dot"
            />
          </template>
        </el-table-column>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { accountApi } from '@/api/account'
import { adminClientApi, type AdminClient, type UpdateComplianceOperationParams } from '@/api/client'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const clientList = ref<AdminClient[]>([])

// RM 启用状态映射：key 为 rmUserId，value 为是否启用
const rmActiveMap = ref<Map<number, boolean>>(new Map())

// 加载 RM 账户状态（用于在列表中标记禁用 RM）
const loadRmStatus = async () => {
  try {
    const response = await accountApi.getAccounts()
    const data = response.data || response || []
    const map = new Map<number, boolean>()
    data.forEach((item: any) => {
      const userId = item.userId || item.user_id || item.id
      if (!userId) return
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true
      map.set(Number(userId), !!isActive)
    })
    rmActiveMap.value = map
  } catch (error) {
    console.warn('Failed to load RM status:', error)
    rmActiveMap.value = new Map()
  }
}

// 加载客户列表
const loadClients = async () => {
  try {
    const response = await adminClientApi.getClients()
    const data = response.data || response || []
    // 转换数据格式
    clientList.value = data.map((item: any) => {
      // 判断客户类型：根据接口返回的数据结构判断
      let type: 'individual' | 'corporate' = 'individual' // 默认为个人客户
      if (item.clientType) {
        type = item.clientType === 'Corporate' ? 'corporate' : 'individual'
      } else if (item.type) {
        type = item.type === 'corporate' || item.type === 'Corporate' ? 'corporate' : 'individual'
      } else if (item.corporateId || item.corporate_id) {
        type = 'corporate'
      }
      
      // 获取客户ID：个人客户使用 id / clientId，企业客户使用 corporateId
      const id =
        item.id ||
        (type === 'individual'
          ? (item.clientId || item.client_id)
          : (item.corporateId || item.corporate_id))

      const rmUserId = item.rmUserId || item.rm_user_id

      // Client 显示名称：优先使用服务端的 clientName；否则按普通规则拼接
      let clientName = item.clientName || item.client_name || ''
      if (!clientName) {
        const firstName = item.firstName || ''
        const lastName = item.lastName || ''
        clientName = (item.chineseName && item.chineseName.trim())
          ? item.chineseName
          : (lastName && firstName ? `${lastName}, ${firstName}` : (lastName || firstName || ''))
      }

      // RM 显示名称：与 Account 页保持一致（firstName, lastName）
      const rmFirstName = item.rmFirstName || item.rm_first_name || ''
      const rmLastName = item.rmLastName || item.rm_last_name || ''
      let rmName = ''
      if (rmFirstName || rmLastName) {
        rmName = rmFirstName && rmLastName ? `${rmFirstName}, ${rmLastName}` : (rmFirstName || rmLastName)
      } else {
        rmName = item.rmName || item.rm_name || item.rm || item.relationshipManager || item.relationship_manager || ''
      }
      
      const numericRmUserId = rmUserId ? Number(rmUserId) : undefined
      // 后端已经返回 rmActive，直接使用；没有时再退回账户表
      const rmActiveFromServer = item.rmActive

      return {
        id: id,
        clientId: item.clientBusinessId || item.clientId || item.client_id,
        client: clientName,
        rm: rmName,
        rmUserId: numericRmUserId,
        // 优先使用服务端 rmActive；当 rmActive 为 false 时，一定标红
        rmDisabled:
          rmActiveFromServer === false
            ? true
            : (rmActiveFromServer === true
                ? false
                : (numericRmUserId ? rmActiveMap.value.get(numericRmUserId) === false : false)),
        compliance: item.compliance === true || item.compliance === 'true' || item.compliance === 'Yes' || item.compliance === 'yes',
        operation: item.operation === true || item.operation === 'true' || item.operation === 'Yes' || item.operation === 'yes',
        createdTime: item.createdAt || item.created_at || item.createdTime || item.created_time || item.createTime || '',
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

// 查看客户详情（在管理员布局下跳转到客户详情页，只读查看）
const handleView = (row: AdminClient) => {
  if (!row.id) {
    ElMessage.error('Client ID is missing, cannot open detail page')
    return
  }
  // 跳转到管理员路由下的客户详情页，保持 Admin 菜单和布局
  router.push(`/client/${row.id}`)
}

// 新建客户（跳转到用户端的新建客户页面）
const handleNewClient = () => {
  router.push('/user/client/new')
}

// 监听路由变化，当路由切换到当前页面时刷新数据
watch(
  () => route.path,
  async (newPath) => {
    if (newPath === '/client') {
      await loadRmStatus()
      await loadClients()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(async () => {
  await loadRmStatus()
  await loadClients()
})

onMounted(async () => {
  await loadRmStatus()
  await loadClients()
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
      color: #025189;
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
        background-color: #025189;
        color: #fff;
        box-sizing: border-box;

        th {
          background-color: #025189 !important;
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

/* RM 禁用红点样式：放在根作用域，避免被 header/body 选择器影响 */
.rm-disabled-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff0000;
  margin-left: 6px;
}
</style>

