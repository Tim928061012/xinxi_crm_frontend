<template>
  <div class="user-layout">
    <aside class="sidebar">
      <div class="logo">
        <img :src="logoImage" alt="XinXi CRM" class="logo-icon" />
      </div>

      <p class="sidebar-section-label">Workspace</p>

      <nav class="sidebar-nav">
        <router-link
          :to="{ name: 'UserClient' }"
          class="nav-item"
          :class="{ active: isClientActive }"
        >
          <el-icon class="nav-icon"><Document /></el-icon>
          <span>Clients</span>
        </router-link>
        <router-link
          :to="{ name: 'UserProfile' }"
          class="nav-item"
          :class="{ active: activeMenu === '/user/profile' }"
        >
          <el-icon class="nav-icon"><User /></el-icon>
          <span>Profile</span>
        </router-link>

        <div class="nav-spacer" />

        <p class="sidebar-foot">RM / ARM workflow</p>

        <div class="nav-item logout" @click="handleLogout">
          <el-icon class="nav-icon"><SwitchButton /></el-icon>
          <span>Log out</span>
        </div>
      </nav>
    </aside>

    <div class="workspace">
      <header class="app-header">
        <div class="header-titles">
          <h1 class="header-title">{{ routeTitle }}</h1>
          <p v-if="routeSubtitle" class="header-subtitle">{{ routeSubtitle }}</p>
        </div>
        <div class="header-user">
          <div class="user-chip">
            <el-icon class="user-chip-icon"><User /></el-icon>
            <div class="user-chip-text">
              <span class="user-name">{{ displayName }}</span>
              <span v-if="roleLabel" class="user-role">{{ roleLabel }}</span>
            </div>
          </div>
        </div>
      </header>

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
import { Document, User, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import logoImage from '@/assets/simple_logo.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const isClientActive = computed(
  () => activeMenu.value === '/user/client' || activeMenu.value.startsWith('/user/client/')
)

const routeTitle = computed(() => {
  switch (route.name) {
    case 'UserClient':
      return 'Client Management'
    case 'UserProfile':
      return 'Profile'
    case 'UserClientNew':
      return 'New Client'
    case 'UserClientView':
      return 'Client Detail'
    case 'UserClientEdit':
      return 'Edit Client'
    default:
      return (route.meta?.title as string) || 'XinXi CRM'
  }
})

const routeSubtitle = computed(() => {
  if (route.name === 'UserClient') {
    return 'RM / ARM · 审批流程与进度'
  }
  if (String(route.name || '').startsWith('UserClient')) {
    return 'KYC · workflow'
  }
  return ''
})

const displayName = computed(
  () => authStore.user?.name || authStore.user?.username || authStore.user?.account || 'User'
)

const roleLabel = computed(() => authStore.user?.roleDisplayName || '')

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
  width: 228px;
  flex-shrink: 0;
  background-color: var(--crm-sidebar-bg);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--crm-sidebar-border);
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.04);

  .logo {
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;

    .logo-icon {
      max-width: 168px;
      max-height: 100px;
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  .sidebar-section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--crm-text-muted);
    padding: 0 20px 8px;
    margin: 0;
  }

  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 12px 16px;
    min-height: 0;

    .nav-spacer {
      flex: 1;
      min-height: 12px;
    }

    .sidebar-foot {
      font-size: 11px;
      line-height: 1.4;
      color: #94a3b8;
      padding: 8px 8px 12px;
      margin: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      margin-bottom: 4px;
      color: var(--crm-text-secondary);
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      border-radius: var(--crm-radius-md);
      border-left: 3px solid transparent;

      .nav-icon {
        font-size: 18px;
      }

      &:hover {
        background-color: #f0f7ff;
        color: var(--crm-primary);
      }

      &.active {
        background-color: #e8f1fb;
        color: var(--crm-primary);
        border-left-color: var(--crm-primary);
        font-weight: 600;
      }

      &.logout {
        margin-top: 0;
        border-top: 1px solid var(--crm-sidebar-border);
        padding-top: 14px;
        border-radius: 0;
        border-left: none;

        &:hover {
          background-color: #fef2f2;
          color: #b91c1c;
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

.app-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  background: var(--crm-header-bg);
  border-bottom: 1px solid var(--crm-header-border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);

  .header-titles {
    min-width: 0;
  }

  .header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--crm-text-primary);
    letter-spacing: -0.02em;
    line-height: 1.25;
  }

  .header-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--crm-text-muted);
    font-weight: 400;
  }

  .header-user {
    flex-shrink: 0;
  }

  .user-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
  }

  .user-chip-icon {
    width: 34px;
    height: 34px;
    padding: 7px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #475569;
    box-sizing: border-box;
  }

  .user-chip-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .user-role {
    font-size: 12px;
    color: var(--crm-text-muted);
    margin-top: 2px;
  }
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
