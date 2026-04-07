<template>
  <div class="comments-panel">
    <div class="comments-toolbar">
      <el-select v-model="selectedModule" placeholder="All Modules" clearable style="width: 220px" @change="loadComments">
        <el-option label="All Modules" value="" />
        <el-option v-for="module in modules" :key="module.value" :label="module.label" :value="module.value" />
      </el-select>
      <el-button type="primary" @click="openNewComment">Add Comment</el-button>
    </div>

    <div v-loading="loading">
      <el-empty v-if="!comments.length" description="No comments yet" />
      <div v-else class="comment-list">
        <div v-for="comment in comments" :key="comment.commentId" class="comment-card">
          <div class="comment-header">
            <div>
              <div class="comment-title">{{ comment.title || 'Comment' }}</div>
              <div class="comment-meta">
                <span>{{ comment.createdByName || '-' }}</span>
                <span>{{ comment.createdByRoleLabel || comment.createdByRole || '-' }}</span>
                <span>{{ formatDateTime(comment.createdAt) }}</span>
                <el-tag v-if="comment.moduleName" size="small">{{ comment.moduleName }}</el-tag>
              </div>
            </div>
            <div class="comment-actions">
              <el-button link type="primary" @click="toggleReply(comment.commentId)">Reply</el-button>
              <el-button
                v-if="canDelete(comment)"
                link
                type="danger"
                @click="deleteComment(comment.commentId)"
              >
                Delete
              </el-button>
            </div>
          </div>
          <div class="comment-body">{{ comment.description }}</div>

          <div v-if="replyTargetId === comment.commentId" class="reply-box">
            <el-input v-model="replyText" type="textarea" :rows="3" placeholder="Please enter reply" />
            <div class="reply-actions">
              <el-button @click="cancelReply">Cancel</el-button>
              <el-button type="primary" @click="submitReply(comment.commentId)">Submit Reply</el-button>
            </div>
          </div>

          <div v-if="comment.replies?.length" class="reply-list">
            <div v-for="reply in comment.replies" :key="reply.commentId" class="reply-item">
              <div class="reply-meta">
                <span>{{ reply.createdByName || '-' }}</span>
                <span>{{ reply.createdByRoleLabel || reply.createdByRole || '-' }}</span>
                <span>{{ formatDateTime(reply.createdAt) }}</span>
                <el-button
                  v-if="canDelete(reply)"
                  link
                  type="danger"
                  @click="deleteComment(reply.commentId)"
                >
                  Delete
                </el-button>
              </div>
              <div class="reply-body">{{ reply.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog :model-value="commentDialogVisible" title="Add Comment" width="560px" @close="closeNewComment">
      <el-form :model="commentForm" label-width="110px">
        <el-form-item label="Module">
          <el-select v-model="commentForm.moduleName" style="width: 100%">
            <el-option v-for="module in modules" :key="module.value" :label="module.label" :value="module.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="commentForm.title" placeholder="Please enter title" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="commentForm.description" type="textarea" :rows="4" placeholder="Please enter description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeNewComment">Cancel</el-button>
        <el-button type="primary" @click="submitComment">Submit</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { workflowApi, type ClientComment, type ClientType } from '@/api/user/workflow'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  clientId: number
  clientType: ClientType
  currentUserId?: string | number
  defaultModule?: string
}>()

const modules = [
  { label: 'General', value: 'GENERAL' },
  { label: 'KYC', value: 'KYC' },
  { label: 'Investment Risk Profile', value: 'RISK' },
  { label: 'Documents', value: 'DOCUMENTS' },
  { label: 'Fee Schedule', value: 'FEE' }
]

const loading = ref(false)
const comments = ref<ClientComment[]>([])
const selectedModule = ref('')
const commentDialogVisible = ref(false)
const replyTargetId = ref<number | null>(null)
const replyText = ref('')
const commentForm = reactive({
  moduleName: 'GENERAL',
  title: '',
  description: ''
})

const loadComments = async () => {
  loading.value = true
  try {
    const response = await workflowApi.getComments(props.clientId, props.clientType, selectedModule.value || undefined)
    comments.value = response.data || response || []
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to load comments')
  } finally {
    loading.value = false
  }
}

const openNewComment = () => {
  commentForm.moduleName = selectedModule.value || props.defaultModule || 'GENERAL'
  commentForm.title = ''
  commentForm.description = ''
  commentDialogVisible.value = true
}

const closeNewComment = () => {
  commentDialogVisible.value = false
}

const submitComment = async () => {
  if (!commentForm.title.trim() || !commentForm.description.trim()) {
    ElMessage.warning('Please complete title and description')
    return
  }
  try {
    await workflowApi.createComment(props.clientId, props.clientType, {
      moduleName: commentForm.moduleName,
      title: commentForm.title.trim(),
      description: commentForm.description.trim()
    })
    ElMessage.success('Comment added')
    commentDialogVisible.value = false
    await loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to create comment')
  }
}

const toggleReply = (commentId: number) => {
  replyTargetId.value = replyTargetId.value === commentId ? null : commentId
  replyText.value = ''
}

const cancelReply = () => {
  replyTargetId.value = null
  replyText.value = ''
}

const submitReply = async (commentId: number) => {
  if (!replyText.value.trim()) {
    ElMessage.warning('Please enter reply')
    return
  }
  try {
    await workflowApi.replyComment(props.clientId, props.clientType, commentId, {
      description: replyText.value.trim()
    })
    ElMessage.success('Reply added')
    cancelReply()
    await loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to create reply')
  }
}

const deleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this comment?', 'Confirm', { type: 'warning' })
    await workflowApi.deleteComment(props.clientId, props.clientType, commentId)
    ElMessage.success('Comment deleted')
    await loadComments()
  } catch (error: any) {
    if (error === 'cancel') return
    ElMessage.error(error.message || 'Failed to delete comment')
  }
}

const canDelete = (comment: ClientComment) => String(comment.createdByUserId) === String(props.currentUserId || '')

watch(
  () => [props.clientId, props.clientType],
  () => {
    if (props.clientId && props.clientType) {
      loadComments()
    }
  },
  { immediate: true }
)

watch(
  () => props.defaultModule,
  (value) => {
    if (!selectedModule.value && value) {
      selectedModule.value = value
      loadComments()
    }
  }
)
</script>

<style scoped lang="scss">
.comments-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comments-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.comment-header,
.reply-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.comment-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.comment-meta,
.reply-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #909399;
  font-size: 12px;
}

.comment-body,
.reply-body {
  margin-top: 12px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-list {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.reply-box {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-actions,
.comment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
