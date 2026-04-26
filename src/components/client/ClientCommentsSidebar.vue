<template>
  <div class="comments-sidebar">
    <div ref="sidebarExpandedRef" class="comments-sidebar__expanded">
      <header ref="sidebarHeadRef" class="comments-sidebar__head">
        <h2 class="head-title">Comment</h2>
        <div class="head-actions">
          <button
            type="button"
            class="head-icon-btn head-icon-btn--add"
            aria-label="Comment"
            @click="onAddComment"
          >
            <el-icon><CirclePlus /></el-icon>
          </button>
        </div>
      </header>

      <div v-loading="loading && comments.length > 0" class="comments-sidebar__scroll-wrap">
        <el-scrollbar class="comments-sidebar__scrollbar">
          <div v-if="!comments.length" class="empty-mini">No comments yet</div>
          <div v-else class="sidebar-groups">
            <article
              v-for="thread in flatThreads"
              :key="thread.comment.commentId"
              class="sidebar-thread"
              :data-comment-id="thread.comment.commentId"
            >
              <h3 class="sidebar-thread__heading">{{ thread.moduleLabel }}</h3>
              <div class="sidebar-thread__block">
                <p class="sidebar-thread__text">{{ thread.comment.description }}</p>
                <div class="sidebar-thread__footer">
                  <span class="sidebar-thread__meta">
                    <span class="sidebar-thread__author">{{ displayAuthorName(thread.comment) }}</span>
                    <span class="sidebar-thread__at">at</span>
                    <span class="sidebar-thread__time">{{ formatSidebarDateTime(thread.comment.createdAt) }}</span>
                  </span>
                  <div class="sidebar-thread__actions">
                    <button
                      type="button"
                      class="thread-icon-action"
                      aria-label="Reply"
                      @click="toggleReply(thread.comment.commentId)"
                    >
                      <el-icon><ChatDotRound /></el-icon>
                    </button>
                    <button
                      v-if="canDeleteComment(thread.comment)"
                      type="button"
                      class="thread-icon-action"
                      aria-label="Delete"
                      @click="deleteComment(thread.comment)"
                    >
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="replyTargetId === thread.comment.commentId" class="sidebar-reply-box">
                <el-input
                  v-model="replyText"
                  type="textarea"
                  :rows="2"
                  maxlength="1000"
                  show-word-limit
                  placeholder="Reply..."
                />
                <div class="sidebar-reply-box__actions">
                  <el-button size="small" @click="cancelReply">Cancel</el-button>
                  <el-button type="primary" size="small" @click="submitReply(thread.comment.commentId)">Submit</el-button>
                </div>
              </div>

              <div v-if="thread.comment.replies?.length" class="sidebar-thread__replies">
                <div v-for="reply in thread.comment.replies" :key="reply.commentId" class="sidebar-reply">
                  <p class="sidebar-reply__text">{{ reply.description }}</p>
                  <div class="sidebar-thread__footer">
                    <span class="sidebar-thread__meta">
                      <span class="sidebar-thread__author">{{ displayAuthorName(reply) }}</span>
                      <span class="sidebar-thread__at">at</span>
                      <span class="sidebar-thread__time">{{ formatSidebarDateTime(reply.createdAt) }}</span>
                    </span>
                    <div class="sidebar-thread__actions">
                      <button
                        v-if="canDeleteComment(reply)"
                        type="button"
                        class="thread-icon-action"
                        aria-label="Delete"
                        @click="deleteComment(reply)"
                      >
                        <el-icon><Delete /></el-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { ChatDotRound, CirclePlus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientComment, type ClientType } from '@/api/user/workflow'
import { getCommentModuleLabel, commentModuleSortIndex } from '@/utils/comment-modules'
import { CLIENT_COMMENT_DIALOG_INJECT_KEY } from '@/components/client/client-comment-dialog-key'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  clientId: number
  clientType: ClientType
  collapsed?: boolean
  currentUserId?: string | number
  /** 当前主 Tab 映射的模块，用于侧栏「添加评论」默认归属 */
  defaultModule?: string
}>()

const emit = defineEmits<{
  (e: 'count-updated', total: number): void
  (e: 'changed'): void
}>()

const commentDialog = inject(CLIENT_COMMENT_DIALOG_INJECT_KEY, null)

const loading = ref(false)
const comments = ref<ClientComment[]>([])
const replyTargetId = ref<number | null>(null)
const replyText = ref('')
const sidebarExpandedRef = ref<HTMLElement | null>(null)
const sidebarHeadRef = ref<HTMLElement | null>(null)

const UNSPECIFIED = '_UNSPECIFIED'

type CommentGroup = {
  moduleCode: string
  label: string
  items: ClientComment[]
}

const commentGroups = computed<CommentGroup[]>(() => {
  const roots = comments.value
  const byCode = new Map<string, ClientComment[]>()
  for (const c of roots) {
    const raw = (c.moduleName || '').trim()
    const code = raw || UNSPECIFIED
    if (!byCode.has(code)) byCode.set(code, [])
    byCode.get(code)!.push(c)
  }
  const codes = [...byCode.keys()].sort((a, b) => {
    if (a === UNSPECIFIED) return 1
    if (b === UNSPECIFIED) return -1
    return commentModuleSortIndex(a) - commentModuleSortIndex(b)
  })
  return codes.map(moduleCode => ({
    moduleCode,
    label: moduleCode === UNSPECIFIED ? 'Other' : getCommentModuleLabel(moduleCode),
    items: byCode.get(moduleCode)!
  }))
})

const flatThreads = computed(() =>
  commentGroups.value.flatMap(group =>
    group.items.map(comment => ({
      moduleLabel: group.label,
      comment
    }))
  )
)

function countTotal(list: ClientComment[]): number {
  let n = 0
  for (const c of list) {
    n += 1
    if (c.replies?.length) n += c.replies.length
  }
  return n
}

/** 设计稿：27/11 19:00（隐藏年份以缩短占宽） */
function formatSidebarDateTime(value?: string | null): string {
  const t = formatDateTime(value || '')
  if (!t || t === '-') return '-'
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (m) {
    const [, , mo, d, hm] = m
    return `${d}/${mo} ${hm}`
  }
  return t
}

function displayAuthorName(c: ClientComment): string {
  const raw = (c.createdByName || '').trim()
  return raw || '-'
}

const loadComments = async () => {
  loading.value = true
  try {
    const response = await workflowApi.getComments(props.clientId, props.clientType)
    const list = (response as { data?: ClientComment[] }).data || (response as unknown as ClientComment[]) || []
    comments.value = Array.isArray(list) ? list : []
    emit('count-updated', countTotal(comments.value))
  } catch {
    comments.value = []
    emit('count-updated', 0)
  } finally {
    loading.value = false
  }
}

function onAddComment() {
  const mod = (props.defaultModule || 'BASIC').trim() || 'BASIC'
  if (commentDialog?.openAddComment) {
    commentDialog.openAddComment({
      moduleName: mod
    })
  } else {
    commentDialog?.openNewComment()
  }
}

const toggleReply = (commentId: number) => {
  replyTargetId.value = replyTargetId.value === commentId ? null : commentId
  replyText.value = ''
  if (replyTargetId.value === commentId) {
    void nextTick(() => {
      const box = document.querySelector(
        `.comments-sidebar [data-comment-id="${commentId}"] .sidebar-reply-box`
      ) as HTMLElement | null
      box?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }
}

const cancelReply = () => {
  replyTargetId.value = null
  replyText.value = ''
}

const submitReply = async (commentId: number) => {
  const text = replyText.value.trim()
  if (!text) {
    ElMessage.warning('Please enter reply')
    return
  }
  if (text.length > 1000) {
    ElMessage.warning('Reply max 1000 characters')
    return
  }
  try {
    await workflowApi.replyComment(props.clientId, props.clientType, commentId, { description: text })
    ElMessage.success('Reply added')
    cancelReply()
    await loadComments()
    emit('changed')
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : ''
    ElMessage.error(msg || 'Failed to add reply')
  }
}

const normalizeId = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const canDeleteComment = (comment: ClientComment): boolean => {
  const current = normalizeId(props.currentUserId)
  const owner = normalizeId(comment.createdByUserId)
  if (!current || !owner) return false
  return current === owner
}

const deleteComment = async (comment: ClientComment) => {
  if (!canDeleteComment(comment)) {
    ElMessage.warning('You can only delete your own comments')
    return
  }

  try {
    await ElMessageBox.confirm('Are you sure you want to delete this comment?', 'Confirm', { type: 'warning' })
    await workflowApi.deleteComment(props.clientId, props.clientType, comment.commentId)
    ElMessage.success('Comment deleted')
    if (replyTargetId.value === comment.commentId) cancelReply()
    await loadComments()
    emit('changed')
  } catch (error: unknown) {
    if (error === 'cancel') return
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : ''
    ElMessage.error(msg || 'Failed to delete comment')
  }
}

watch(
  () => [props.clientId, props.clientType],
  () => {
    if (props.clientId && props.clientType) loadComments()
  },
  { immediate: true }
)

defineExpose({
  reload: loadComments,
  getContentHeight: () => {
    const expanded = sidebarExpandedRef.value
    if (!expanded) return 0
    return expanded.scrollHeight
  },
  getHeaderHeight: () => {
    const head = sidebarHeadRef.value
    return head?.offsetHeight || 0
  }
})
</script>

<style scoped lang="scss">
$crm-primary: #025189;
$crm-primary-hover: #0369a1;
$meta-grey: #909399;
$text-body: #303133;
$divider: #ebeef5;

.comments-sidebar {
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
  border-radius: inherit;
}

.comments-sidebar__expanded {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 0;
}

.comments-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid $divider;
  flex-shrink: 0;

  .head-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: $crm-primary;
    letter-spacing: -0.02em;
    line-height: 1.3;

    &__count {
      font-weight: 700;
      color: $crm-primary;
    }
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

.head-icon-btn {
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  border-radius: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  margin: 0;
  color: $crm-primary;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    color 0.15s ease,
    transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;

  .el-icon {
    font-size: 16px;
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(2, 81, 137, 0.45);
    outline-offset: 2px;
  }

  &--add {
    &:hover {
      color: $crm-primary-hover;
    }
  }
}

.comments-sidebar__scroll-wrap {
  flex: 0 1 auto;
  min-height: 0;
  position: relative;
}

.comments-sidebar__scrollbar {
  height: auto;
  padding: 0 8px 0 14px;
  box-sizing: border-box;
}

.comments-sidebar__scrollbar :deep(.el-scrollbar__wrap) {
  max-height: none;
}

.empty-mini {
  padding: 28px 14px;
  text-align: center;
  color: $meta-grey;
  font-size: 13px;
}

.sidebar-groups {
  display: flex;
  flex-direction: column;
  padding: 8px 0 24px;
}

.sidebar-thread {
  padding: 14px 0 12px;
  border-bottom: 1px solid $divider;

  &:last-child {
    border-bottom: none;
  }
}

.sidebar-thread__heading {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: $text-body;
  line-height: 1.25;
}

.sidebar-thread__block {
  min-width: 0;
}

.sidebar-thread__text {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 400;
  color: $text-body;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.sidebar-thread__edit {
  margin-bottom: 10px;
}

.sidebar-thread__edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.sidebar-thread__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 22px;
}

.sidebar-thread__meta {
  font-size: 12px;
  color: $meta-grey;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: baseline;
  flex-wrap: nowrap;
}

.sidebar-thread__author {
  white-space: nowrap;
}

.sidebar-thread__at {
  white-space: nowrap;
  margin: 0 4px;
}

.sidebar-thread__time {
  white-space: nowrap;
}

.sidebar-thread__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 稿图：元信息右侧蓝色线型图标，无圆圈描边 */
.thread-icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: $crm-primary;
  cursor: pointer;
  transition:
    color 0.12s ease,
    background 0.12s ease;

  .el-icon {
    font-size: 16px;
  }

  &:hover {
    color: $crm-primary-hover;
    background: rgba(2, 81, 137, 0.06);
  }

  &:focus-visible {
    outline: 2px solid rgba(2, 81, 137, 0.35);
    outline-offset: 1px;
  }
}

.sidebar-thread__replies {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid #e8ecf1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-reply-box {
  margin-top: 10px;
  padding-bottom: 4px;
}

.sidebar-reply-box__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.sidebar-reply {
  min-width: 0;

  .sidebar-thread__footer {
    margin-top: 6px;
  }
}

.sidebar-reply__text {
  margin: 0;
  font-size: 12px;
  color: $text-body;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

</style>
