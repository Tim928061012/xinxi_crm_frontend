<template>
  <button type="button" class="crm-bulk-download-btn" @click="$emit('click', $event)">
    <span class="crm-bulk-download-btn__icon" aria-hidden="true">
      <el-icon><Download /></el-icon>
    </span>
    <span class="crm-bulk-download-btn__text"><slot>Download</slot></span>
  </button>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>
