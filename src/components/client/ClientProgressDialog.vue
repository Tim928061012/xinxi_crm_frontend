<template>
  <el-dialog
    :model-value="modelValue"
    class="client-progress-dialog"
    width="980px"
    align-center
    destroy-on-close
    :show-close="false"
    @open="loadProgress"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="dialog-header-row">
        <h2 class="dialog-title">Progress</h2>
        <el-button text class="close-btn" @click="emit('update:modelValue', false)">✕</el-button>
      </div>
    </template>

    <div v-loading="loading" class="progress-dialog">
      <div class="base-info-grid">
        <div class="base-info-item"><span class="label">Client :</span><span>{{ clientName || '-' }}</span></div>
        <div class="base-info-item"><span class="label">Contact Nature :</span><span>{{ clientType || '-' }}</span></div>
        <div class="base-info-item"><span class="label">RM :</span><span>{{ rmName || '-' }}</span></div>
        <div class="base-info-item"><span class="label">Client Id :</span><span>{{ clientBusinessId || '-' }}</span></div>
        <div class="base-info-item"><span class="label">Created By :</span><span>{{ rmName || '-' }}</span></div>
        <div class="base-info-item"><span class="label">Created Time :</span><span>{{ displayCreatedTime }}</span></div>
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

      <div class="tab-row">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'flowchart' }"
          @click="activeTab = 'flowchart'"
        >
          Flowchart
        </button>
        <span class="tab-divider">|</span>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'timeline' }"
          @click="activeTab = 'timeline'"
        >
          Timeline
        </button>
      </div>

      <div v-if="activeTab === 'flowchart'" class="flowchart-panel">
        <div v-for="(step, index) in workflowSteps" :key="step.status" class="step-row">
          <div class="step-left">
            <div class="step-circle" :class="{ current: step.status === currentStatus }">{{ index + 1 }}</div>
            <div v-if="index < workflowSteps.length - 1" class="step-line" />
          </div>
          <div class="step-main">
            <div class="step-title">{{ step.label }}</div>
            <div v-if="step.status === currentStatus && latestLog" class="step-note">
              <span>{{ buildTimelineMessage(latestLog) }} at {{ toDisplayDate(latestLog.createdAt) }}</span>
              <span class="latest-flag">Latest</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="timeline-panel">
        <el-empty v-if="!sortedLogs.length" description="No progress logs yet" />
        <div v-else class="timeline-list">
          <div v-for="log in sortedLogs" :key="log.logId" class="timeline-item">
            <span class="timeline-time">{{ toDisplayDate(log.createdAt) }}</span>
            <span class="timeline-text">{{ buildTimelineMessage(log) }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientProgressData, type ClientProgressLog, type ClientType } from '@/api/user/workflow'
import { formatDateTime } from '@/utils/date'
import { WORKFLOW_STATUS_ORDER, getProgressLabel, normalizeProgressStatus } from '@/utils/client-progress'

const props = defineProps<{
  modelValue: boolean
  clientId: number | null
  clientType: ClientType | null
  clientName?: string
  clientBusinessId?: string
  rmName?: string
  createdTime?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', progress: ClientProgressData): void
  (e: 'review'): void
}>()

const loading = ref(false)
const progress = ref<ClientProgressData | null>(null)
const activeTab = ref<'flowchart' | 'timeline'>('flowchart')

const currentStatus = computed(() => normalizeProgressStatus(progress.value?.progressStatus))

const workflowSteps = computed(() =>
  WORKFLOW_STATUS_ORDER.map(status => ({
    status,
    label: getProgressLabel(status, false)
  }))
)

const sortedLogs = computed(() =>
  [...(progress.value?.logs || [])].sort((a, b) => {
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  })
)

const latestLog = computed(() => {
  if (!sortedLogs.value.length) return null
  return sortedLogs.value[sortedLogs.value.length - 1]
})

const displayCreatedTime = computed(() => toDisplayDate(props.createdTime))

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
  activeTab.value = 'flowchart'
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

const toDisplayDate = (value?: string | null) => {
  const text = formatDateTime(value || '')
  if (!text || text === '-') return '-'
  return text.replace(/^(\d{4})-(\d{2})-(\d{2}) /, '$3/$2/$1 ')
}

const buildTimelineMessage = (log: ClientProgressLog) => {
  if (log.message) return log.message
  const actionLabel = log.actionLabel || log.actionType || 'Updated'
  const actorRole = log.actorRoleLabel || log.actorRole || ''
  const actorName = log.actorName || '-'
  if (!actorRole) return `${actionLabel}: ${actorName}`
  return `${actionLabel} by ${actorRole}: ${actorName}`
}
</script>

<style scoped lang="scss">
.dialog-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.dialog-title {
  margin: 0;
  font-size: 44px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
  transform: scale(0.4);
  transform-origin: left center;
}

.progress-dialog {
  min-height: 580px;
}

.close-btn {
  color: #111827;
  font-size: 20px;
  padding: 0;
}

.base-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 18px;
  column-gap: 32px;
  margin-bottom: 28px;
}

.base-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 40px;
  transform: scale(0.4);
  transform-origin: left center;
  line-height: 1.1;
  margin-top: -22px;
  margin-bottom: -22px;
  color: #1f2937;

  .label {
    color: #9ca3af;
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.tab-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 14px;
}

.tab-btn {
  border: none;
  background: none;
  font-size: 46px;
  transform: scale(0.4);
  transform-origin: left center;
  margin: -18px 0;
  color: #4b5563;
  cursor: pointer;
  padding: 0;

  &.active {
    color: #2563eb;
  }
}

.tab-divider {
  color: #d1d5db;
  font-size: 20px;
}

.step-row {
  display: flex;
  gap: 14px;
  min-height: 82px;
}

.step-left {
  width: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  transform: scale(0.4);
  transform-origin: center;

  &.current {
    background: #2563eb;
    color: #fff;
  }
}

.step-line {
  flex: 1;
  width: 1px;
  background: #e5e7eb;
  margin-top: 6px;
}

.step-main {
  padding-top: 3px;
}

.step-title {
  font-size: 52px;
  transform: scale(0.4);
  transform-origin: left top;
  line-height: 1.05;
  margin: -6px 0 2px;
  color: #1f2937;
}

.step-note {
  margin-top: -6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 35px;
  transform: scale(0.4);
  transform-origin: left top;
}

.latest-flag {
  background: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 2px;
}

.timeline-list {
  margin-top: 6px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 210px 1fr;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 4px;
}

.timeline-time,
.timeline-text {
  font-size: 39px;
  transform: scale(0.4);
  transform-origin: left top;
  margin-bottom: -16px;
  color: #6b7280;
}
</style>

<style lang="scss">
.client-progress-dialog.el-dialog {
  border-radius: 2px;
  overflow: hidden;
}

.client-progress-dialog .el-dialog__header {
  padding: 18px 24px 0;
  border-bottom: none;
  margin-right: 0;
}

.client-progress-dialog .el-dialog__body {
  padding: 12px 24px 24px;
}
</style>
