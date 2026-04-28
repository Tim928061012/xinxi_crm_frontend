<template>
  <el-dialog
    :model-value="commentDialogVisible"
    title="Add Comment"
    width="560px"
    append-to-body
    :close-on-click-modal="!submitting"
    @close="closeNewComment"
  >
    <el-form :model="commentForm" label-width="110px">
      <el-form-item label="Module">
        <el-select v-model="commentForm.moduleName" style="width: 100%" :disabled="submitting">
          <el-option v-for="module in modules" :key="module.value" :label="module.label" :value="module.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Description">
        <el-input
          v-model="commentForm.description"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          placeholder="Please enter description"
          :disabled="submitting"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="submitting" @click="closeNewComment">Cancel</el-button>
      <el-button type="primary" :loading="submitting" :disabled="submitting" @click="submitComment">Submit</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { workflowApi, type ClientType } from '@/api/user/workflow'
import { COMMENT_MODULE_OPTIONS } from '@/utils/comment-modules'

const modules = COMMENT_MODULE_OPTIONS

const props = defineProps<{
  clientId: number
  clientType: ClientType
  /** 从主 Tab 语境带入的默认模块（未在 openAddComment 中指定 moduleName 时使用） */
  contextDefaultModule?: string
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

const commentDialogVisible = ref(false)
const submitting = ref(false)
const commentForm = reactive({
  moduleName: 'BASIC',
  description: ''
})

function openNewComment() {
  openAddComment({ freeForm: true })
}

function openAddComment(options?: { moduleName?: string; freeForm?: boolean }) {
  const mod = (options?.moduleName || props.contextDefaultModule || 'BASIC') as string
  commentForm.moduleName = mod
  commentForm.description = ''
  commentDialogVisible.value = true
}

defineExpose({
  openAddComment,
  openNewComment
})

function closeNewComment() {
  if (submitting.value) return
  commentDialogVisible.value = false
}

async function submitComment() {
  if (submitting.value) return
  if (!commentForm.description.trim()) {
    ElMessage.warning('Please complete description')
    return
  }
  if (commentForm.description.trim().length > 1000) {
    ElMessage.warning('Description max 1000 characters')
    return
  }
  submitting.value = true
  try {
    await workflowApi.createComment(props.clientId, props.clientType, {
      moduleName: commentForm.moduleName,
      description: commentForm.description.trim()
    })
    ElMessage.success('Comment added')
    commentDialogVisible.value = false
    emit('changed')
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : ''
    ElMessage.error(msg || 'Failed to create comment')
  } finally {
    submitting.value = false
  }
}
</script>
