<template>
  <div class="client-list-page">
    <!-- 顶部操作栏（始终显示当前账号信息） -->
    <div class="page-header">
      <el-button type="primary" @click="handleNewClient">
        <el-icon><Plus /></el-icon>
        New Client
      </el-button>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.username || authStore.user?.account || 'User' }}</span>
      </div>
    </div>

    <!-- Loading 状态 -->
    <div v-loading="loading" class="table-wrapper" v-if="loading">
      <div style="min-height: 400px;"></div>
    </div>

    <!-- 有数据时显示表格 -->
    <template v-else-if="clientList.length > 0">
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
const loading = ref(false)

// 加载客户列表
const loadClients = async () => {
  loading.value = true
  try {
    const response = await userClientApi.getClients()
    const data = response.data || response || []
    clientList.value = data.map((item: any) => {
      const id = item.id
      // 后端返回的clientType对应contactNature
      const contactNature = item.clientType || item.contactNature || item.contact_nature || 'Individual'
      
      // 根据类型生成显示名称：Individual 类型显示为 "Last Name, First Name"，不使用 Chinese Name
      let clientName = ''
      if (contactNature === 'Individual' || item.clientType === 'Individual') {
        // 个人客户：显示为 "Last Name, First Name"（不使用 Chinese Name）
        const firstName = item.firstName || item.first_name || ''
        const lastName = item.lastName || item.last_name || ''
        if (lastName && firstName) {
          clientName = `${lastName}, ${firstName}`
        } else if (lastName) {
          clientName = lastName
        } else if (firstName) {
          clientName = firstName
        }
      } else {
        // 企业客户：优先显示中文公司名，否则显示英文公司名
        if (item.chineseCompanyName && item.chineseCompanyName.trim()) {
          clientName = item.chineseCompanyName
        } else {
          clientName = item.companyName || item.company_name || ''
        }
      }
      
      // RM 显示名称（后端ClientListDTO的逻辑：lastName + ", " + firstName）
      let rm = ''
      if (item.rmLastName && item.rmFirstName) {
        rm = `${item.rmLastName}, ${item.rmFirstName}`
      } else if (item.rmLastName) {
        rm = item.rmLastName
      } else if (item.rmFirstName) {
        rm = item.rmFirstName
      }
      
      return {
        id: id,
        clientId: item.clientBusinessId || id,
        contactNature: contactNature,
        client: clientName,
        rm: rm,
        general: item.general || {},
        contact: item.contact || {},
        portfolios: item.portfolios || [],
        createdTime: item.createdAt || item.created_at || item.createdTime || ''
      }
    })
  } catch (error: any) {
    console.error('Failed to load client list:', error)
    // 不显示错误消息，避免干扰用户体验
    // 如果 API 调用失败，保持空列表
    clientList.value = []
  } finally {
    // 添加最小延迟，避免闪烁
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
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
  // 传递 clientType 作为查询参数，确保后端能正确识别客户类型
  router.push({
    path: `/user/client/${row.id}`,
    query: { clientType: row.contactNature }
  })
}

// 编辑客户
const handleEdit = (row: Client) => {
  // 传递 clientType 作为查询参数，确保后端能正确识别客户类型
  router.push({
    path: `/user/client/${row.id}/edit`,
    query: { clientType: row.contactNature }
  })
}

// 删除客户
const handleDelete = async (row: Client) => {
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

      :deep(.el-icon) {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #d9dde3;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5a6473;
      }
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
