<template>
  <div class="user-layout">
    <!-- 左侧菜单栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">❤️</div>
        <span class="logo-text">XinXi CRM</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link
          to="/user/client"
          class="nav-item"
          :class="{ active: activeMenu === '/user/client' || activeMenu.startsWith('/user/client/') }"
        >
          Client
        </router-link>
        <router-link
          to="/user/profile"
          class="nav-item"
          :class="{ active: activeMenu === '/user/profile' }"
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => {
  const { path } = route
  return path
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('Are you sure you want to log out?', 'Confirm', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
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
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  
  .logo {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    
    .logo-icon {
      font-size: 24px;
      margin-right: 8px;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
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
        color: #409eff;
      }
      
      &.active {
        background-color: #ecf5ff;
        color: #409eff;
        border-left-color: #409eff;
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

