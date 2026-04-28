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

    <div v-loading.fullscreen="loading" class="progress-dialog">
      <p v-if="progress?.inactive" class="inactive-banner">This client is inactive.</p>

      <!-- 信息区：两列网格，标签灰、值深色，单行展示 -->
      <div class="base-info-grid">
        <div class="base-info-item">
          <span class="label">Client :</span>
          <span class="base-info-value">{{ clientName || '-' }}</span>
        </div>
        <div class="base-info-item">
          <span class="label">Contact Nature :</span>
          <span class="base-info-value">{{ clientType || '-' }}</span>
        </div>
        <div class="base-info-item">
          <span class="label">RM :</span>
          <span class="base-info-value">{{ rmName || '-' }}</span>
        </div>
        <div class="base-info-item">
          <span class="label">Client Id :</span>
          <span class="base-info-value">{{ clientBusinessId || '-' }}</span>
        </div>
        <div class="base-info-item">
          <span class="label">Created By :</span>
          <span class="base-info-value">{{ displayCreatedBy }}</span>
        </div>
        <div class="base-info-item">
          <span class="label">Created Time :</span>
          <span class="base-info-value">{{ displayCreatedTime }}</span>
        </div>
      </div>

      <!-- 全局操作：与当前步骤行内操作互斥，避免重复 -->
      <div v-if="globalActionButtons.length" class="action-row">
        <el-button
          v-for="action in globalActionButtons"
          :key="action.value"
          :type="action.type"
          :plain="action.plain"
          @click="handleAction(action.value)"
        >
          {{ action.label }}
        </el-button>
      </div>

      <div class="tab-row" role="tablist" aria-label="Progress views">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ active: activeTab === 'flowchart' }"
          :aria-selected="activeTab === 'flowchart'"
          @click="activeTab = 'flowchart'"
        >
          Flowchart
        </button>
        <span class="tab-divider" aria-hidden="true">|</span>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ active: activeTab === 'timeline' }"
          :aria-selected="activeTab === 'timeline'"
          @click="activeTab = 'timeline'"
        >
          Timeline
        </button>
      </div>

      <!-- Flowchart / Timeline 同格叠放：隐藏项 visibility:hidden 仍占位，行高=max(二者)，切换 Tab 时弹窗不会突然变矮 -->
      <div class="progress-tab-panels" role="presentation">
        <!-- Flowchart：纵向步骤（已完成=勾选+蓝连线；当前=蓝底序号；待办=灰圈） -->
        <div
          class="flowchart-panel"
          :class="{ 'tab-panel--inactive': activeTab !== 'flowchart' }"
          :aria-hidden="activeTab !== 'flowchart'"
        >
        <div v-for="(step, index) in workflowSteps" :key="step.status" class="step-row">
          <div class="step-track">
            <div
              class="step-circle"
              :class="{
                'step-circle--done': isStepCompleted(index),
                'step-circle--current': isCurrentStep(index),
                'step-circle--pending': isStepPending(index),
                'step-circle--inactive-failed': isInactiveFailedStep(index)
              }"
            >
              <el-icon v-if="isStepCompleted(index)" class="step-check-icon"><Check /></el-icon>
              <el-icon v-else-if="isInactiveFailedStep(index)" class="step-check-icon"><Close /></el-icon>
              <span v-else class="step-num">{{ index + 1 }}</span>
            </div>
            <div
              v-if="index < workflowSteps.length - 1"
              class="step-connector"
              :class="{ 'step-connector--done': isConnectorDone(index) }"
            />
          </div>
          <div class="step-body">
            <div class="step-title-row">
              <div
                class="step-title"
                :class="{
                  'step-title--muted': isStepPending(index),
                  'step-title--emphasis': isStepCompleted(index) || isCurrentStep(index)
                }"
              >
                {{ stepDisplayLabel(step, index) }}
              </div>
              <div v-if="stepRowInlineActions(index).length" class="step-inline-actions">
                <el-button
                  v-for="action in stepRowInlineActions(index)"
                  :key="`${index}-${action.value}`"
                  text
                  :type="inlineActionButtonType(action.value)"
                  class="step-inline-action"
                  @click="handleAction(action.value)"
                >
                  {{ action.label }}
                </el-button>
              </div>
            </div>

            <div v-if="detailEntriesForStep(step.status, index).length" class="step-details">
              <div
                v-for="(entry, li) in detailEntriesForStep(step.status, index)"
                :key="`${step.status}-${entry.logId}-${li}`"
                class="step-detail-inline"
              >
                <span class="step-detail-line">{{ entry.text }}</span>
                <span
                  v-if="isLatestLogRow(entry.logId)"
                  class="latest-pill"
                >Latest</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Timeline：时间 | 描述，左对齐、易扫读 -->
        <div
          class="timeline-panel"
          :class="{ 'tab-panel--inactive': activeTab !== 'timeline' }"
          :aria-hidden="activeTab !== 'timeline'"
        >
          <el-empty v-if="!sortedLogs.length" description="No progress logs yet" />
          <div v-else class="timeline-list">
            <div v-for="log in sortedLogs" :key="log.logId" class="timeline-item">
              <span class="timeline-time">{{ toDisplayDate(log.createdAt) }}</span>
              <span class="timeline-text">{{ formatLogLine(log) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
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
  /** 跳转客户页 Documents → Forms，用于待签署前上传签字件 */
  (e: 'open-documents-forms'): void
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

const currentStepIndex = computed(() => {
  const s = currentStatus.value
  const idx = WORKFLOW_STATUS_ORDER.indexOf(s as (typeof WORKFLOW_STATUS_ORDER)[number])
  return idx === -1 ? 0 : idx
})

const isActiveCompleted = computed(
  () => currentStatus.value === 'ACTIVE' && progress.value?.inactive !== true
)

function isInactiveFailedStep(index: number) {
  return currentStatus.value === 'ACTIVE' && progress.value?.inactive === true && index === currentStepIndex.value
}

function stepDisplayLabel(step: { status: string; label: string }, index: number) {
  if (isInactiveFailedStep(index)) return 'Inactive'
  return step.label
}

const sortedLogs = computed(() =>
  [...(progress.value?.logs || [])].sort((a, b) => {
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  })
)

/**
 * 用于 Latest 徽标：优先后端标记 latest 的日志，否则取时间最新一条（Submit/Withdraw 等会刷新列表，徽标随最新记录移动）
 */
const latestLogForBadge = computed((): ClientProgressLog | null => {
  const logs = sortedLogs.value
  if (!logs.length) return null
  const marked = logs.find(l => l.latest)
  if (marked) return marked
  return logs[logs.length - 1]
})

function isLatestLogRow(logId: number) {
  const latest = latestLogForBadge.value
  return !!latest && latest.logId === logId
}

const displayCreatedTime = computed(() => toDisplayDate(props.createdTime))

const displayCreatedBy = computed(() => {
  const logs = sortedLogs.value
  // 优先使用 CREATED 日志中的操作者，避免信息区与日志区来源不一致
  const createdLog = logs.find(log => (log.actionType || '').toUpperCase() === 'CREATED')
  if (createdLog?.actorName?.trim()) return createdLog.actorName.trim()
  // 历史脏数据/缺日志场景下回退到最早一条日志的 actorName
  const firstLog = logs[0]
  if (firstLog?.actorName?.trim()) return firstLog.actorName.trim()
  // 最后兜底：沿用原字段（兼容尚未补齐历史日志的数据）
  if (props.rmName?.trim()) return props.rmName.trim()
  return '-'
})

const actionButtons = computed(() => {
  if (!progress.value) return []
  const actionMap: Record<string, { label: string; type?: 'primary' | 'warning' | 'success' | 'danger' | 'info'; plain?: boolean }> = {
    SUBMIT: { label: 'Submit', type: 'primary' },
    WITHDRAW: { label: 'Withdraw', type: 'danger', plain: true },
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

/**
 * 当前步骤行内展示的主操作（与设计稿一致：操作贴在对应阶段标题行右侧）
 * 仅当「当前阶段 index === 当前进度」且后端下发该 action 时显示。
 */
function stepRowInlineActions(index: number): { label: string; value: string }[] {
  if (index !== currentStepIndex.value || !progress.value) return []
  const step = workflowSteps.value[index]
  if (!step) return []
  const st = normalizeProgressStatus(step.status)
  const actions = progress.value.availableActions || []
  const result: { label: string; value: string }[] = []

  if (st === 'PENDING_SUBMISSION' && actions.includes('SUBMIT')) {
    result.push({ label: 'Submit', value: 'SUBMIT' })
  }
  if (st === 'OPERATIONAL_REVIEW' && actions.includes('REVIEW')) {
    result.push({ label: 'Review', value: 'REVIEW' })
  }
  if (st === 'COMPLIANCE_REVIEW') {
    if (actions.includes('REVIEW')) {
      result.push({ label: 'Review', value: 'REVIEW' })
    }
    if (actions.includes('WITHDRAW')) {
      result.push({ label: 'Withdraw', value: 'WITHDRAW' })
    }
  }
  if (st === 'PENDING_SIGNATURE' && actions.includes('SUBMIT_SIGNATURE')) {
    result.push({ label: '+ Signature', value: 'SUBMIT_SIGNATURE' })
  }
  if (st === 'PENDING_SIGNATURE' && actions.includes('WITHDRAW')) {
    result.push({ label: 'Withdraw', value: 'WITHDRAW' })
  }
  if (st === 'SIGNATURE_UNDER_REVIEW' && actions.includes('REVIEW')) {
    result.push({ label: 'Review', value: 'REVIEW' })
  }
  if (st === 'ACTIVE' && actions.includes('DEACTIVATE')) {
    result.push({ label: 'Deactivate', value: 'DEACTIVATE' })
  }
  if (progress.value.inactive && actions.includes('ACTIVATE')) {
    if (st === 'ACTIVE' || index === WORKFLOW_STATUS_ORDER.length - 1) {
      result.push({ label: 'Activate', value: 'ACTIVATE' })
    }
  }
  // Withdraw 统一固定在当前步骤行右侧，不走顶部全局区
  if (actions.includes('WITHDRAW') && !result.some(item => item.value === 'WITHDRAW')) {
    result.push({ label: 'Withdraw', value: 'WITHDRAW' })
  }
  return result
}

function inlineActionButtonType(
  value: string
): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  switch (value) {
    case 'DEACTIVATE':
      return 'danger'
    case 'WITHDRAW':
      return 'warning'
    case 'REVIEW':
    case 'SUBMIT':
    case 'SUBMIT_SIGNATURE':
    case 'ACTIVATE':
      return 'primary'
    default:
      return 'primary'
  }
}

/** 与行内操作去重后的顶部按钮组 */
const globalActionButtons = computed(() => {
  const inlineValues = new Set(stepRowInlineActions(currentStepIndex.value).map(a => a.value))
  let list =
    inlineValues.size === 0 ? actionButtons.value : actionButtons.value.filter(b => !inlineValues.has(b.value))
  // Pending Signature 仅保留 + Signature / Withdraw，不展示 Review（审批在 Documents 侧完成）
  if (currentStatus.value === 'PENDING_SIGNATURE') {
    list = list.filter(b => b.value !== 'REVIEW')
  }
  return list
})

function isStepCompleted(index: number) {
  return index < currentStepIndex.value || (isActiveCompleted.value && index === currentStepIndex.value)
}

function isCurrentStep(index: number) {
  return index === currentStepIndex.value
}

function isStepPending(index: number) {
  return index > currentStepIndex.value
}

function isConnectorDone(index: number) {
  return index < currentStepIndex.value
}

const buildTimelineMessage = (log: ClientProgressLog) => {
  if (log.message) return log.message
  const actionLabel = log.actionLabel || log.actionType || 'Updated'
  const actorRole = log.actorRoleLabel || log.actorRole || ''
  const actorName = log.actorName || '-'
  if (!actorRole) return `${actionLabel}: ${actorName}`
  return `${actionLabel} by ${actorRole}: ${actorName}`
}

function formatLogLine(log: ClientProgressLog) {
  const msg = log.message?.trim()
  if (msg) {
    if (/\s+at\s+\d/.test(msg) || (msg.includes(' at ') && /\d{2}\/\d{2}\/\d{4}/.test(msg))) return msg
    return `${msg} at ${toDisplayDate(log.createdAt)}`
  }
  return `${buildTimelineMessage(log)} at ${toDisplayDate(log.createdAt)}`
}

/** 每行绑定 logId，便于 Latest 与「当前最新一条日志」对应 */
function detailEntriesForStep(
  stepStatus: string,
  stepIndex: number
): { logId: number; text: string }[] {
  const st = normalizeProgressStatus(stepStatus)
  const matched = sortedLogs.value.filter(
    l => {
      // Flowchart 日志归属到「操作发生前」的阶段：优先 fromStatus
      const before = l.fromStatus ? normalizeProgressStatus(l.fromStatus) : ''
      if (before) return before === st
      // 历史脏数据/旧日志缺失 fromStatus 时，兼容回退到 toStatus
      return !!l.toStatus && normalizeProgressStatus(l.toStatus) === st
    }
  )
  if (matched.length > 0) {
    return matched.map(log => ({ logId: log.logId, text: formatLogLine(log) }))
  }
  if (stepIndex === 0 && sortedLogs.value.length > 0) {
    const early = sortedLogs.value.slice(0, 4)
    return early.map(log => ({ logId: log.logId, text: formatLogLine(log) }))
  }
  return []
}

/** 网关瞬时 502/503/504 或网络抖动：重试；全程 skipErrorToast，避免与组件内统一提示重复 */
let progressLoadGeneration = 0

function showProgressLoadFailed(e: unknown) {
  const ax = e as { response?: { status?: number; data?: { message?: string } }; message?: string }
  const status = ax?.response?.status
  if (status != null && status >= 500) {
    const isGateway = status === 502 || status === 503 || status === 504
    ElMessage.error(
      isGateway
        ? 'Service temporarily unavailable. Please try again.'
        : ax.response?.data?.message || 'Server error'
    )
    return
  }
  if (ax?.response === undefined) {
    ElMessage.error('Network connection failed')
    return
  }
  if (status != null && status >= 400 && status < 500) {
    ElMessage.error(ax.message || 'Failed to load progress')
  }
}

async function fetchProgressWithRetry(clientId: number, clientType: ClientType) {
  const maxAttempts = 3
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await workflowApi.getProgress(clientId, clientType, { skipErrorToast: true })
      return response
    } catch (e: unknown) {
      lastErr = e
      const ax = e as { response?: { status?: number }; isAuthError?: boolean }
      const st = ax?.response?.status
      if (st === 401 || ax.isAuthError) {
        throw e
      }
      const noResponse = ax?.response === undefined
      const retryable = noResponse || st === 502 || st === 503 || st === 504
      if (retryable && attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 280 * attempt))
        continue
      }
      showProgressLoadFailed(e)
      throw e
    }
  }
  throw lastErr
}

const loadProgress = async () => {
  if (!props.clientId || !props.clientType) return
  const gen = ++progressLoadGeneration
  loading.value = true
  activeTab.value = 'flowchart'
  try {
    const response = await fetchProgressWithRetry(props.clientId, props.clientType)
    if (gen !== progressLoadGeneration) return
    progress.value = response.data || response
  } catch {
    if (gen !== progressLoadGeneration) return
    // 错误提示已在 fetchProgressWithRetry 内统一处理
  } finally {
    if (gen === progressLoadGeneration) {
      loading.value = false
    }
  }
}

const isConfirmDismissed = (error: unknown) => error === 'cancel' || error === 'close'

const confirmSubmitOrWithdraw = async (action: string) => {
  if (action !== 'SUBMIT' && action !== 'WITHDRAW') return
  await ElMessageBox.confirm(
    action === 'SUBMIT'
      ? 'Are you sure you want to submit this client for review?'
      : 'Are you sure you want to withdraw this client?',
    action === 'SUBMIT' ? 'Confirm Submit' : 'Confirm Withdraw',
    {
      type: 'warning',
      confirmButtonText: action === 'SUBMIT' ? 'Submit' : 'Withdraw',
      cancelButtonText: 'Cancel'
    }
  )
}

const handleAction = async (action: string) => {
  if (!props.clientId || !props.clientType) return
  if (action === 'REVIEW') {
    emit('review')
    emit('update:modelValue', false)
    return
  }

  if (action === 'SUBMIT_SIGNATURE') {
    // +Signature 作为入口：统一跳转到客户预览页 Documents(Tab4) 进行上传
    emit('open-documents-forms')
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
    await confirmSubmitOrWithdraw(action)
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
    if (isConfirmDismissed(error)) return
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.message ||
      'Action failed'
    ElMessage.error(msg)
  }
}

const toDisplayDate = (value?: string | null) => {
  const text = formatDateTime(value || '')
  if (!text || text === '-') return '-'
  return text.replace(/^(\d{4})-(\d{2})-(\d{2}) /, '$3/$2/$1 ')
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
  font-size: 20px;
  line-height: 1.35;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.progress-dialog {
  /* 固定上限与视口侧各 +100px，与下方 Flowchart/Timeline 区增高一致，避免底部步骤被裁切 */
  max-height: min(1140px, calc(100vh - 100px));
  overflow-x: hidden;
  overflow-y: auto;
  /* 与 .flowchart-panel 左 padding 一致，使信息区与步骤序号圆点左缘对齐 */
  --progress-track-indent: 4px;
}

.inactive-banner {
  margin: 0 0 12px;
  padding-left: var(--progress-track-indent);
  font-size: 13px;
  color: #b45309;
}

.close-btn {
  color: #111827;
  font-size: 20px;
  padding: 0;
  min-height: auto;
}

.base-info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  row-gap: 12px;
  column-gap: 56px;
  margin-bottom: 20px;
  padding-left: var(--progress-track-indent);
  box-sizing: border-box;
}

.base-info-item {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  min-width: 0;

  .label {
    flex-shrink: 0;
    color: #9ca3af;
    white-space: nowrap;
  }

  .base-info-value {
    flex: 1 1 0%;
    min-width: 0;
    white-space: nowrap;
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding-left: var(--progress-track-indent);
  box-sizing: border-box;
}

/* 与弹窗标题「Progress」左缘对齐（不额外缩进） */
.tab-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.tab-btn {
  border: none;
  background: none;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.15s ease;

  &:hover {
    color: #6b7280;
  }

  &.active {
    color: #2563eb;
  }
}

.tab-divider {
  color: #d1d5db;
  font-size: 14px;
  user-select: none;
}

/* Flowchart / Timeline 固定同高（+100px 便于 6 步流程完整展示） */
.progress-tab-panels {
  display: block;
  height: 580px;
}

.tab-panel--inactive {
  display: none;
}

.flowchart-panel {
  padding: 4px 0 8px 4px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.timeline-panel {
  padding: 8px 0;
  padding-left: var(--progress-track-indent);
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.step-row {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 0;
}

.step-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.step-circle {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  box-sizing: border-box;

  &--done {
    background: #dbeafe;
    color: #2563eb;
    border: none;
  }

  &--current {
    background: #2563eb;
    color: #fff;
    border: none;
  }

  &--pending {
    background: #f3f4f6;
    color: #9ca3af;
    border: 1px solid #e5e7eb;
  }

  &--inactive-failed {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
}

.step-check-icon {
  font-size: 16px;
}

/* 数字用绝对居中，避免行高/基线在 flex 圆里视觉上偏下 */
.step-num {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, calc(-50% - 1px));
  line-height: 1;
}

.step-connector {
  flex: 1;
  width: 2px;
  min-height: 32px;
  margin: 4px 0 0;
  background: #e5e7eb;
  border-radius: 1px;

  &--done {
    background: #2563eb;
  }
}

.step-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 22px;
}

.step-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 28px;
  width: min(100%, 760px);
}

.step-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 400;
  color: #111827;

  &--emphasis {
    font-weight: 600;
  }

  &--muted {
    color: #9ca3af;
    font-weight: 400;
  }
}

/* 设计稿：步骤行右侧为「文字按钮」— 透明底、主色字、无描边，与标题同一行垂直居中 */
.step-inline-action {
  flex-shrink: 0;
  margin: 0 !important;
  padding: 4px 8px !important;
  min-height: auto !important;
  height: auto !important;
  font-size: 14px;
  font-weight: 500;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;

  &:hover,
  &:focus-visible {
    background: transparent !important;
    box-shadow: none !important;
  }

  /* primary：品牌蓝字（Submit / Review / Activate / Submit Signature） */
  &.el-button--primary {
    --el-button-text-color: #2563eb;
    --el-button-hover-text-color: #1d4ed8;
    --el-button-hover-bg-color: transparent;
    --el-button-active-bg-color: transparent;
  }

  &.el-button--primary:hover,
  &.el-button--primary:focus {
    color: #1d4ed8 !important;
  }

  &.el-button--warning {
    --el-button-hover-bg-color: transparent;
  }

  &.el-button--danger {
    --el-button-text-color: #c44545;
    --el-button-hover-text-color: #af3d3d;
    --el-button-hover-bg-color: transparent;
  }
}

.step-inline-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 0;
}

.step-details {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.step-detail-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.step-detail-line {
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}

.latest-pill {
  display: inline-block;
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  color: #374151;
  background: #f3f4f6;
  border-radius: 4px;
}

.timeline-list {
  padding: 4px 0 40px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.timeline-time {
  flex: 0 0 168px;
  color: #9ca3af;
  white-space: nowrap;
}

.timeline-text {
  flex: 1;
  min-width: 0;
  color: #6b7280;
  word-break: break-word;
}
</style>

<style lang="scss">
.client-progress-dialog.el-dialog {
  border-radius: var(--crm-radius-sm, 4px);
  overflow: hidden;
}

.client-progress-dialog .el-dialog__header {
  padding: 20px 24px 0;
  border-bottom: none;
  margin-right: 0;
}

.client-progress-dialog .el-dialog__body {
  /* 右侧不留内边距，确保滚动条贴弹窗最右侧 */
  padding: 8px 0 24px 24px;
}
</style>
