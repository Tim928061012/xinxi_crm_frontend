<template>
  <div class="comments-panel">
    <div class="comments-toolbar">
      <AddCommentButton :disabled="mutationSubmitting" @click="onToolbarAddComment" />
    </div>

    <div v-loading.fullscreen="loading">
      <el-empty v-if="!comments.length" description="No comments yet" />
      <div v-else class="comment-groups">
        <section v-for="group in groupedComments" :key="group.groupKey" class="comment-group">
          <h3 class="comment-group__title">{{ group.label }}</h3>
          <div class="comment-group__list">
            <article
              v-for="comment in group.items"
              :key="comment.commentId"
              class="comment-item"
              :data-comment-id="comment.commentId"
            >
              <p class="comment-item__text">{{ comment.description }}</p>
              <div class="comment-item__meta-row">
                <span class="comment-item__meta">{{ authorAtLine(comment) }}</span>
                <div class="comment-item__actions">
                  <button
                    type="button"
                    class="icon-action"
                    aria-label="Reply"
                    :disabled="mutationSubmitting"
                    @click="toggleReply(comment.commentId)"
                  >
                    <el-icon><ChatDotRound /></el-icon>
                  </button>
                  <button
                    v-if="canDeleteComment(comment)"
                    type="button"
                    class="icon-action"
                    aria-label="Delete"
                    :disabled="mutationSubmitting"
                    @click="deleteComment(comment)"
                  >
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </div>

              <div v-if="replyTargetId === comment.commentId" class="reply-box">
                <el-input
                  v-model="replyText"
                  type="textarea"
                  :rows="3"
                  maxlength="1000"
                  show-word-limit
                  placeholder="Please enter reply"
                />
                <div class="reply-actions">
                  <el-button size="small" :disabled="mutationSubmitting" @click="cancelReply">Cancel</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="mutationSubmitting"
                    :disabled="mutationSubmitting"
                    @click="submitReply(comment.commentId)"
                  >
                    Submit Reply
                  </el-button>
                </div>
              </div>

              <div v-if="comment.replies?.length" class="reply-list">
                <div v-for="reply in comment.replies" :key="reply.commentId" class="reply-item">
                  <p class="reply-item__text">{{ reply.description }}</p>
                  <div class="comment-item__meta-row">
                    <span class="comment-item__meta">{{ authorAtLine(reply) }}</span>
                    <div class="comment-item__actions">
                      <button
                        v-if="canDeleteComment(reply)"
                        type="button"
                        class="icon-action"
                        aria-label="Delete"
                        :disabled="mutationSubmitting"
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
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { ChatDotRound, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientComment, type ClientType } from '@/api/user/workflow'
import { getCommentModuleLabel } from '@/utils/comment-modules'
import { CLIENT_COMMENT_DIALOG_INJECT_KEY } from '@/components/client/client-comment-dialog-key'
import { formatDateTime } from '@/utils/date'
import AddCommentButton from '@/components/common/AddCommentButton.vue'

const commentModuleLabel = getCommentModuleLabel

const props = defineProps<{
  clientId: number
  clientType: ClientType
  currentUserId?: string | number
}>()

const emit = defineEmits<{
  /** 列表变化（含加载完成），供详情页同步右侧评论栏数量 */
  (e: 'changed'): void
}>()

const commentDialog = inject(CLIENT_COMMENT_DIALOG_INJECT_KEY, null)

const loading = ref(false)
const mutationSubmitting = ref(false)
const comments = ref<ClientComment[]>([])
const replyTargetId = ref<number | null>(null)
const replyText = ref('')
type CommentGroup = { groupKey: string; label: string; items: ClientComment[] }

const groupedComments = computed<CommentGroup[]>(() => {
  const map = new Map<string, CommentGroup>()
  for (const c of comments.value) {
    const moduleCode = (c.moduleName || '').trim()
    const label = commentModuleLabel(moduleCode) || 'Comment'
    const key = `MODULE:${moduleCode || 'NONE'}`
    if (!map.has(key)) map.set(key, { groupKey: key, label, items: [] })
    map.get(key)!.items.push(c)
  }
  return [...map.values()]
})

const loadComments = async () => {
  loading.value = true
  try {
    const response = await workflowApi.getComments(props.clientId, props.clientType)
    comments.value = response.data || response || []
    emit('changed')
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load comments')
  } finally {
    loading.value = false
  }
}

function onToolbarAddComment() {
  if (mutationSubmitting.value || loading.value) return
  commentDialog?.openNewComment()
}

defineExpose({
  loadComments
})

const toggleReply = (commentId: number) => {
  replyTargetId.value = replyTargetId.value === commentId ? null : commentId
  replyText.value = ''
  if (replyTargetId.value === commentId) {
    void nextTick(() => {
      const box = document.querySelector(
        `.comments-panel [data-comment-id="${commentId}"] .reply-box`
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
  if (mutationSubmitting.value) return
  if (!replyText.value.trim()) {
    ElMessage.warning('Please enter reply')
    return
  }
  if (replyText.value.trim().length > 1000) {
    ElMessage.warning('Reply max 1000 characters')
    return
  }
  mutationSubmitting.value = true
  try {
    await workflowApi.replyComment(props.clientId, props.clientType, commentId, {
      description: replyText.value.trim()
    })
    ElMessage.success('Reply added')
    cancelReply()
    await loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to create reply')
  } finally {
    mutationSubmitting.value = false
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
  if (mutationSubmitting.value) return
  if (!canDeleteComment(comment)) {
    ElMessage.warning('You can only delete your own comments')
    return
  }

  mutationSubmitting.value = true
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this comment?', 'Confirm', { type: 'warning' })
    await workflowApi.deleteComment(props.clientId, props.clientType, comment.commentId)
    ElMessage.success('Comment deleted')
    await loadComments()
  } catch (error: any) {
    if (error === 'cancel') return
    ElMessage.error(error.message || 'Failed to delete comment')
  } finally {
    mutationSubmitting.value = false
  }
}

const formatDisplayDate = (value?: string | null) => {
  const text = formatDateTime(value || '')
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (!m) return text
  const [, y, mo, d, hm] = m
  return `${d}/${mo}/${y} ${hm}`
}

const authorAtLine = (comment: ClientComment) => `${comment.createdByName || '-'} at ${formatDisplayDate(comment.createdAt)}`

watch(
  () => [props.clientId, props.clientType],
  () => {
    if (props.clientId && props.clientType) {
      loadComments()
    }
  },
  { immediate: true }
)

</script>

<style scoped lang="scss">
.comments-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin: 0;
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-sizing: border-box;
}

.comments-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.comment-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.comment-group {
  padding-bottom: 2px;
  margin: 0;
}

.comment-group + .comment-group {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.comment-group__title {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.comment-group__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
}

.comment-item {
  margin: 0;
  padding: 0;
}

.comment-item__text,
.reply-item__text {
  margin: 0;
  color: #1f2937;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
}

.comment-item__meta-row {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.comment-item__meta {
  font-size: 14px;
  color: #6b7280;
}

.reply-list {
  margin-top: 10px;
  padding-left: 14px;
  border-left: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  padding-top: 2px;
}

.reply-box {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-actions,
.comment-item__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.icon-action {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #025189;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;

  .el-icon {
    font-size: 15px;
  }

  &:hover {
    background: rgba(2, 81, 137, 0.08);
  }
}
</style>
