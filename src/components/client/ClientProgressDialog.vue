<template>
  <el-dialog
    :model-value="modelValue"
    class="client-progress-dialog"
    width="820px"
    align-center
    destroy-on-close
    @open="loadProgress"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="dialog-header-block">
        <span class="dialog-title">Workflow progress</span>
        <span class="dialog-sub">RM / ARM · 审批与操作记录</span>
      </div>
    </template>
    <div v-loading="loading" class="progress-dialog">
      <div v-if="progress" class="progress-summary">
        <div class="summary-item">
          <span class="label">Current Status</span>
          <el-tag :type="progress.inactive ? 'info' : 'primary'">{{ progress.progressLabel || progress.progressStatus }}</el-tag>
        </div>
        <div class="summary-item">
          <span class="label">Current Owner</span>
          <span>{{ progress.ownerRoleLabel || '-' }}</span>
        </div>
      </div>

      <div v-if="actionButtons.length" class="action-row">
        <el-button
          v-for="action in actionButtons"
          :key="action.value"
          :type="action.type"
          :plain="action.plain"
          @click="handleAction(action.value)"
        >
          {{ action.label }}
        </el-button>
      </div>

      <el-empty v-if="!progress?.logs?.length" description="No progress logs yet" />

      <el-timeline v-else class="progress-timeline">
        <el-timeline-item
          v-for="log in progress.logs"
          :key="log.logId"
          :timestamp="formatDateTime(log.createdAt)"
          placement="top"
        >
          <div class="log-item">
            <div class="log-title">
              <span>{{ log.message || log.actionLabel || log.actionType }}</span>
              <el-tag v-if="log.latest" size="small" type="success">Latest</el-tag>
            </div>
            <div class="log-subtitle">
              <span>Status: {{ log.actionStatusLabel || log.actionStatus || '-' }}</span>
              <span v-if="log.actorRoleLabel">Role: {{ log.actorRoleLabel }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientProgressData, type ClientType } from '@/api/user/workflow'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  modelValue: boolean
  clientId: number | null
  clientType: ClientType | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', progress: ClientProgressData): void
  (e: 'review'): void
}>()

const loading = ref(false)
const progress = ref<ClientProgressData | null>(null)

const actionButtons = computed(() => {
  if (!progress.value) return []
  const actionMap: Record<string, { label: string; type?: 'primary' | 'warning' | 'success' | 'danger' | 'info'; plain?: boolean }> = {
    SUBMIT: { label: 'Submit', type: 'primary' },
    WITHDRAW: { label: 'Withdraw', type: 'warning', plain: true },
    SUBMIT_SIGNATURE: { label: 'Submit Signature', type: 'primary' },
    REVIEW: { label: 'Review', type: 'success' },
    DEACTIVATE: { label: 'Deactivate', type: 'danger', plain: true },
    ACTIVATE: { label: 'Activate', type: 'success', plain: true }
  }
  return progress.value.availableActions
    .filter(action => actionMap[action])
    .map(action => ({
      value: action,
      ...actionMap[action]
    }))
})

const loadProgress = async () => {
  if (!props.clientId || !props.clientType) return
  loading.value = true
  try {
    const response = await workflowApi.getProgress(props.clientId, props.clientType)
    progress.value = response.data || response
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load progress')
  } finally {
    loading.value = false
  }
}

const handleAction = async (action: string) => {
  if (!props.clientId || !props.clientType) return
  if (action === 'REVIEW') {
    emit('review')
    emit('update:modelValue', false)
    return
  }

  const runner = async () => {
    switch (action) {
      case 'SUBMIT':
        return workflowApi.submit(props.clientId!, props.clientType!)
      case 'WITHDRAW':
        return workflowApi.withdraw(props.clientId!, props.clientType!)
      case 'SUBMIT_SIGNATURE':
        return workflowApi.submitSignature(props.clientId!, props.clientType!)
      case 'DEACTIVATE':
        return workflowApi.deactivate(props.clientId!, props.clientType!)
      case 'ACTIVATE':
        return workflowApi.activate(props.clientId!, props.clientType!)
      default:
        return null
    }
  }

  try {
    if (action === 'DEACTIVATE' || action === 'ACTIVATE') {
      await ElMessageBox.confirm(
        `Are you sure you want to ${action === 'DEACTIVATE' ? 'deactivate' : 'activate'} this client?`,
        'Confirm',
        { type: 'warning' }
      )
    }
    const response = await runner()
    if (!response) return
    progress.value = response.data || response
    ElMessage.success('Success!')
    emit('updated', progress.value)
  } catch (error: any) {
    if (error === 'cancel') return
    ElMessage.error(error.message || 'Action failed')
  }
}
</script>

<style scoped lang="scss">
.dialog-header-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 32px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--crm-text-primary, #0f172a);
}

.dialog-sub {
  font-size: 13px;
  color: var(--crm-text-muted, #64748b);
  font-weight: 400;
}

.progress-dialog {
  min-height: 120px;
}

.progress-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: var(--crm-radius-md, 8px);

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 12px;
    color: #909399;
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.progress-timeline {
  padding-top: 4px;
}

.log-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.log-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #606266;
  font-size: 13px;
}
</style>

<style lang="scss">
.client-progress-dialog.el-dialog {
  border-radius: var(--crm-radius-lg, 12px);
  overflow: hidden;
}

.client-progress-dialog .el-dialog__header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--crm-header-border, #e2e8f0);
  margin-right: 0;
}

.client-progress-dialog .el-dialog__body {
  padding: 16px 20px 20px;
}
</style>
