<template>
  <el-dialog
    :model-value="commentDialogVisible"
    title="Add Comment"
    width="560px"
    append-to-body
    @close="closeNewComment"
  >
    <el-form :model="commentForm" label-width="110px">
      <el-form-item label="Module">
        <el-select v-model="commentForm.moduleName" style="width: 100%">
          <el-option v-for="module in modules" :key="module.value" :label="module.label" :value="module.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Title">
        <el-input v-model="commentForm.title" maxlength="50" show-word-limit placeholder="Please enter title" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input
          v-model="commentForm.description"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          placeholder="Please enter description"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeNewComment">Cancel</el-button>
      <el-button type="primary" @click="submitComment">Submit</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { workflowApi, type ClientType } from '@/api/user/workflow'
import { COMMENT_MODULE_OPTIONS, getCommentModuleLabel } from '@/utils/comment-modules'

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
const commentForm = reactive({
  moduleName: 'BASIC',
  title: '',
  description: ''
})

/** 自由添加：title 初始为空 */
function openNewComment() {
  openAddComment({ freeForm: true })
}

function openAddComment(options?: { moduleName?: string; presetTitle?: string; freeForm?: boolean }) {
  const mod = (options?.moduleName || props.contextDefaultModule || 'BASIC') as string
  commentForm.moduleName = mod
  if (options?.freeForm) {
    commentForm.title = ''
  } else {
    commentForm.title = options?.presetTitle ?? (getCommentModuleLabel(mod) || mod)
  }
  commentForm.description = ''
  commentDialogVisible.value = true
}

defineExpose({
  openAddComment,
  openNewComment
})

function closeNewComment() {
  commentDialogVisible.value = false
}

async function submitComment() {
  if (!commentForm.title.trim() || !commentForm.description.trim()) {
    ElMessage.warning('Please complete title and description')
    return
  }
  if (commentForm.title.trim().length > 50 || commentForm.description.trim().length > 1000) {
    ElMessage.warning('Title max 50 characters, description max 1000')
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
    emit('changed')
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : ''
    ElMessage.error(msg || 'Failed to create comment')
  }
}
</script>
