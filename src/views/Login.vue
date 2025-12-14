<template>
  <div class="login-container">
    <div class="login-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <img :src="logoImage" alt="XinXi CRM" class="logo-image" @error="handleImageError" />
      </div>

      <!-- 登录表单区域 -->
      <div class="login-form-section">
        <!-- 标签页 -->
        <div class="tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'employee' }"
            @click="activeTab = 'employee'"
          >
            Employee
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'administrator' }"
            @click="activeTab = 'administrator'"
          >
            Administrator
          </div>
        </div>

        <!-- 表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="Account / Username"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Password"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              Login
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>XinXi Consulting (Hong kong) Limited</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import logoImage from '@/assets/login_logo.png'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const activeTab = ref<'employee' | 'administrator'>('employee')

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入账号/用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleImageError = (event: Event) => {
  // 图片加载失败时的处理，隐藏图片避免显示破损图标
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      try {
        // 根据选中的标签页确定角色
        const role = activeTab.value === 'administrator' ? 'admin' : 'user'
        const result = await authStore.login(loginForm, role)

        if (result.success) {
          ElMessage.success('Login successful')

          // 重定向到之前访问的页面或根据角色重定向到默认页面
          const redirect = route.query.redirect as string
          if (redirect) {
            router.push(redirect)
          } else {
            // 根据角色重定向到不同页面
            const role = activeTab.value === 'administrator' ? 'admin' : 'user'
            if (role === 'admin') {
              router.push('/account')
            } else {
              router.push('/user/client')
            }
          }
        } else {
          // 只在这里显示错误消息，避免重复提示
          ElMessage.error(result.message || 'Login failed')
        }
      } catch (error: any) {
        // 只有在 authStore.login 抛出异常时才显示错误（这种情况不应该发生，因为 login 已经处理了错误）
        // 但为了安全起见，保留这个 catch
        if (!error.handled) {
          ElMessage.error(error.message || 'Login failed, please try again')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  background: #F0F4F8;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 20px;
  overflow: auto;
}

.login-content {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// Logo区域
.logo-section {
  text-align: center;
  margin-bottom: 40px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .logo-image {
    max-width: 300px;
    height: auto;
    display: block;
  }
}

// 登录表单区域
.login-form-section {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 30px 35px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

// 标签页
.tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 1px solid #E4E7ED;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 14px 0;
    font-size: 16px;
    color: #909399;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    font-weight: 400;

    &:hover {
      color: #1E3A5F;
    }

    &.active {
      color: #1E3A5F;
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #1E3A5F;
        border-radius: 1px;
      }
    }
  }
}

// 表单样式
.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 4px;
    box-shadow: 0 0 0 1px #E4E7ED inset;
    background-color: #fff;

    &:hover {
      box-shadow: 0 0 0 1px #C0C4CC inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #1E3A5F inset;
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
  }

  .login-button {
    width: 100%;
    height: 44px;
    background: #1E3A5F;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-top: 10px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #2A4A6F;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(30, 58, 95, 0.2);
    }

    &:active:not(:disabled) {
      background: #152A45;
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// 页脚
.footer {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  text-align: center;
  width: 100%;

  p {
    font-size: 12px;
    color: #909399;
    margin: 0;
    letter-spacing: 0.2px;
  }
}
</style>
