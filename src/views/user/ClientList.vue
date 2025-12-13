<template>
  <div class="client-list-page">
    <!-- 有数据时显示顶部操作栏和表格 -->
    <template v-if="clientList.length > 0">
      <div class="page-header">
        <el-button type="primary" @click="handleNewClient">
          <el-icon><Plus /></el-icon>
          New Client
        </el-button>
        <div class="user-info">
          <el-icon><User /></el-icon>
          <span>{{ authStore.user?.name || 'User' }}</span>
        </div>
      </div>

      <!-- 客户表格 -->
      <div class="table-wrapper">
        <el-table
          :data="clientList"
          stripe
          class="client-table"
          style="width: 100%"
        >
          <el-table-column prop="client" label="Client" width="200" />
          <el-table-column prop="contactNature" label="Contact Nature" width="150" />
          <el-table-column prop="rm" label="RM" width="200" />
          <el-table-column label="Created Time" width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="220">
            <template #default="{ row }">
              <el-link type="primary" @click="handleView(row)" :underline="false">
                View
              </el-link>
              <el-divider direction="vertical" />
              <el-link type="primary" @click="handleEdit(row)" :underline="false">
                Edit
              </el-link>
              <el-divider direction="vertical" />
              <el-link type="primary" @click="handleDelete(row)" :underline="false">
                Delete
              </el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- 无数据时显示中间的按钮 -->
    <div v-else class="empty-state">
      <el-button type="primary" size="large" @click="handleNewClient">
        <el-icon><Plus /></el-icon>
        New Client
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userClientApi, type Client } from '@/api/user/client'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const clientList = ref<Client[]>([])

// 加载客户列表
const loadClients = async () => {
  try {
    const response = await userClientApi.getClients()
    const data = response.data || response || []
    clientList.value = data.map((item: any) => {
      const id = item.id || item.clientId
      const contactNature = item.contactNature || item.contact_nature || (item.type === 'corporate' ? 'Corporate' : 'Individual')
      
      // 根据类型生成显示名称
      let clientName = ''
      if (contactNature === 'Individual') {
        const firstName = item.firstName || item.first_name || item.general?.firstName || ''
        const lastName = item.lastName || item.last_name || item.general?.lastName || ''
        clientName = `${firstName}, ${lastName}`.trim() || item.client || item.name || ''
      } else {
        clientName = item.companyName || item.company_name || item.general?.companyName || item.client || item.name || ''
      }
      
      // RM 显示名称
      const rm = item.rm || item.relationshipManager || item.relationship_manager || item.general?.rm || ''
      
      return {
        id: id,
        clientId: item.clientId || id,
        contactNature: contactNature,
        client: clientName,
        rm: rm,
        general: item.general || {},
        contact: item.contact || {},
        portfolios: item.portfolios || [],
        createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || ''
      }
    })
  } catch (error: any) {
    console.error('Failed to load client list:', error)
    // 不显示错误消息，避免干扰用户体验
    // 如果 API 调用失败，保持空列表
    clientList.value = []
  }
}

// 新建客户
const handleNewClient = async () => {
  try {
    console.log('handleNewClient called, navigating to /user/client/new')
    // 直接使用路径跳转，更可靠
    await router.push('/user/client/new')
  } catch (error: any) {
    console.error('Navigation error:', error)
    // 如果命名路由失败，尝试路径路由
    try {
      await router.push({ path: '/user/client/new' })
    } catch (err) {
      console.error('Navigation with path also failed:', err)
      ElMessage.error('Failed to navigate to new client page')
    }
  }
}

// 查看详情
const handleView = (row: Client) => {
  router.push(`/user/client/${row.id}`)
}

// 编辑客户
const handleEdit = (row: Client) => {
  router.push(`/user/client/${row.id}/edit`)
}

// 删除客户
const handleDelete = async (row: Client) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete client "${row.client}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await userClientApi.deleteClient(row.id)
    ElMessage.success('Client deleted successfully')
    loadClients()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete client:', error)
      const errorMessage = error.message || error.response?.data?.message || 'Failed to delete client'
      ElMessage.error(errorMessage)
    }
  }
}

// 监听路由变化，当路由切换到当前页面时刷新数据
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === '/user/client' && newPath !== oldPath) {
      loadClients()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(() => {
  if (route.path === '/user/client') {
    loadClients()
  }
})

onMounted(() => {
  // 确保在组件挂载时加载数据
  loadClients()
})
</script>

<style lang="scss" scoped>
.client-list-page {
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

    :deep(.el-divider--vertical) {
      margin: 0 8px;
      height: 14px;
    }
  }

  .empty-state {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 100px);
  }
}
</style>
