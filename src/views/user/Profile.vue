<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8">
        <el-card>
          <div class="profile-header">
            <el-avatar :size="100" :src="userInfo.avatar">
              {{ userInfo.name?.charAt(0) }}
            </el-avatar>
            <h2>{{ userInfo.name }}</h2>
            <p>{{ userInfo.email }}</p>
            <el-tag :type="userInfo.role === 'admin' ? 'danger' : ''">
              {{ userInfo.role === 'admin' ? '超级管理员' : '普通用户' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="16">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profileForm.name" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profileForm.phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdateProfile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const userInfo = computed(() => authStore.user || {
  id: '',
  username: '',
  name: '',
  email: '',
  role: 'user',
  avatar: ''
})

const profileForm = reactive({
  username: '',
  name: '',
  email: '',
  phone: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const profileRules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

onMounted(() => {
  loadProfile()
})

const loadProfile = () => {
  profileForm.username = userInfo.value.username
  profileForm.name = userInfo.value.name
  profileForm.email = userInfo.value.email
  profileForm.phone = '' // TODO: 从接口获取
}

const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用接口更新个人信息
        // await userApi.updateProfile(profileForm)
        ElMessage.success('更新成功')
        // 更新store中的用户信息
        // await authStore.fetchUserInfo()
      } catch (error) {
        ElMessage.error('更新失败')
      }
    }
  })
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // TODO: 调用接口修改密码
        // await userApi.changePassword({
        //   oldPassword: passwordForm.oldPassword,
        //   newPassword: passwordForm.newPassword
        // })
        ElMessage.success('密码修改成功，请重新登录')
        // 清空表单
        passwordFormRef.value.resetFields()
        // 可选：登出并跳转到登录页
        // await authStore.logout()
        // router.push('/login')
      } catch (error) {
        ElMessage.error('密码修改失败')
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.profile-page {
  .profile-header {
    text-align: center;
    padding: 20px 0;
    
    h2 {
      margin: 15px 0 5px;
      font-size: 20px;
      color: #303133;
    }
    
    p {
      margin: 5px 0 15px;
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
