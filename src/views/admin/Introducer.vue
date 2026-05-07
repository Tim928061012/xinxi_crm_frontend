<template>
  <div class="introducer-page">
    <div class="page-header">
      <div class="page-header-left">
        <el-button type="primary" @click="goNew">
          <el-icon><Plus /></el-icon>
          New Introducer
        </el-button>
      </div>
      <div class="user-info">
        <span>{{ authStore.user?.username || authStore.user?.account || 'admin' }}</span>
        <span v-if="authStore.user?.roleDisplayName || authStore.user?.role" class="user-role-pill">
          {{ authStore.user?.roleDisplayName || roleDisplayName(authStore.user?.role) }}
        </span>
      </div>
    </div>

    <div v-loading.fullscreen="loading" class="table-wrapper" v-if="loading">
      <div style="min-height: 400px"></div>
    </div>

    <template v-else-if="introducerList.length > 0">
      <div class="table-wrapper">
        <el-table
          :data="introducerList"
          class="introducer-table"
          style="width: 100%"
          :row-style="crmTableRowStyle"
          :cell-style="crmTableCellStyle"
        >
          <el-table-column prop="introducer" label="Introducer" width="200" />
          <el-table-column label="Introducer Id" width="160">
            <template #default="{ row }">
              {{ formatIntroducerDisplayId(row.contactNature, row.id) }}
            </template>
          </el-table-column>
          <el-table-column prop="contactNature" label="Contact Nature" width="150" />
          <el-table-column label="RM" width="200">
            <template #default="{ row }">
              <span>{{ row.rm }}</span>
              <span v-if="row.rmDisabled" class="rm-disabled-dot" />
            </template>
          </el-table-column>
          <el-table-column label="Status" width="150">
            <template #default="{ row }">
              <div class="table-status-cell">
                <el-switch
                  v-model="row.isActive"
                  :active-value="true"
                  :inactive-value="false"
                  @change="handleStatusChange(row)"
                />
                <span :style="{ color: '#909399' }">
                  {{ row.isActive ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Created Time" width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="170" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-link type="primary" class="action-link" :underline="false" @click.prevent="goView(row)">View</el-link>
                <span class="action-sep" aria-hidden="true">|</span>
                <el-link type="primary" class="action-link" :underline="false" @click.prevent="goEdit(row)">Edit</el-link>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <div v-else class="empty-state">
      <el-empty description="No introducers yet" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { introducerApi, type Introducer } from '@/api/introducer'
import { accountApi } from '@/api/account'
import { formatDateTime } from '@/utils/date'
import { formatIntroducerDisplayId } from '@/utils/introducer-display-id'
import { isAdminRole, roleDisplayName } from '@/utils/roles'
import { formatPersonName } from '@/utils/name'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const crmTableRowStyle = () => ({ height: '41.31px' })
const crmTableCellStyle = () => ({ paddingTop: '4px', paddingBottom: '4px' })
const introducerList = ref<Introducer[]>([])
const loading = ref(false)
let introducerLoadingPromise: Promise<void> | null = null
let cachedAccountMap: Map<number, { name: string; isActive: boolean }> | null = null
let cachedAccountMapAt = 0
const ACCOUNT_CACHE_TTL_MS = 60 * 1000

const openIntroducerTab = (path: string) => {
  const url = router.resolve({ path }).href
  window.open(url, '_blank', 'noopener,noreferrer')
}

const goNew = () => openIntroducerTab('/standalone/introducer/new')
const goView = (row: Introducer) => openIntroducerTab(`/standalone/introducer/${row.id}`)
const goEdit = (row: Introducer) => openIntroducerTab(`/standalone/introducer/${row.id}/edit`)

const buildAccountMap = (accounts: Record<string, unknown>[]) => {
  const map = new Map<number, { name: string; isActive: boolean }>()
  accounts.forEach((acc: Record<string, unknown>) => {
    const userId = acc.userId || acc.user_id || acc.id
    if (!userId) return
    const firstName = (acc.firstName || acc.first_name || '') as string
    const lastName = (acc.lastName || acc.last_name || '') as string
    const name = formatPersonName(firstName, lastName, (acc.account as string) || '')
    const isActive = acc.isActive === true || acc.isActive === 'true' || acc.active === true
    map.set(Number(userId), { name, isActive })
  })
  return map
}

const getAccountMap = async () => {
  const now = Date.now()
  if (cachedAccountMap && now - cachedAccountMapAt < ACCOUNT_CACHE_TTL_MS) {
    return cachedAccountMap
  }
  try {
    const accountResponse = await accountApi.getAccounts()
    const accounts = accountResponse.data || accountResponse || []
    cachedAccountMap = buildAccountMap(accounts as Record<string, unknown>[])
    cachedAccountMapAt = now
    return cachedAccountMap
  } catch (error) {
    console.warn('Failed to load accounts for RM mapping:', error)
    return cachedAccountMap ?? new Map<number, { name: string; isActive: boolean }>()
  }
}

const loadIntroducers = async () => {
  if (introducerLoadingPromise) {
    return introducerLoadingPromise
  }
  introducerLoadingPromise = (async () => {
  loading.value = true
  try {
    const [introducerResponse, accountMap] = await Promise.all([
      introducerApi.getIntroducers(),
      getAccountMap()
    ])
    const data = introducerResponse.data || introducerResponse || []

    introducerList.value = data.map((item: Record<string, unknown>) => {
      const introducerId = item.introducerId || item.id
      const contactNature = (item.contactNature || item.contact_nature || 'Individual') as string
      const relationshipStatus = item.relationshipStatus || item.relationship_status || ''
      const rmUserId = item.rmUserId || item.rm_user_id || item.userId || item.user_id
      const createdAt = item.createdAt || item.created_at || ''
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true || item.active === 'true'

      let introducerName = ''
      if (contactNature === 'Individual') {
        const firstName = (item.firstName || item.first_name || '') as string
        const lastName = (item.lastName || item.last_name || '') as string
        introducerName = formatPersonName(firstName, lastName)
      } else {
        introducerName = (item.companyName || item.company_name || '') as string
      }

      let rmName = ''
      let rmDisabled = false
      if (rmUserId && accountMap.has(Number(rmUserId))) {
        const acc = accountMap.get(Number(rmUserId))!
        rmName = acc.name || ''
        rmDisabled = acc.isActive === false
      }

      return {
        id: introducerId as number,
        introducer: introducerName,
        contactNature: contactNature as Introducer['contactNature'],
        rm: rmName,
        rmUserId: rmUserId as number | undefined,
        rmDisabled,
        status: isActive ? 'enabled' : 'disabled',
        isActive,
        createdTime: createdAt as string,
        title: item.title || '',
        firstName: item.firstName || item.first_name || '',
        lastName: item.lastName || item.last_name || '',
        companyName: item.companyName || item.company_name || '',
        contactType: item.contactType || item.contact_type || 'Introducer',
        clientRelationshipStatus: relationshipStatus as string,
        email: item.email || '',
        mobilePhone: item.mobilePhone || item.mobile_phone || item.mobile || ''
      } as Introducer
    })
  } catch (error) {
    console.error('Failed to load introducer list:', error)
    if (!(error as { isAuthError?: boolean })?.isAuthError && (error as { response?: { status?: number } })?.response?.status !== 401) {
      ElMessage.error('Failed to load introducer list')
    }
    introducerList.value = []
  } finally {
    loading.value = false
    introducerLoadingPromise = null
  }
  })()
  return introducerLoadingPromise
}

const handleStatusChange = async (row: Introducer) => {
  const originalIsActive = row.isActive
  try {
    await introducerApi.updateIntroducerStatus(row.id, row.isActive || false)
    ElMessage.success(`Introducer ${row.isActive ? 'enabled' : 'disabled'}`)
    row.status = row.isActive ? 'enabled' : 'disabled'
  } catch (error: unknown) {
    console.error('Failed to update introducer status:', error)
    const err = error as { message?: string; response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || err.message || 'Failed to update introducer status')
    row.isActive = originalIsActive
    row.status = originalIsActive ? 'enabled' : 'disabled'
  }
}

watch(
  () => route.path,
  newPath => {
    if (newPath === '/introducer') {
      loadIntroducers()
    }
  },
  { immediate: false }
)

onActivated(() => {
  loadIntroducers()
})

onMounted(() => {
  loadIntroducers()
})
</script>

<style lang="scss" scoped>
.introducer-page {
  padding: 20px 28px 28px;
  background-color: var(--crm-surface-page);
  min-height: 100%;
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
    margin-bottom: 12px;
    padding: 0;
    width: 100%;
    box-sizing: border-box;

    .page-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .user-info {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #1f2a37;
      font-size: 14px;
      line-height: 1;
      padding: 8px 12px;
      margin: 0;
      border-radius: 10px;
      background: #e8eff6;

      .user-role-pill {
        display: inline-flex;
        align-items: center;
        margin-left: 2px;
        padding: 0;
        font-size: 13px;
        line-height: 1;
        font-weight: 500;
        color: #025189;
      }

    }
  }

  .table-wrapper {
    width: 100%;
    flex: 1;
    min-height: 420px;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
  }

  .introducer-table {
    --crm-table-header-bg: #004080;
    --crm-table-header-text: #ffffff;
    --crm-table-border: #e4e7ed;
    background-color: #fff;
    border-radius: var(--crm-radius-lg);
    overflow: hidden;
    box-shadow: var(--crm-shadow-card);
    border: 1px solid rgba(226, 232, 240, 0.9);
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

      &::before {
        display: none;
      }
    }

    :deep(.el-table__header-wrapper th.el-table__cell) {
      background: var(--crm-table-header-bg) !important;
      color: var(--crm-table-header-text) !important;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding: 8px 0 !important;
    }

    :deep(.el-table__header-wrapper th.el-table__cell .cell) {
      color: var(--crm-table-header-text) !important;
    }

    :deep(.el-table__body-wrapper td.el-table__cell) {
      border-color: var(--crm-table-border);
      padding: 4px 0 !important;
    }

    :deep(.el-table__body-wrapper td.el-table__cell .cell) {
      line-height: 24px !important;
    }

    :deep(.el-table__body-wrapper tr) {
      background: #fff;
      height: 41.31px;
    }

    :deep(.el-table__body-wrapper tbody tr:hover > td.el-table__cell) {
      background: #f5f9fc !important;
    }


    .table-actions {
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

    :deep(.el-table__body td.el-table-fixed-column--right),
    :deep(.el-table__header th.el-table-fixed-column--right) {
      padding-left: 8px !important;
      padding-right: 8px !important;
    }
  }

  .table-status-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    line-height: 24px;
    white-space: nowrap;
  }

  .empty-state {
    width: 100%;
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 8px;
    box-sizing: border-box;
  }
}

.rm-disabled-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff0000;
  margin-left: 6px;
}
</style>
