<template>
  <div class="user-layout">
    <!-- 左侧菜单栏 -->
    <aside class="sidebar">
      <div class="logo">
        <img :src="logoImage" alt="Logo" class="logo-icon" />
      </div>
      
      <nav class="sidebar-nav">
        <router-link
          :to="{ name: 'UserClient' }"
          class="nav-item"
          :class="{ active: activeMenu === '/user/client' || activeMenu.startsWith('/user/client/') }"
          @click="handleNavClick"
        >
          Client
        </router-link>
        <router-link
          :to="{ name: 'UserProfile' }"
          class="nav-item"
          :class="{ active: activeMenu === '/user/profile' }"
          @click="handleNavClick"
        >
          Profile
        </router-link>
        <div class="nav-item logout" @click="handleLogout">
          Log out
        </div>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
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

const activeMenu = computed(() => {
  const { path } = route
  return path
})

const handleNavClick = () => {
  // 确保导航正常工作，不需要额外处理
  // router-link 会自动处理导航
}

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
}

.sidebar {
  width: 200px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: none;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  
  .logo {
    /* 与 Admin 布局保持一致：Logo 区域增高一倍，Logo 居中、自适应放大 */
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-bottom: 1px solid #f0f0f5;
    
    .logo-icon {
      max-width: 180px;
      max-height: 120px;
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 20px 0;
    
    .nav-item {
      display: block;
      padding: 12px 20px;
      color: #606266;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s;
      border-left: 3px solid transparent;
      
      &:hover {
        background-color: #ecf5ff;
        color: #025189;
      }
      
      &.active {
        background-color: #ecf5ff;
        color: #025189;
        border-left-color: #025189;
        font-weight: 500;
      }
      
      &.logout {
        margin-top: auto;
        border-top: 1px solid #e4e7ed;
        padding-top: 20px;
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
// Logout confirm dialog styles (global, not scoped)
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

