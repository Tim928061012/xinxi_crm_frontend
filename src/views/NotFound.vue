<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const goHome = () => {
  // 根据用户角色重定向到不同页面
  const userRole = authStore.user?.role
  if (userRole === 'admin') {
    router.push('/account')
  } else {
    router.push('/tasks')
  }
}
</script>

<style lang="scss" scoped>
.not-found {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;

  .not-found-content {
    text-align: center;

    h1 {
      font-size: 120px;
      color: #025189;
      margin: 0;
      line-height: 1;
    }

    p {
      font-size: 20px;
      color: #606266;
      margin: 20px 0 40px;
    }
  }
}
</style>
