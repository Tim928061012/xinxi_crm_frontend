<template>
  <div class="comments-sidebar" :class="{ 'comments-sidebar--collapsed': collapsed }">
    <button
      v-if="collapsed"
      type="button"
      class="comments-sidebar__expand-strip"
      aria-label="Expand comments"
      @click="emit('update:collapsed', false)"
    >
      <el-icon class="chev"><DArrowLeft /></el-icon>
      <span class="v-label"
        >Comments<span class="v-label__count"> ({{ threadCount }})</span></span
      >
    </button>

    <div v-else class="comments-sidebar__expanded">
      <header class="comments-sidebar__head">
        <h2 class="head-title">
          Comments
          <span class="head-title__count">({{ threadCount }})</span>
        </h2>
        <div class="head-actions">
          <button
            type="button"
            class="head-icon-btn head-icon-btn--add"
            aria-label="Add comment"
            @click="onAddComment"
          >
            <el-icon><Plus /></el-icon>
          </button>
          <button
            type="button"
            class="head-icon-btn head-icon-btn--collapse"
            aria-label="Collapse comments"
            @click="emit('update:collapsed', true)"
          >
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </header>

      <div v-loading="loading" class="comments-sidebar__scroll-wrap">
        <el-scrollbar class="comments-sidebar__scrollbar">
          <div v-if="!comments.length" class="empty-mini">No comments yet</div>
          <div v-else class="sidebar-groups">
            <section v-for="group in commentGroups" :key="group.moduleCode" class="sidebar-thread-group">
              <h3 class="sidebar-thread-group__heading">{{ group.label }}</h3>
              <div class="sidebar-thread-group__list">
                <article v-for="comment in group.items" :key="comment.commentId" class="sidebar-thread">
                  <div class="sidebar-thread__block">
                    <template v-if="editingId === comment.commentId">
                      <div class="sidebar-thread__edit">
                        <el-input
                          v-model="editText"
                          type="textarea"
                          :rows="3"
                          maxlength="1000"
                          show-word-limit
                          placeholder="Edit comment…"
                        />
                        <div class="sidebar-thread__edit-actions">
                          <el-button size="small" @click="cancelEdit">Cancel</el-button>
                          <el-button type="primary" size="small" @click="saveEdit(comment)">Save</el-button>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <p class="sidebar-thread__text">{{ comment.description }}</p>
                    </template>
                    <div class="sidebar-thread__footer">
                      <span class="sidebar-thread__meta">{{ authorAtLine(comment) }}</span>
                      <div v-if="editingId !== comment.commentId" class="sidebar-thread__actions">
                        <button
                          v-if="canEdit(comment)"
                          type="button"
                          class="thread-icon-action"
                          aria-label="Edit"
                          @click="startEdit(comment)"
                        >
                          <el-icon><EditPen /></el-icon>
                        </button>
                        <button
                          v-if="canDelete(comment)"
                          type="button"
                          class="thread-icon-action"
                          aria-label="Delete"
                          @click="deleteComment(comment.commentId)"
                        >
                          <el-icon><Delete /></el-icon>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="comment.replies?.length" class="sidebar-thread__replies">
                    <div v-for="reply in comment.replies" :key="reply.commentId" class="sidebar-reply">
                      <template v-if="editingId === reply.commentId">
                        <div class="sidebar-thread__edit">
                          <el-input
                            v-model="editText"
                            type="textarea"
                            :rows="2"
                            maxlength="1000"
                            show-word-limit
                            placeholder="Edit reply…"
                          />
                          <div class="sidebar-thread__edit-actions">
                            <el-button size="small" @click="cancelEdit">Cancel</el-button>
                            <el-button type="primary" size="small" @click="saveEdit(reply)">Save</el-button>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <p class="sidebar-reply__text">{{ reply.description }}</p>
                      </template>
                      <div class="sidebar-thread__footer">
                        <span class="sidebar-thread__meta">{{ authorAtLine(reply) }}</span>
                        <div v-if="editingId !== reply.commentId" class="sidebar-thread__actions">
                          <button
                            v-if="canEdit(reply)"
                            type="button"
                            class="thread-icon-action"
                            aria-label="Edit"
                            @click="startEdit(reply)"
                          >
                            <el-icon><EditPen /></el-icon>
                          </button>
                          <button
                            v-if="canDelete(reply)"
                            type="button"
                            class="thread-icon-action"
                            aria-label="Delete"
                            @click="deleteComment(reply.commentId)"
                          >
                            <el-icon><Delete /></el-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </el-scrollbar>
      </div>

      <footer class="comments-sidebar__foot">
        <button type="button" class="foot-link" @click="emit('open-comments-tab')">
          Open full Comments tab
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { ArrowRight, DArrowLeft, Delete, EditPen, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientComment, type ClientType } from '@/api/user/workflow'
import { getCommentModuleLabel, commentModuleSortIndex } from '@/utils/comment-modules'
import { CLIENT_COMMENT_DIALOG_INJECT_KEY } from '@/components/client/client-comment-dialog-key'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  clientId: number
  clientType: ClientType
  collapsed: boolean
  /** 当前主 Tab 映射的模块，用于侧栏「添加评论」默认归属 */
  defaultModule?: string
  currentUserId?: string | number
}>()

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
  (e: 'open-comments-tab'): void
  (e: 'count-updated', total: number): void
  (e: 'changed'): void
}>()

const commentDialog = inject(CLIENT_COMMENT_DIALOG_INJECT_KEY, null)

const loading = ref(false)
const comments = ref<ClientComment[]>([])
const editingId = ref<number | null>(null)
const editText = ref('')

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

function countTotal(list: ClientComment[]): number {
  let n = 0
  for (const c of list) {
    n += 1
    if (c.replies?.length) n += c.replies.length
  }
  return n
}

const threadCount = computed(() => countTotal(comments.value))

/** 设计稿：27/11/2025 19:00 */
function formatSidebarDateTime(value?: string | null): string {
  const t = formatDateTime(value || '')
  if (!t || t === '-') return '-'
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (m) {
    const [, y, mo, d, hm] = m
    return `${d}/${mo}/${y} ${hm}`
  }
  return t
}

function authorAtLine(c: ClientComment): string {
  const name = c.createdByName || '-'
  const when = formatSidebarDateTime(c.createdAt)
  return `${name} at ${when}`
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
      moduleName: mod,
      presetTitle: getCommentModuleLabel(mod) || mod
    })
  } else {
    commentDialog?.openNewComment()
  }
}

const canDelete = (comment: ClientComment) => String(comment.createdByUserId ?? '') === String(props.currentUserId ?? '')
const canEdit = canDelete

const startEdit = (comment: ClientComment) => {
  editingId.value = comment.commentId
  editText.value = comment.description || ''
}

const cancelEdit = () => {
  editingId.value = null
  editText.value = ''
}

const saveEdit = async (comment: ClientComment) => {
  const text = editText.value.trim()
  if (!text) {
    ElMessage.warning('Please enter comment text')
    return
  }
  if (text.length > 1000) {
    ElMessage.warning('Max 1000 characters')
    return
  }
  try {
    await workflowApi.updateComment(props.clientId, props.clientType, comment.commentId, {
      description: text
    })
    ElMessage.success('Saved')
    cancelEdit()
    await loadComments()
    emit('changed')
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : ''
    ElMessage.error(msg || 'Failed to save')
  }
}

const deleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this comment?', 'Confirm', { type: 'warning' })
    await workflowApi.deleteComment(props.clientId, props.clientType, commentId)
    ElMessage.success('Comment deleted')
    if (editingId.value === commentId) cancelEdit()
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
  reload: loadComments
})
</script>

<style scoped lang="scss">
$crm-primary: #025189;
$crm-primary-hover: #0369a1;
$head-add: #0c8ce8;
$head-add-hover: #0778c9;
$head-collapse: #003056;
$head-collapse-hover: #002040;
$meta-grey: #909399;
$text-body: #303133;
$divider: #ebeef5;

.comments-sidebar {
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
  border-radius: inherit;
}

.comments-sidebar--collapsed {
  min-height: 0;
  width: 100%;
  align-items: stretch;
}

.comments-sidebar__expand-strip {
  flex: 1;
  min-height: 280px;
  width: 100%;
  border: none;
  padding: 8px 4px;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 40%);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  color: $crm-primary;
  border-radius: 0 4px 4px 0;

  &:hover {
    background: #eef5fc;
  }

  .chev {
    font-size: 18px;
  }

  .v-label {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;

    &__count {
      font-weight: 700;
    }
  }
}

.comments-sidebar__expanded {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  $size: 32px;
  width: $size;
  height: $size;
  min-width: $size;
  min-height: $size;
  border-radius: 50%;
  border: none;
  padding: 0;
  margin: 0;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background 0.15s ease,
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
    background: $head-add;

    &:hover {
      background: $head-add-hover;
    }
  }

  &--collapse {
    background: $head-collapse;

    &:hover {
      background: $head-collapse-hover;
    }
  }
}

.comments-sidebar__scroll-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.comments-sidebar__scrollbar {
  height: 100%;
  padding: 0 8px 0 14px;
  box-sizing: border-box;
}

.comments-sidebar__scrollbar :deep(.el-scrollbar__wrap) {
  max-height: calc(100vh - 200px);
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
  padding: 8px 0 12px;
}

.sidebar-thread-group {
  & + & {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid $divider;
  }

  &__heading {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: $text-body;
    line-height: 1.35;
  }

  &__list {
    display: flex;
    flex-direction: column;
  }
}

.sidebar-thread {
  padding: 12px 0;
  border-bottom: 1px solid $divider;

  &:last-child {
    border-bottom: none;
  }
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
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: $crm-primary;
  cursor: pointer;
  transition:
    color 0.12s ease,
    background 0.12s ease;

  .el-icon {
    font-size: 18px;
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

.comments-sidebar__foot {
  flex-shrink: 0;
  padding: 10px 12px 14px;
  border-top: 1px solid $divider;
  text-align: center;
}

.foot-link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: $crm-primary;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    color: $crm-primary-hover;
    text-decoration: underline;
  }
}
</style>
