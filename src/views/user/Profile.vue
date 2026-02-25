<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1 class="page-title">Profile</h1>

      <!-- Account Information Section -->
      <div class="section">
        <h2 class="section-title">Account</h2>
        <div class="info-form">
          <div class="info-row">
            <label class="info-label">Account</label>
            <div class="info-value">{{ userInfo.account || userInfo.username || '-' }}</div>
          </div>
          <div class="info-row">
            <label class="info-label">First Name</label>
            <div class="info-value">{{ userInfo.firstName || '-' }}</div>
          </div>
          <div class="info-row">
            <label class="info-label">Last Name</label>
            <div class="info-value">{{ userInfo.lastName || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="section">
        <h2 class="section-title">Change Password</h2>
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="180px"
          class="password-form"
        >
          <el-form-item label="Current Password" prop="currentPassword">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="Please enter current password"
              show-password
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="New Password" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Please enter new password"
              show-password
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="Confirm Password" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="Please confirm new password"
              show-password
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleChangePassword" :loading="submitting">
              Submit
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authApi, type UserInfo, type ChangePasswordParams } from '@/api/auth'

const authStore = useAuthStore()
const passwordFormRef = ref<FormInstance>()
const submitting = ref(false)
const userInfo = ref<UserInfo>({
  id: '',
  username: '',
  name: '',
  role: 'user',
  email: '',
  account: '',
  firstName: '',
  lastName: ''
})

const passwordForm = reactive<ChangePasswordParams>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('Please confirm new password'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: 'Please enter current password', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { min: 6, max: 20, message: 'Password length should be between 6 and 20 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm new password', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await authApi.getMe()
    const data = response.data || response
    userInfo.value = {
      id: data.id || data.userId || '',
      username: data.username || data.account || '',
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || '',
      role: data.role || 'user',
      email: data.email || '',
      avatar: data.avatar,
      account: data.account || data.username || '',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || ''
    }
    
    // 更新 authStore 中的用户信息
    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        ...userInfo.value
      }
    }
  } catch (error: any) {
    console.error('Failed to load user info:', error)
    // 如果获取失败，使用 store 中的用户信息
    if (authStore.user) {
      userInfo.value = {
        id: authStore.user.id,
        username: authStore.user.username,
        name: authStore.user.name,
        role: authStore.user.role,
        email: authStore.user.email,
        avatar: authStore.user.avatar,
        account: authStore.user.username,
        firstName: '',
        lastName: ''
      }
    }
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await authApi.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
        ElMessage.success('Password changed successfully')
        // 清空表单
        passwordFormRef.value.resetFields()
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch (error: any) {
        console.error('Failed to change password:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to change password'
        ElMessage.error(errorMessage)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
  width: 100%;

  .profile-container {
    max-width: 1200px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 4px;
    padding: 30px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #025189; // 一级标题使用蓝色
      margin: 0 0 30px 0;
      padding-bottom: 15px;
      border-bottom: 1px solid #ebeef5;
    }

    .section {
      margin-bottom: 40px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 20px 0;
        padding-bottom: 10px;
        padding-left: 20px; // 二级标题缩进，与一级标题对齐
        border-bottom: 1px solid #ebeef5;
      }

      .info-form {
        max-width: 600px;

        .info-row {
          display: flex;
          align-items: center;
          margin-bottom: 22px;
          min-height: 32px;

          &:last-child {
            margin-bottom: 0;
          }

          .info-label {
            font-size: 14px;
            color: #606266;
            font-weight: 500;
            width: 180px;
            text-align: right;
            flex-shrink: 0;
            padding-right: 18px;
            box-sizing: border-box;
            line-height: 32px;
          }

          .info-value {
            font-size: 14px;
            color: #303133;
            flex: 1;
            line-height: 32px;
          }
        }
      }

      .password-form {
        max-width: 600px;

        :deep(.el-form-item) {
          margin-bottom: 22px;
        }

        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #606266;
          width: 180px;
          padding-right: 18px;
          box-sizing: border-box;
          text-align: right;
          line-height: 32px;
          pointer-events: none !important; // 禁用 label 的点击聚焦行为
          cursor: default !important; // 将鼠标指针改为默认样式
        }

        :deep(.el-button) {
          padding: 10px 30px;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
