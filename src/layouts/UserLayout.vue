<template>
  <div class="user-layout">
    <aside class="sidebar">
      <div class="logo">
        <img :src="logoImage" alt="XinXi CRM" class="logo-icon" />
      </div>

      <nav class="sidebar-nav">
        <router-link
          :to="{ name: 'UserClient' }"
          class="nav-item"
          :class="{ active: isClientActive }"
        >
          <span>Client</span>
        </router-link>
        <router-link
          :to="{ name: 'UserProfile' }"
          class="nav-item"
          :class="{ active: activeMenu === '/user/profile' }"
        >
          <span>Profile</span>
        </router-link>

        <div class="nav-spacer" />

        <div class="nav-item logout" @click="handleLogout">
          <span>Log out</span>
        </div>
      </nav>
    </aside>

    <div class="workspace">
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import logoImage from '@/assets/simple_logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const isClientActive = computed(
  () => activeMenu.value === '/user/client' || activeMenu.value.startsWith('/user/client/')
)

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('Are you sure you want to log out?', 'Confirm', {
      confirmButtonText: 'Log out',
      cancelButtonText: 'Cancel',
      type: 'warning',
      customClass: 'logout-confirm-dialog',
      confirmButtonClass: 'logout-confirm-button'
    })

    await authStore.logout()
    router.push('/login')
  } catch {
    // User cancelled
  }
}
</script>

<style lang="scss" scoped>
.user-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--crm-surface-page);
}

.sidebar {
  width: 150px;
  flex-shrink: 0;
  background-color: var(--crm-sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--crm-sidebar-border);
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.04);

  .logo {
    height: 152px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;

    .logo-icon {
      max-width: 92px;
      max-height: 108px;
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 0 16px;
    min-height: 0;

    .nav-spacer {
      flex: 1;
      min-height: 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 11px 20px;
      margin-bottom: 0;
      color: #111827;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      border-radius: 0;
      border-right: 2px solid transparent;
      font-size: 14px;
      line-height: 1.4;

      &:hover {
        background-color: #eef4fa;
        color: #025189;
      }

      &.active {
        background-color: #d9e8f5;
        color: #025189;
        border-right-color: #025189;
        font-weight: 600;
      }

      &.logout {
        margin-top: 0;
        border-top: none;
        padding-top: 11px;
        border-radius: 0;
        border-right: none;

        &:hover {
          background-color: #f3f4f6;
          color: #111827;
        }
      }
    }
  }
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  background-color: var(--crm-surface-page);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.logout-confirm-dialog {
  .el-message-box__btns {
    .el-button--primary {
      background-color: #f5222d !important;
      border-color: #f5222d !important;
      color: #fff !important;

      &:hover {
        background-color: #ff4d4f !important;
        border-color: #ff4d4f !important;
      }

      &:active {
        background-color: #cf1322 !important;
        border-color: #cf1322 !important;
      }
    }
  }
}
</style>
