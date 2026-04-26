<template>
  <div class="introducer-page">
    <div class="page-header">
      <el-button type="primary" @click="goNew">
        <el-icon><Plus /></el-icon>
        New Introducer
      </el-button>
      <div class="user-info">
        <el-icon><User /></el-icon>
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
        <el-table :data="introducerList" stripe class="introducer-table" style="width: 100%">
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
              <div style="display: flex; align-items: center; gap: 8px">
                <el-switch
                  v-model="row.isActive"
                  :active-value="true"
                  :inactive-value="false"
                  @change="handleStatusChange(row)"
                />
                <span :style="{ color: row.isActive ? '#67c23a' : '#909399' }">
                  {{ row.isActive ? 'enabled' : 'disabled' }}
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
                <el-link type="primary" class="action-link" :underline="false" @click="goView(row)">View</el-link>
                <span class="action-sep" aria-hidden="true">|</span>
                <el-link type="primary" class="action-link" :underline="false" @click="goEdit(row)">Edit</el-link>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <div v-else class="empty-state">
      <el-button type="primary" size="large" @click="goNew">
        <el-icon><Plus /></el-icon>
        New Introducer
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
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
const introducerList = ref<Introducer[]>([])
const loading = ref(false)

const goNew = () => router.push('/introducer/new')
const goView = (row: Introducer) => router.push(`/introducer/${row.id}`)
const goEdit = (row: Introducer) => router.push(`/introducer/${row.id}/edit`)

const loadIntroducers = async () => {
  loading.value = true
  try {
    const response = await introducerApi.getIntroducers()
    const data = response.data || response || []

    let accountMap = new Map<number, { name: string; isActive: boolean }>()
    try {
      const accountResponse = await accountApi.getAccounts()
      const accounts = accountResponse.data || accountResponse || []
      accounts.forEach((acc: Record<string, unknown>) => {
        const userId = acc.userId || acc.user_id || acc.id
        if (!userId) return
        const firstName = (acc.firstName || acc.first_name || '') as string
        const lastName = (acc.lastName || acc.last_name || '') as string
        const name = formatPersonName(firstName, lastName) || (acc.name as string) || (acc.account as string) || ''
        const isActive = acc.isActive === true || acc.isActive === 'true' || acc.active === true
        accountMap.set(Number(userId), { name, isActive })
      })
    } catch (error) {
      console.warn('Failed to load accounts for RM mapping:', error)
    }

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
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  }
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
    min-height: 420px;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
  }

  .introducer-table {
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
          font-weight: 600;
          font-size: 14px;
          padding: 10px 0;
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
            padding: 10px 0;
            border-bottom: 1px solid #ebeef5;
            box-sizing: border-box;
          }
        }
      }
    }

    :deep(.el-table__row--striped) {
      background-color: #fafafa;
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

  .empty-state {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 100px);
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
