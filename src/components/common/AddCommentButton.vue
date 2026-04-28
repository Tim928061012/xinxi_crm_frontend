<template>
  <button
    type="button"
    class="crm-add-comment-btn"
    :disabled="disabled"
    :aria-disabled="disabled ? 'true' : 'false'"
    @click="handleClick"
  >
    <span class="crm-add-comment-btn__icon" aria-hidden="true">
      <el-icon><CirclePlus /></el-icon>
    </span>
    <span class="crm-add-comment-btn__text"><slot>Comment</slot></span>
  </button>
</template>

<script setup lang="ts">
import { CirclePlus } from '@element-plus/icons-vue'

withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false
})

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function handleClick(ev: MouseEvent) {
  if ((ev.currentTarget as HTMLButtonElement | null)?.disabled) return
  emit('click', ev)
}
</script>
