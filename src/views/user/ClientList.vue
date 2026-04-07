<template>
  <div class="client-list-page">
    <div class="page-toolbar-row">
      <p class="page-lead">
        Browse clients, filter by RM or progress, and open the workflow dialog for approvals.
      </p>
      <el-button type="primary" @click="handleNewClient">
        <el-icon><Plus /></el-icon>
        New Client
      </el-button>
    </div>

    <div class="toolbar-card">
      <el-select
        v-model="filters.contactNature"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        placeholder="Contact Nature"
        style="width: 200px"
      >
        <el-option label="Individual" value="Individual" />
        <el-option label="Corporate" value="Corporate" />
      </el-select>
      <el-select
        v-model="filters.rm"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        placeholder="RM"
        style="width: 220px"
      >
        <el-option v-for="rm in rmOptions" :key="rm" :label="rm" :value="rm" />
      </el-select>
      <el-select
        v-model="filters.progress"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        placeholder="Progress"
        style="width: 240px"
      >
        <el-option v-for="progress in progressOptions" :key="progress" :label="progress" :value="progress" />
      </el-select>
      <el-select v-model="sortBy" placeholder="Sort By" style="width: 220px">
        <el-option label="Created Time (Newest)" value="created-desc" />
        <el-option label="Created Time (Oldest)" value="created-asc" />
        <el-option label="RM" value="rm" />
        <el-option label="Progress" value="progress" />
      </el-select>
      <el-button text @click="resetFilters">Reset</el-button>
    </div>

    <div v-loading="loading" class="table-wrapper">
      <template v-if="displayList.length">
        <el-table :data="displayList" stripe class="client-table" style="width: 100%">
          <el-table-column prop="client" label="Client" min-width="220" />
          <el-table-column prop="contactNature" label="Contact Nature" width="150" />
          <el-table-column prop="rm" label="RM" min-width="180" />
          <el-table-column label="Progress" min-width="220">
            <template #default="{ row }">
              <div class="progress-cell">
                <el-tag :type="getProgressTagType(row.progressStatus, row.inactive)">
                  {{ row.progressLabel }}
                </el-tag>
                <span v-if="row.progressOwnerRoleLabel" class="progress-owner">{{ row.progressOwnerRoleLabel }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Created Time" width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="260" fixed="right">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click="handleView(row)">View</el-link>
              <el-divider direction="vertical" />
              <el-link
                v-if="canEditClient(row)"
                type="primary"
                :underline="false"
                @click="handleEdit(row)"
              >
                Edit
              </el-link>
              <template v-if="canEditClient(row)">
                <el-divider direction="vertical" />
              </template>
              <el-link type="primary" :underline="false" @click="openProgress(row)">Progress</el-link>
              <el-divider direction="vertical" />
              <el-link type="danger" :underline="false" @click="handleDelete(row)">Delete</el-link>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <div v-else class="empty-state">
        <el-empty :description="clientList.length ? 'No matching clients' : 'No clients yet'">
          <el-button v-if="!clientList.length" type="primary" size="large" @click="handleNewClient">
            <el-icon><Plus /></el-icon>
            New Client
          </el-button>
        </el-empty>
      </div>
    </div>

    <ClientProgressDialog
      v-model="progressDialogVisible"
      :client-id="selectedProgressClient?.id || null"
      :client-type="selectedProgressClient?.contactNature || null"
      @updated="handleProgressUpdated"
      @review="handleProgressReview"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { userClientApi } from '@/api/user/client'
import type { ClientProgressData, ClientType } from '@/api/user/workflow'
import ClientProgressDialog from '@/components/client/ClientProgressDialog.vue'
import { formatDateTime } from '@/utils/date'
import { getProgressLabel, getProgressSortWeight, getProgressTagType, isClientEditable } from '@/utils/client-progress'

interface ClientListRow {
  id: number
  clientId?: number | string
  client: string
  contactNature: ClientType
  rm: string
  createdTime: string
  progressStatus?: string
  progressLabel: string
  progressOwnerRoleLabel?: string
  inactive?: boolean
}

const route = useRoute()
const router = useRouter()
const clientList = ref<ClientListRow[]>([])
const loading = ref(false)
const progressDialogVisible = ref(false)
const selectedProgressClient = ref<ClientListRow | null>(null)
const sortBy = ref<'created-desc' | 'created-asc' | 'rm' | 'progress'>('created-desc')
const filters = reactive({
  contactNature: [] as ClientType[],
  rm: [] as string[],
  progress: [] as string[]
})

const rmOptions = computed(() => Array.from(new Set(clientList.value.map(item => item.rm).filter(Boolean))).sort())
const progressOptions = computed(() => Array.from(new Set(clientList.value.map(item => item.progressLabel).filter(Boolean))))

const displayList = computed(() => {
  const list = clientList.value.filter(item => {
    if (filters.contactNature.length && !filters.contactNature.includes(item.contactNature)) return false
    if (filters.rm.length && !filters.rm.includes(item.rm)) return false
    if (filters.progress.length && !filters.progress.includes(item.progressLabel)) return false
    return true
  })

  return [...list].sort((left, right) => {
    switch (sortBy.value) {
      case 'created-asc':
        return new Date(left.createdTime || 0).getTime() - new Date(right.createdTime || 0).getTime()
      case 'rm':
        return (left.rm || '').localeCompare(right.rm || '')
      case 'progress':
        return getProgressSortWeight(left.progressStatus, left.inactive) - getProgressSortWeight(right.progressStatus, right.inactive)
      case 'created-desc':
      default:
        return new Date(right.createdTime || 0).getTime() - new Date(left.createdTime || 0).getTime()
    }
  })
})

const normalizeClient = (item: any): ClientListRow => {
  const contactNature = (item.clientType || item.contactNature || item.contact_nature || 'Individual') as ClientType

  let clientName = item.clientName || item.client_name || ''
  if (!clientName) {
    if (contactNature === 'Corporate') {
      clientName = item.chineseCompanyName || item.chinese_company_name || item.companyName || item.company_name || ''
    } else {
      const firstName = item.firstName || item.first_name || ''
      const lastName = item.lastName || item.last_name || ''
      clientName = lastName && firstName ? `${lastName}, ${firstName}` : (lastName || firstName || '')
    }
  }

  const rmFirstName = item.rmFirstName || item.rm_first_name || ''
  const rmLastName = item.rmLastName || item.rm_last_name || ''
  const rmName =
    item.rmName ||
    item.rm_name ||
    (rmLastName && rmFirstName ? `${rmLastName}, ${rmFirstName}` : (rmLastName || rmFirstName || ''))

  const inactive = item.inactive === true || item.isInactive === true || item.is_inactive === true
  const progressStatus = item.progressStatus || item.progress_status || ''

  return {
    id: Number(item.id),
    clientId: item.clientBusinessId || item.clientId || item.client_id,
    client: clientName,
    contactNature,
    rm: rmName,
    createdTime: item.createdAt || item.created_at || item.createdTime || item.created_time || '',
    progressStatus,
    progressLabel: item.progressLabel || getProgressLabel(progressStatus, inactive),
    progressOwnerRoleLabel: item.progressOwnerRoleLabel || item.ownerRoleLabel || item.progressOwnerRole || '',
    inactive
  }
}

const loadClients = async () => {
  loading.value = true
  try {
    const response = await userClientApi.getClients()
    const data = response.data || response || []
    clientList.value = data.map(normalizeClient)
  } catch (error: any) {
    console.error('Failed to load client list:', error)
    clientList.value = []
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.contactNature = []
  filters.rm = []
  filters.progress = []
  sortBy.value = 'created-desc'
}

const handleNewClient = async () => {
  await router.push('/user/client/new')
}

const handleView = (row: ClientListRow) => {
  router.push({
    path: `/user/client/${row.id}`,
    query: { clientType: row.contactNature }
  })
}

const handleEdit = (row: ClientListRow) => {
  router.push({
    path: `/user/client/${row.id}/edit`,
    query: { clientType: row.contactNature }
  })
}

const canEditClient = (row: ClientListRow) => isClientEditable(row.progressStatus, row.inactive)

const handleDelete = async (row: ClientListRow) => {
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
    await loadClients()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || error.response?.data?.message || 'Failed to delete client')
    }
  }
}

const openProgress = (row: ClientListRow) => {
  selectedProgressClient.value = row
  progressDialogVisible.value = true
}

const handleProgressUpdated = (progress: ClientProgressData) => {
  const target = clientList.value.find(item => item.id === progress.clientId && item.contactNature === progress.clientType)
  if (!target) return
  target.progressStatus = progress.progressStatus
  target.progressLabel = progress.progressLabel || getProgressLabel(progress.progressStatus, progress.inactive)
  target.progressOwnerRoleLabel = progress.ownerRoleLabel || ''
  target.inactive = progress.inactive
}

const handleProgressReview = () => {
  if (!selectedProgressClient.value) return
  router.push({
    path: `/user/client/${selectedProgressClient.value.id}/edit`,
    query: {
      clientType: selectedProgressClient.value.contactNature,
      mode: 'review'
    }
  })
}

watch(
  () => route.path,
  newPath => {
    if (newPath === '/user/client') {
      loadClients()
    }
  }
)

onActivated(() => {
  if (route.path === '/user/client') {
    loadClients()
  }
})

onMounted(loadClients)
</script>

<style lang="scss" scoped>
.client-list-page {
  padding: 20px 28px 28px;
  background-color: var(--crm-surface-page);
  min-height: 100%;
  box-sizing: border-box;

  .page-toolbar-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .page-lead {
    margin: 0;
    max-width: 520px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--crm-text-secondary);
  }

  .toolbar-card {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    padding: 16px 18px;
    background: var(--crm-surface-card);
    border-radius: var(--crm-radius-lg);
    box-shadow: var(--crm-shadow-card);
    border: 1px solid rgba(226, 232, 240, 0.9);
    justify-content: flex-start;
  }

  .table-wrapper {
    min-height: 420px;
  }

  .client-table {
    background: var(--crm-surface-card);
    border-radius: var(--crm-radius-lg);
    overflow: hidden;
    box-shadow: var(--crm-shadow-card);
    border: 1px solid rgba(226, 232, 240, 0.9);
  }

  .progress-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .progress-owner {
    font-size: 12px;
    color: #909399;
  }

  .empty-state {
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--crm-surface-card);
    border-radius: var(--crm-radius-lg);
    box-shadow: var(--crm-shadow-card);
    border: 1px solid rgba(226, 232, 240, 0.9);
  }
}
</style>
