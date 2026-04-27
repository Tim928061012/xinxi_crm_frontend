<template>
  <div class="client-list-page">
    <div class="page-toolbar-row">
      <div class="left-actions">
        <el-button type="primary" @click="handleNewClient">
          <el-icon><Plus /></el-icon>
          New Client
        </el-button>
        <el-button :disabled="!clientList.length" @click="openExportDialog">Export Client</el-button>
      </div>
      <div class="user-info">
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
        <el-option
          v-for="item in contactNatureOptionsWithCount"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
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
        <el-option v-for="rm in rmOptionsWithCount" :key="rm.value" :label="rm.label" :value="rm.value" />
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
        <el-option
          v-for="progress in progressOptionsWithCount"
          :key="progress.value"
          :label="progress.label"
          :value="progress.value"
        />
      </el-select>
      <el-select v-model="sortBy" placeholder="Sort By" style="width: 220px">
        <el-option label="Created Time (Newest)" value="created-desc" />
        <el-option label="Created Time (Oldest)" value="created-asc" />
        <el-option label="RM" value="rm" />
        <el-option label="Progress" value="progress" />
      </el-select>
      <el-button text class="reset-btn" @click="resetFilters">Reset</el-button>
    </div>

    <div v-loading.fullscreen="loading" class="table-wrapper">
      <template v-if="displayList.length">
        <el-table :data="displayList" class="client-table client-table--crm" style="width: 100%">
          <el-table-column prop="client" label="Client" min-width="220">
            <template #default="{ row }">
              <el-link
                type="primary"
                class="client-name-link"
                :underline="false"
                @click.prevent="handleView(row)"
              >
                {{ row.client }}
              </el-link>
            </template>
          </el-table-column>
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
                <span class="progress-label">
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
          <el-table-column label="Actions" width="230" fixed="right">
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
                  :class="{ 'action-link--disabled': !canEditInList(row) }"
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
                  :class="{ 'action-link--disabled': !canDeleteInList(row) }"
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
      @open-documents-forms="handleOpenDocumentsFormsFromProgress"
    />

    <el-dialog
      v-model="exportDialogVisible"
      class="client-export-dialog"
      title="Export Client"
      width="980px"
      destroy-on-close
      :close-on-click-modal="!exportLoading"
      :close-on-press-escape="!exportLoading"
      :show-close="!exportLoading"
      @closed="exportLoading = false"
    >
      <div v-loading.fullscreen="exportLoading" class="export-dialog-inner">
        <div class="toolbar-card export-dialog-toolbar">
          <el-select
            v-model="exportDialogFilters.contactNature"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="Contact Nature"
            style="width: 180px"
          >
            <el-option
              v-for="item in contactNatureOptionsWithCount"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="exportDialogFilters.rm"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="RM"
            style="width: 160px"
          >
            <el-option v-for="rm in rmOptionsWithCount" :key="rm.value" :label="rm.label" :value="rm.value" />
          </el-select>
          <el-select
            v-model="exportDialogFilters.progress"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="Progress"
            style="width: 190px"
          >
            <el-option
              v-for="progress in progressOptionsWithCount"
              :key="progress.value"
              :label="progress.label"
              :value="progress.value"
            />
          </el-select>
          <el-select v-model="exportDialogSortBy" placeholder="Sort By" style="width: 170px">
            <el-option label="Created Time (Newest)" value="created-desc" />
            <el-option label="Created Time (Oldest)" value="created-asc" />
            <el-option label="RM" value="rm" />
            <el-option label="Progress" value="progress" />
          </el-select>
          <el-button text class="reset-btn" @click="resetExportDialogFilters">Reset</el-button>
        </div>
        <div class="export-table-scroll">
          <el-table
            :data="exportDisplayList"
            :row-key="exportTableRowKey"
            size="small"
            border
            class="export-client-table"
            @row-click="onExportRowClick"
          >
            <el-table-column width="52" align="center">
              <template #header>
                <el-checkbox
                  :model-value="exportHeaderAllChecked"
                  :indeterminate="exportHeaderIndeterminate"
                  :disabled="!exportDisplayList.length"
                  @change="onExportToggleAll"
                />
              </template>
              <template #default="{ row }">
                <el-checkbox
                  :key="clientExportRowKey(row)"
                  :model-value="exportSelectedIds.has(clientExportRowKey(row))"
                  @click.stop
                  @change="(val: string | number | boolean) => toggleExportRow(clientExportRowKey(row), !!val)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="client" label="Client" min-width="140" />
            <el-table-column prop="contactNature" label="Contact Nature" min-width="130" />
            <el-table-column prop="rm" label="RM" min-width="120" />
            <el-table-column prop="progressLabel" label="Progress" min-width="170" />
            <el-table-column label="Created Time" min-width="140">
              <template #default="{ row }">{{ formatDateTime(row.createdTime) }}</template>
            </el-table-column>
          </el-table>
        </div>
        <div v-if="exportLoading || exportLastSummary" class="export-status-card">
          <template v-if="exportLoading">
            <div class="export-status-title">
              Exporting {{ exportProgress.processed }}/{{ exportProgress.total }}
              <span v-if="exportProgress.currentClient"> · {{ exportProgress.currentClient }}</span>
            </div>
            <el-progress :percentage="exportProgressPercent" :stroke-width="10" />
            <div class="export-status-meta">
              <span>Success: {{ exportProgress.succeeded }}</span>
              <span>Partial: {{ exportProgress.degraded }}</span>
              <span>Skipped: {{ exportProgress.skipped }}</span>
            </div>
          </template>
          <template v-else-if="exportLastSummary">
            <div class="export-status-title">Last export summary</div>
            <div class="export-status-meta">
              <span>Selected: {{ exportLastSummary.selected }}</span>
              <span>Exported: {{ exportLastSummary.exported }}</span>
              <span>Partial: {{ exportLastSummary.degraded }}</span>
              <span>Skipped: {{ exportLastSummary.skipped }}</span>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <div class="export-footer">
          <span>{{ exportSelectedCount }} items selected</span>
          <div class="export-buttons">
            <el-button type="primary" :disabled="!exportSelectedCount || exportLoading" @click="handleExportList">
              Export List
            </el-button>
            <el-button type="primary" :disabled="!exportSelectedCount || exportLoading" @click="handleExportSpec">
              Export Spec
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import JSZip from 'jszip'
import { useAuthStore } from '@/stores/auth'
import { userClientApi, type Client } from '@/api/user/client'
import { kycApi } from '@/api/user/kyc'
import { riskProfileApi } from '@/api/user/risk-profile'
import { feeScheduleApi } from '@/api/user/fee-schedule'
import type { ClientProgressData, ClientType } from '@/api/user/workflow'
import ClientProgressDialog from '@/components/client/ClientProgressDialog.vue'
import { formatDateTime } from '@/utils/date'
import { buildClientListCsv } from '@/utils/client-list-csv-export'
import { buildClientSpecCsv, buildMultiClientSpecCsv, fillClientSpecExportRows } from '@/utils/client-spec-csv-export'
import { clientExportRowKey } from '@/utils/client-export-row-key'
import {
  canEditDeleteInClientList,
  getProgressLabel,
  getProgressOwnerBadgeKind,
  getProgressSortWeight,
  isClientEditable,
} from '@/utils/client-progress'
import { normalizeRole } from '@/utils/roles'
import { formatPersonName } from '@/utils/name'

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
const exportLoading = ref(false)
const exportDialogFilters = reactive({
  contactNature: [] as ClientType[],
  rm: [] as string[],
  progress: [] as string[]
})
const exportDialogSortBy = ref<'created-desc' | 'created-asc' | 'rm' | 'progress'>('created-desc')
/** 与弹窗内筛选解耦；使用 id+contactNature 复合键，避免仅 id 重复导致多行联动 */
const exportSelectedIds = shallowRef(new Set<string>())
const exportTableRowKey = (row: ClientListRow) => clientExportRowKey(row)
const EXPORT_JOB_MS = 120_000
const exportProgress = reactive({
  total: 0,
  processed: 0,
  succeeded: 0,
  degraded: 0,
  skipped: 0,
  currentClient: ''
})
const exportProgressPercent = computed(() =>
  exportProgress.total ? Math.round((exportProgress.processed / exportProgress.total) * 100) : 0
)
const exportLastSummary = ref<{ selected: number; exported: number; degraded: number; skipped: number } | null>(
  null
)
const sortBy = ref<'created-desc' | 'created-asc' | 'rm' | 'progress'>('created-desc')
const filters = reactive({
  contactNature: [] as ClientType[],
  rm: [] as string[],
  progress: [] as string[]
})

const rmOptions = computed(() => Array.from(new Set(clientList.value.map(item => item.rm).filter(Boolean))).sort())
const progressOptions = computed(() => Array.from(new Set(clientList.value.map(item => item.progressLabel).filter(Boolean))))

const rowsForContactNatureFacet = computed(() =>
  clientList.value.filter(item => {
    if (filters.rm.length && !filters.rm.includes(item.rm)) return false
    if (filters.progress.length && !filters.progress.includes(item.progressLabel)) return false
    return true
  })
)
const rowsForRmFacet = computed(() =>
  clientList.value.filter(item => {
    if (filters.contactNature.length && !filters.contactNature.includes(item.contactNature)) return false
    if (filters.progress.length && !filters.progress.includes(item.progressLabel)) return false
    return true
  })
)
const rowsForProgressFacet = computed(() =>
  clientList.value.filter(item => {
    if (filters.contactNature.length && !filters.contactNature.includes(item.contactNature)) return false
    if (filters.rm.length && !filters.rm.includes(item.rm)) return false
    return true
  })
)

const contactNatureOptionsWithCount = computed(() =>
  (['Individual', 'Corporate'] as const)
    .map(value => {
      const count = rowsForContactNatureFacet.value.filter(item => item.contactNature === value).length
      return { value, count, label: `${value}（${count}）` }
    })
    .filter(item => item.count > 0 || filters.contactNature.includes(item.value))
)
const rmOptionsWithCount = computed(() =>
  rmOptions.value
    .map(value => {
      const count = rowsForRmFacet.value.filter(item => item.rm === value).length
      return { value, count, label: `${value}（${count}）` }
    })
    .filter(item => item.count > 0 || filters.rm.includes(item.value))
)
const progressOptionsWithCount = computed(() =>
  progressOptions.value
    .map(value => {
      const count = rowsForProgressFacet.value.filter(item => item.progressLabel === value).length
      return { value, count, label: `${value}（${count}）` }
    })
    .filter(item => item.count > 0 || filters.progress.includes(item.value))
)

const filterRows = (
  list: ClientListRow[],
  f: { contactNature: ClientType[]; rm: string[]; progress: string[] }
) =>
  list.filter(item => {
    if (f.contactNature.length && !f.contactNature.includes(item.contactNature)) return false
    if (f.rm.length && !f.rm.includes(item.rm)) return false
    if (f.progress.length && !f.progress.includes(item.progressLabel)) return false
    return true
  })

const sortRows = (list: ClientListRow[], sort: 'created-desc' | 'created-asc' | 'rm' | 'progress') =>
  [...list].sort((left, right) => {
    switch (sort) {
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

const displayList = computed(() => sortRows(filterRows(clientList.value, filters), sortBy.value))

const exportDisplayList = computed(() =>
  sortRows(filterRows(clientList.value, exportDialogFilters), exportDialogSortBy.value)
)

const exportSelectedCount = computed(() => exportSelectedIds.value.size)

const exportHeaderAllChecked = computed(() => {
  const rows = exportDisplayList.value
  if (!rows.length) return false
  return rows.every(r => exportSelectedIds.value.has(clientExportRowKey(r)))
})

const exportHeaderIndeterminate = computed(() => {
  const rows = exportDisplayList.value
  const n = rows.filter(r => exportSelectedIds.value.has(clientExportRowKey(r))).length
  return n > 0 && n < rows.length
})

function toggleExportRow(key: string, checked: boolean) {
  const next = new Set(exportSelectedIds.value)
  if (checked) next.add(key)
  else next.delete(key)
  exportSelectedIds.value = next
}

function onExportToggleAll(val: string | number | boolean) {
  const checked = !!val
  const rows = exportDisplayList.value
  const next = new Set(exportSelectedIds.value)
  if (checked) {
    rows.forEach(r => next.add(clientExportRowKey(r)))
  } else {
    rows.forEach(r => next.delete(clientExportRowKey(r)))
  }
  exportSelectedIds.value = next
}

function onExportRowClick(row: ClientListRow) {
  const key = clientExportRowKey(row)
  toggleExportRow(key, !exportSelectedIds.value.has(key))
}

function resetExportDialogFilters() {
  exportDialogFilters.contactNature = []
  exportDialogFilters.rm = []
  exportDialogFilters.progress = []
  exportDialogSortBy.value = 'created-desc'
}

const normalizeClient = (item: any): ClientListRow => {
  const contactNature = (item.clientType || item.contactNature || item.contact_nature || 'Individual') as ClientType

  let clientName = ''
  if (contactNature === 'Corporate') {
    clientName =
      item.chineseCompanyName ||
      item.chinese_company_name ||
      item.companyName ||
      item.company_name ||
      item.clientName ||
      item.client_name ||
      ''
  } else {
    const firstName = item.firstName || item.first_name || ''
    const lastName = item.lastName || item.last_name || ''
    clientName = formatPersonName(firstName, lastName, item.clientName || item.client_name || '')
  }

  const rmFirstName = item.rmFirstName || item.rm_first_name || ''
  const rmLastName = item.rmLastName || item.rm_last_name || ''
  const rmName =
    item.rmName ||
    item.rm_name ||
    formatPersonName(rmFirstName, rmLastName)

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

const handleNewClient = () => {
  const url = router.resolve({ path: '/standalone/user/client/new' }).href
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleView = (row: ClientListRow) => {
  const url = router.resolve({
    path: `/standalone/user/client/${row.id}`,
    query: { clientType: row.contactNature }
  }).href
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleEdit = (row: ClientListRow) => {
  const url = router.resolve({
    path: `/standalone/user/client/${row.id}/edit`,
    query: { clientType: row.contactNature }
  }).href
  window.open(url, '_blank', 'noopener,noreferrer')
}

/** 列表「Delete」：仍仅 Pending Submission；与角色无关 */
const canDeleteInList = (row: ClientListRow) =>
  canEditDeleteInClientList(row.progressStatus, row.inactive)

/** 列表「Edit」：可编辑状态（Pending Submission / Active）均可修改，Inactive 禁止 */
const canEditInList = (row: ClientListRow) => {
  return isClientEditable(row.progressStatus, row.inactive)
}

const ownerBadgeKind = (row: ClientListRow) =>
  getProgressOwnerBadgeKind(row.progressOwnerRoleLabel, row.progressStatus, row.inactive)

const onActionEdit = (row: ClientListRow) => {
  if (!canEditInList(row)) return
  handleEdit(row)
}

const onActionDelete = (row: ClientListRow) => {
  if (!canDeleteInList(row)) return
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
    await userClientApi.deleteClient(row.id, row.contactNature)
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
  exportDialogFilters.contactNature = [...filters.contactNature]
  exportDialogFilters.rm = [...filters.rm]
  exportDialogFilters.progress = [...filters.progress]
  exportDialogSortBy.value = sortBy.value
  exportSelectedIds.value = new Set()
  exportLastSummary.value = null
  exportDialogVisible.value = true
}

async function runExportJob(fn: () => void | Promise<void>) {
  exportLoading.value = true
  try {
    await Promise.race([
      Promise.resolve(fn()),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('EXPORT_TIMEOUT')), EXPORT_JOB_MS))
    ])
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'EXPORT_TIMEOUT') {
      ElMessage.error('Export timed out. Please try again with fewer rows.')
    } else {
      throw e
    }
  } finally {
    exportLoading.value = false
    exportProgress.currentClient = ''
  }
}

const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const formatExportTimestamp = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`
}

const safeExportName = (text: string, fallback: string) => {
  const s = String(text || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()
  return s || fallback
}

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const isRetryableExportError = (error: unknown) => {
  const e = error as { response?: { status?: number } }
  const status = e?.response?.status
  return !status || status === 502 || status === 503 || status === 504
}

const withExportRetry = async <T>(task: () => Promise<T>, maxAttempts = 3): Promise<T> => {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (!isRetryableExportError(error) || attempt >= maxAttempts) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 250 * attempt))
    }
  }
  throw lastError
}

const EMPTY_KYC_INFO = { kycDate: '', kycStatus: '', nextReviewDate: '' }
const EMPTY_RISK_PROFILE = {
  investmentRiskRating: undefined,
  remarks: '',
  hongKongPI: false,
  vulnerableClientAssessment: {
    age65AndAbove: false,
    physicalOrIntellectualDisabilities: false,
    notProficientInEnglish: false,
    educationPrimaryOrBelow: false,
    vulnerableClient: false,
    reviewDate: ''
  },
  investmentKnowledgeExperience: { types: [] }
}
const EMPTY_FEE_SCHEDULE = {
  managementFee: { enabled: false, yearlyManagementFee: undefined, minimumManagementFee: undefined },
  retrocession: { enabled: false },
  performanceFee: { enabled: false, hurdleRate: undefined, profitSharedToXinXi: undefined },
  others: { enabled: false, details: '' }
}

const toErrorText = (error: unknown): string => {
  const e = error as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message || e?.message || 'Unknown error'
}

const isMissingRecordError = (error: unknown): boolean => {
  const msg = toErrorText(error).toLowerCase()
  return msg.includes('not found') || msg.includes('no data') || msg.includes('不存在')
}

const handleExportList = async () => {
  if (!exportSelectedCount.value) {
    ElMessage.warning('Please select at least one client')
    return
  }
  const rows = exportDisplayList.value.filter(r => exportSelectedIds.value.has(clientExportRowKey(r)))
  await runExportJob(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 200))
    const csv = buildClientListCsv(
      rows.map(row => ({
        client: row.client,
        contactNature: row.contactNature,
        rm: row.rm,
        progressLabel: row.progressLabel,
        createdTime: row.createdTime
      })),
      { includeSpecLine: false }
    )
    downloadCsv(`client-list-${Date.now()}.csv`, csv)
    ElMessage.success('Export completed')
  })
}

const handleExportSpec = async () => {
  if (!exportSelectedCount.value) {
    ElMessage.warning('Please select at least one client')
    return
  }
  const rows = exportDisplayList.value.filter(r => exportSelectedIds.value.has(clientExportRowKey(r)))
  await runExportJob(async () => {
    exportProgress.total = rows.length
    exportProgress.processed = 0
    exportProgress.succeeded = 0
    exportProgress.degraded = 0
    exportProgress.skipped = 0
    exportProgress.currentClient = ''
    const blocks = []
    const blockMetas: Array<{ clientName: string }> = []
    const degraded: string[] = []
    const skipped: string[] = []
    for (const listRow of rows) {
      const clientName = listRow.client || `Client-${listRow.id}`
      exportProgress.currentClient = clientName
      try {
        const res = await withExportRetry(() =>
          userClientApi.getClientById(listRow.id, listRow.contactNature, { skipErrorToast: true })
        )
        const client = ((res as { data?: Client }).data ?? res) as Client
        const [kycRes, riskRes, feeRes] = await Promise.allSettled([
          withExportRetry(() => kycApi.getKycInfo(listRow.id, listRow.contactNature, { skipErrorToast: true })),
          withExportRetry(() => riskProfileApi.getRiskProfile(listRow.id, listRow.contactNature, { skipErrorToast: true })),
          withExportRetry(() => feeScheduleApi.getFeeSchedule(listRow.id, listRow.contactNature, { skipErrorToast: true }))
        ])
        const kyc = kycRes.status === 'fulfilled' ? kycRes.value : EMPTY_KYC_INFO
        const risk = riskRes.status === 'fulfilled' ? riskRes.value : EMPTY_RISK_PROFILE
        const fee = feeRes.status === 'fulfilled' ? feeRes.value : EMPTY_FEE_SCHEDULE
        const kycHardFail = kycRes.status === 'rejected' && !isMissingRecordError(kycRes.reason)
        const riskHardFail = riskRes.status === 'rejected' && !isMissingRecordError(riskRes.reason)
        const feeHardFail = feeRes.status === 'rejected' && !isMissingRecordError(feeRes.reason)
        if (kycHardFail || riskHardFail || feeHardFail) {
          degraded.push(clientName)
          exportProgress.degraded++
        }
        blocks.push(fillClientSpecExportRows(client, kyc as any, risk as any, fee as any))
        exportProgress.succeeded++
        blockMetas.push({ clientName: listRow.client || 'Client' })
      } catch (error) {
        skipped.push(`${clientName}: ${toErrorText(error)}`)
        exportProgress.skipped++
      } finally {
        exportProgress.processed++
        if (exportProgress.processed % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
    }
    if (!blocks.length) {
      ElMessage.error('Export failed: no client details could be exported')
      return
    }
    await new Promise<void>(resolve => setTimeout(resolve, 200))
    const ts = formatExportTimestamp()
    if (blocks.length <= 1) {
      const csv = buildMultiClientSpecCsv(blocks)
      downloadCsv(`client-spec-${Date.now()}.csv`, csv)
      ElMessage.success('Export completed')
      return
    }

    const zip = new JSZip()
    blocks.forEach((block, index) => {
      const csv = buildClientSpecCsv(block)
      const clientName = safeExportName(blockMetas[index]?.clientName || 'Client', 'Client')
      zip.file(`${clientName}_${ts}.csv`, csv)
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(`ClientSpec_${ts}.zip`, zipBlob)
    exportLastSummary.value = {
      selected: rows.length,
      exported: blocks.length,
      degraded: degraded.length,
      skipped: skipped.length
    }
    if (degraded.length || skipped.length) {
      ElMessage.warning(
        `Export completed with fallback. Partial fields missing: ${degraded.length}, skipped clients: ${skipped.length}.`
      )
      await ElMessageBox.alert(
        [
          `Selected: ${rows.length}`,
          `Exported: ${blocks.length}`,
          `Partial data clients: ${degraded.length}`,
          `Skipped clients: ${skipped.length}`,
          '',
          degraded.length ? `Partial: ${degraded.slice(0, 10).join(', ')}` : '',
          skipped.length ? `Skipped: ${skipped.slice(0, 5).join(' | ')}` : ''
        ]
          .filter(Boolean)
          .join('\n'),
        'Export Summary',
        { type: 'warning' }
      )
    } else {
      ElMessage.success('Export completed')
      await ElMessageBox.alert(
        [`Selected: ${rows.length}`, `Exported: ${blocks.length}`, 'All client files exported successfully.'].join('\n'),
        'Export Summary',
        { type: 'success' }
      )
    }
  })
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
  const row = selectedProgressClient.value
  const isRoSignatureReview =
    normalizeRole(authStore.user?.role) === 'RO' &&
    (row.progressStatus || '').toUpperCase() === 'SIGNATURE_UNDER_REVIEW'
  const url = router.resolve({
    path: isRoSignatureReview ? `/standalone/user/client/${row.id}` : `/standalone/user/client/${row.id}/edit`,
    query: {
      clientType: row.contactNature,
      mode: 'review',
      ...(isRoSignatureReview ? { tab: 'documents' } : {})
    }
  }).href
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleOpenDocumentsFormsFromProgress = () => {
  if (!selectedProgressClient.value) return
  const row = selectedProgressClient.value
  progressDialogVisible.value = false
  const url = router.resolve({
    path: `/standalone/user/client/${row.id}`,
    query: { clientType: row.contactNature, tab: 'documents' }
  }).href
  window.open(url, '_blank', 'noopener,noreferrer')
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
    gap: 12px;
  }

  .left-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  .reset-btn.el-button {
    background: #eef1f4 !important;
    border: 1px solid #d9dee5 !important;
    color: #4b5563 !important;
    border-radius: 6px;
    padding: 8px 14px;
  }

  .reset-btn.el-button:hover {
    background: #e5eaf0 !important;
    color: #374151 !important;
  }

  .user-info {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    background: #e8eff6;
    line-height: 1;
    font-size: 14px;
    color: #1f2a37;

    .user-role {
      display: inline-flex;
      align-items: center;
      margin-left: 2px;
      font-size: 13px;
      line-height: 1;
      font-weight: 500;
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

      &:hover .progress-label,
      &:focus-visible .progress-label {
        color: #0b63c5;
        text-decoration: none;
      }
    }
  }

  .progress-label {
    font-size: 14px;
    color: #303133;
    line-height: 1.4;
    text-decoration: none;
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

  .client-name-link {
    color: #0f172a !important;
    font-weight: 400;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .client-name-link:hover {
    color: #025189 !important;
    text-decoration: none;
  }

  .action-link--disabled {
    color: #c0c4cc !important;
    cursor: not-allowed;
    pointer-events: none;
  }

  .export-dialog-inner {
    height: 62vh;
    min-height: 520px;
    max-height: 620px;
    display: flex;
    flex-direction: column;
  }

  .export-dialog-toolbar {
    margin-bottom: 12px;
    flex-shrink: 0;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .export-table-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
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
  padding-bottom: 8px;
}

:deep(.export-client-table .el-table__header-wrapper th.el-table__cell) {
  background: #f1f3f5 !important;
  color: #606266 !important;
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

.export-status-card {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.export-status-title {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
}

.export-status-meta {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}
</style>
