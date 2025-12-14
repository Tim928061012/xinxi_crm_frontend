<template>
  <div class="main-layout">
    <!-- 左侧菜单栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">❤️</div>
        <span class="logo-text">XinXi CRM</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link
          to="/account"
          class="nav-item"
          :class="{ active: activeMenu === '/account' }"
        >
          Account
        </router-link>
        <router-link
          to="/client"
          class="nav-item"
          :class="{ active: activeMenu === '/client' }"
        >
          Client
        </router-link>
        <router-link
          to="/introducer"
          class="nav-item"
          :class="{ active: activeMenu === '/introducer' }"
        >
          Introducer
        </router-link>
        <router-link
          to="/bank-centre"
          class="nav-item"
          :class="{ active: activeMenu === '/bank-centre' }"
        >
          Bank & Centre
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
import { computed, onMounted } from 'vue'
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

// 检查用户角色，如果是普通用户，重定向到用户页面
onMounted(() => {
  if (authStore.user?.role === 'user') {
    router.replace('/user/client')
  }
})

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
.main-layout {
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
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 20px;
    border-bottom: 1px solid #e4e7ed;
    
    .logo-icon {
      width: 24px;
      height: 24px;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-text {
      font-size: 16px;
      font-weight: 600;
      color: #409eff;
    }
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    
    .nav-item {
      display: block;
      padding: 12px 20px;
      color: #606266;
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      
      &:hover {
        background-color: #f0f0f0;
      }
      
      &.active {
        background-color: #e6f4ff;
        color: #409eff;
        
        &::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #409eff;
        }
      }
      
      &.logout {
        margin-top: auto;
        color: #606266;
        
        &:hover {
          background-color: #f0f0f0;
        }
      }
    }
  }
}

.main-content {
  flex: 1;
  background-color: #f5f5f5;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0;
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
