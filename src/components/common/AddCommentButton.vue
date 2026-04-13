<template>
  <button type="button" class="crm-add-comment-btn" @click="$emit('click', $event)">
    <span class="crm-add-comment-btn__icon" aria-hidden="true">
      <el-icon><Plus /></el-icon>
    </span>
    <span class="crm-add-comment-btn__text"><slot>Add Comment</slot></span>
  </button>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>
