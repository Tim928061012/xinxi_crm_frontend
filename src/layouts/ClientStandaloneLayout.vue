<template>
  <div class="client-standalone-layout">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// v2：编辑 / 预览 / 审批 在独立标签页打开，无左侧菜单，仅承载客户详情页
</script>

<style lang="scss" scoped>
.client-standalone-layout {
  /* #app 为 100vh + overflow:hidden，本层需自成滚动容器，否则长页被裁切且无法滚动 */
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background-color: var(--crm-surface-page, #f5f5f5);
  -webkit-overflow-scrolling: touch;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
