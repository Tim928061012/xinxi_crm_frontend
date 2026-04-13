<template>
  <div class="comments-sidebar" :class="{ 'comments-sidebar--collapsed': collapsed }">
    <!-- 收起态：窄条，点击展开（文档：评论为 0 时不出现展开入口 — 由父级 v-if 控制是否渲染本组件） -->
    <button
      v-if="collapsed"
      type="button"
      class="comments-sidebar__expand-strip"
      aria-label="Expand comments"
      @click="emit('update:collapsed', false)"
    >
      <el-icon class="chev"><DArrowLeft /></el-icon>
      <span class="v-label">Comments</span>
    </button>

    <div v-else class="comments-sidebar__expanded">
      <div class="comments-sidebar__head">
        <span class="head-title">Comments</span>
        <el-button text circle type="primary" aria-label="Collapse comments" @click="emit('update:collapsed', true)">
          <el-icon><DArrowRight /></el-icon>
        </el-button>
      </div>

      <div v-loading="loading" class="comments-sidebar__scroll-wrap">
        <el-scrollbar class="comments-sidebar__scrollbar">
          <div v-if="!comments.length" class="empty-mini">No comments yet</div>
          <div v-else class="sidebar-comment-list">
            <div v-for="comment in comments" :key="comment.commentId" class="sidebar-card">
              <div class="sidebar-card__title">{{ comment.title || 'Comment' }}</div>
              <div class="sidebar-card__meta">
                <span>{{ comment.createdByName || '-' }}</span>
                <el-tag v-if="comment.moduleName" size="small" effect="plain">{{ comment.moduleName }}</el-tag>
              </div>
              <div class="sidebar-card__body">{{ comment.description }}</div>
              <div v-if="comment.replies?.length" class="sidebar-replies">
                <div v-for="reply in comment.replies" :key="reply.commentId" class="sidebar-reply">
                  <div class="sidebar-reply__meta">
                    {{ reply.createdByName || '-' }} · {{ formatDateTime(reply.createdAt) }}
                  </div>
                  <div class="sidebar-reply__body">{{ reply.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <div class="comments-sidebar__foot">
        <el-button type="primary" link @click="emit('open-comments-tab')"> Open full Comments tab </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import { workflowApi, type ClientComment, type ClientType } from '@/api/user/workflow'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  clientId: number
  clientType: ClientType
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
  (e: 'open-comments-tab'): void
  (e: 'count-updated', total: number): void
}>()

const loading = ref(false)
const comments = ref<ClientComment[]>([])

function countTotal(list: ClientComment[]): number {
  let n = 0
  for (const c of list) {
    n += 1
    if (c.replies?.length) n += c.replies.length
  }
  return n
}

const loadComments = async () => {
  loading.value = true
  try {
    const response = await workflowApi.getComments(props.clientId, props.clientType)
    const list = (response as any).data || response || []
    comments.value = list
    emit('count-updated', countTotal(list))
  } catch {
    comments.value = []
    emit('count-updated', 0)
  } finally {
    loading.value = false
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
.comments-sidebar {
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
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
  color: #025189;
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
  padding: 10px 10px 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  .head-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
}

.comments-sidebar__scroll-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.comments-sidebar__scrollbar {
  height: 100%;
  padding: 0 8px 8px;
  box-sizing: border-box;
}

.comments-sidebar__scrollbar :deep(.el-scrollbar__wrap) {
  max-height: calc(100vh - 200px);
}

.empty-mini {
  padding: 24px 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.sidebar-comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 8px;
}

.sidebar-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafbfc;
}

.sidebar-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.35;
}

.sidebar-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
}

.sidebar-card__body {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.sidebar-replies {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-reply {
  padding: 6px 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f2f5;
}

.sidebar-reply__meta {
  font-size: 10px;
  color: #a0a4aa;
  margin-bottom: 4px;
}

.sidebar-reply__body {
  font-size: 11px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
}

.comments-sidebar__foot {
  flex-shrink: 0;
  padding: 8px 12px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
</style>
