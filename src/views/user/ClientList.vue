<template>
  <div class="client-list-page">
    <div class="page-toolbar-row">
      <div class="left-actions">
        <el-button type="primary" @click="handleNewClient">
          <el-icon><Plus /></el-icon>
          New Client
        </el-button>
        <el-button @click="openExportDialog">Export Client</el-button>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.name || authStore.user?.username || authStore.user?.account || 'User' }}</span>
        <span class="user-role">{{ authStore.user?.roleDisplayName || '' }}</span>
      </div>
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
        <el-table :data="displayList" class="client-table client-table--crm" style="width: 100%">
          <el-table-column prop="client" label="Client" min-width="220" />
          <el-table-column prop="contactNature" label="Contact Nature" width="150" />
          <el-table-column prop="rm" label="RM" min-width="180" />
          <el-table-column label="Progress" min-width="260">
            <template #default="{ row }">
              <div
                class="progress-cell progress-cell--clickable"
                role="button"
                tabindex="0"
                @click.stop="openProgress(row)"
                @keydown.enter.prevent="openProgress(row)"
              >
                <span
                  class="progress-label"
                  :class="{ 'progress-label--pending-link': isPendingSubmissionStatus(row.progressStatus, row.inactive) }"
                >
                  {{ row.progressLabel }}
                </span>
                <span
                  v-if="ownerBadgeKind(row) !== 'none' && row.progressOwnerRoleLabel"
                  class="progress-owner-pill"
                  :class="`progress-owner-pill--${ownerBadgeKind(row)}`"
                >
                  {{ row.progressOwnerRoleLabel }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Created Time" width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="300" fixed="right">
            <template #default="{ row }">
              <div class="client-actions">
                <el-link type="primary" class="action-link" :underline="false" @click.prevent="handleView(row)">
                  View
                </el-link>
                <span class="action-sep" aria-hidden="true">|</span>
                <el-link
                  type="primary"
                  class="action-link"
                  :underline="false"
                  :class="{ 'action-link--disabled': !canEditDeleteInList(row) }"
                  @click.prevent="onActionEdit(row)"
                >
                  Edit
                </el-link>
                <span class="action-sep" aria-hidden="true">|</span>
                <el-link type="primary" class="action-link" :underline="false" @click.prevent="openProgress(row)">
                  Progress
                </el-link>
                <span class="action-sep" aria-hidden="true">|</span>
                <el-link
                  type="primary"
                  class="action-link"
                  :underline="false"
                  :class="{ 'action-link--disabled': !canEditDeleteInList(row) }"
                  @click.prevent="onActionDelete(row)"
                >
                  Delete
                </el-link>
              </div>
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
      :client-name="selectedProgressClient?.client || ''"
      :client-business-id="String(selectedProgressClient?.clientId || '')"
      :rm-name="selectedProgressClient?.rm || ''"
      :created-time="selectedProgressClient?.createdTime || ''"
      @updated="handleProgressUpdated"
      @review="handleProgressReview"
    />

    <el-dialog
      v-model="exportDialogVisible"
      class="client-export-dialog"
      title="Export Client"
      width="980px"
      destroy-on-close
    >
      <el-table
        :data="displayList"
        size="small"
        border
        @selection-change="handleExportSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="client" label="Client" min-width="140" />
        <el-table-column prop="contactNature" label="Contact Nature" min-width="130" />
        <el-table-column prop="rm" label="RM" min-width="120" />
        <el-table-column prop="progressLabel" label="Progress" min-width="170" />
        <el-table-column label="Created Time" min-width="140">
          <template #default="{ row }">{{ formatDateTime(row.createdTime) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="export-footer">
          <span>{{ exportSelection.length }} items selected</span>
          <div class="export-buttons">
            <el-button type="primary" @click="handleExportList">Export List</el-button>
            <el-button type="primary" @click="handleExportSpec">Export Spec</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userClientApi } from '@/api/user/client'
import type { ClientProgressData, ClientType } from '@/api/user/workflow'
import ClientProgressDialog from '@/components/client/ClientProgressDialog.vue'
import { formatDateTime } from '@/utils/date'
import {
  canEditDeleteInClientList,
  getProgressLabel,
  getProgressOwnerBadgeKind,
  getProgressSortWeight,
  isPendingSubmissionStatus
} from '@/utils/client-progress'

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
const authStore = useAuthStore()
const clientList = ref<ClientListRow[]>([])
const loading = ref(false)
const progressDialogVisible = ref(false)
const selectedProgressClient = ref<ClientListRow | null>(null)
const exportDialogVisible = ref(false)
const exportSelection = ref<ClientListRow[]>([])
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

const canEditDeleteInList = (row: ClientListRow) => canEditDeleteInClientList(row.progressStatus, row.inactive)

const ownerBadgeKind = (row: ClientListRow) =>
  getProgressOwnerBadgeKind(row.progressOwnerRoleLabel, row.progressStatus, row.inactive)

const onActionEdit = (row: ClientListRow) => {
  if (!canEditDeleteInList(row)) return
  handleEdit(row)
}

const onActionDelete = (row: ClientListRow) => {
  if (!canEditDeleteInList(row)) return
  handleDelete(row)
}

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

const openExportDialog = () => {
  exportSelection.value = []
  exportDialogVisible.value = true
}

const handleExportSelectionChange = (rows: ClientListRow[]) => {
  exportSelection.value = rows
}

const downloadText = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const handleExportList = () => {
  if (!exportSelection.value.length) {
    ElMessage.warning('Please select at least one client')
    return
  }
  const header = ['Client', 'Contact Nature', 'RM', 'Progress', 'Created Time']
  const rows = exportSelection.value.map(row => [
    row.client,
    row.contactNature,
    row.rm,
    row.progressLabel,
    formatDateTime(row.createdTime)
  ])
  const csv = [header, ...rows]
    .map(line => line.map(col => `"${String(col ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  downloadText(`client-list-${Date.now()}.csv`, csv)
}

const handleExportSpec = () => {
  if (!exportSelection.value.length) {
    ElMessage.warning('Please select at least one client')
    return
  }
  const spec = exportSelection.value
    .map((row, index) => `${index + 1}. ${row.client} (${row.contactNature}) | ${row.progressLabel} | ${formatDateTime(row.createdTime)}`)
    .join('\n')
  downloadText(`client-spec-${Date.now()}.txt`, spec)
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
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .left-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #303133;

    .user-role {
      margin-left: 4px;
      font-size: 12px;
      color: #025189;
    }
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

  /* 参照设计稿：深蓝表头、白字、行内浅色分割 */
  :deep(.client-table--crm.el-table) {
    --crm-table-header-bg: #004080;
    --crm-table-header-text: #ffffff;
    --crm-table-border: #e4e7ed;

    border-radius: var(--crm-radius-lg);

    .el-table__inner-wrapper::before {
      display: none;
    }

    .el-table__header-wrapper th.el-table__cell {
      background: var(--crm-table-header-bg) !important;
      color: var(--crm-table-header-text) !important;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .el-table__header-wrapper th.el-table__cell .cell {
      color: var(--crm-table-header-text) !important;
    }

    td.el-table__cell {
      border-color: var(--crm-table-border);
    }

    tr {
      background: #fff;
    }

    tbody tr:hover > td.el-table__cell {
      background: #f5f9fc !important;
    }
  }

  .progress-cell {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    &.progress-cell--clickable {
      cursor: pointer;
      border-radius: 6px;
      padding: 4px 2px;
      margin: -4px -2px;

      &:hover {
        background: rgba(0, 64, 128, 0.06);
      }
    }
  }

  .progress-label {
    font-size: 14px;
    color: #303133;
    line-height: 1.4;
  }

  .progress-label--pending-link {
    color: #0b63c5;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 500;
  }

  .progress-owner-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    white-space: nowrap;
  }

  .progress-owner-pill--rm {
    background: #e3f2fd;
    color: #0d47a1;
  }

  .progress-owner-pill--operation {
    background: #e8f5e9;
    color: #2e7d32;
  }

  .progress-owner-pill--compliance {
    background: #fff3e0;
    color: #e65100;
  }

  .progress-owner-pill--ro {
    background: #f3e5f5;
    color: #6a1b9a;
  }

  .client-actions {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
    font-size: 14px;
  }

  .action-sep {
    color: #c0c4cc;
    padding: 0 6px;
    user-select: none;
  }

  .action-link {
    font-weight: 500;
  }

  .action-link--disabled {
    color: #c0c4cc !important;
    cursor: not-allowed;
    pointer-events: none;
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

:deep(.client-export-dialog .el-dialog__body) {
  padding-top: 8px;
}

.export-footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.export-buttons {
  display: flex;
  gap: 8px;
}
</style>
