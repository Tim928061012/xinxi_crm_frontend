<template>
  <button type="button" class="crm-document-upload-link-btn" @click="$emit('click', $event)">
    <span class="crm-document-upload-link-btn__icon" aria-hidden="true">
      <el-icon><Upload /></el-icon>
    </span>
    <span class="crm-document-upload-link-btn__text"><slot>Upload</slot></span>
  </button>
</template>

<script setup lang="ts">
import { Upload } from '@element-plus/icons-vue'

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>
