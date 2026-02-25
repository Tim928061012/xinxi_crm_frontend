<template>
  <div class="account-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <el-button type="primary" @click="handleNewAccount">
        <el-icon><Plus /></el-icon>
        New Account
      </el-button>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.username || authStore.user?.account || 'admin' }}</span>
      </div>
    </div>

    <!-- 账户表格 -->
    <div class="table-wrapper">
      <el-table
        :data="accountList"
        stripe
        class="account-table"
        style="width: 100%"
      >
      <el-table-column prop="account" label="Account" width="180" />
      <el-table-column prop="name" label="Name" width="200" />
      <el-table-column label="Created Time" width="200">
        <template #default="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
      </el-table-column>
      <el-table-column label="Status" width="150">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 8px;">
            <!-- admin 账号状态开关置灰不可修改 -->
            <el-switch
              v-model="row.isActive"
              :active-value="true"
              :inactive-value="false"
              :disabled="row.account === 'admin' || row.role === 'Admin' || row.role === 'admin'"
              @change="handleStatusChange(row)"
            />
            <span
              :style="{
                color:
                  row.account === 'admin' || row.role === 'Admin' || row.role === 'admin'
                    ? '#909399'
                    : row.isActive
                      ? '#67c23a'
                      : '#909399'
              }"
            >
              {{ row.isActive ? 'enabled' : 'disabled' }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <!-- Admin 账号不允许 Edit，只允许 Reset Password -->
          <template v-if="row.account !== 'admin' && row.role !== 'Admin' && row.role !== 'admin'">
            <el-link type="primary" @click="handleEdit(row)" :underline="false">
              Edit
            </el-link>
            <el-divider direction="vertical" />
          </template>
          <el-link type="primary" @click="handleResetPassword(row)" :underline="false">
            Reset Password
          </el-link>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <!-- 新建账户模态框 -->
    <el-dialog
      v-model="newAccountDialogVisible"
      title="New Account"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="newAccountFormRef"
        :model="newAccountForm"
        :rules="accountFormRules"
        label-width="120px"
      >
        <el-form-item label="Account" prop="account" required>
          <el-input v-model="newAccountForm.account" placeholder="Please enter account" />
        </el-form-item>
        <el-form-item label="First Name" prop="firstName" required>
          <el-input v-model="newAccountForm.firstName" placeholder="Please enter first name" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName" required>
          <el-input v-model="newAccountForm.lastName" placeholder="Please enter last name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newAccountDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitNewAccount">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 编辑账户模态框 -->
    <el-dialog
      v-model="editAccountDialogVisible"
      title="Edit Account"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editAccountFormRef"
        :model="editAccountForm"
        :rules="accountFormRules"
        label-width="120px"
      >
        <el-form-item label="Account" prop="account" required>
          <el-input v-model="editAccountForm.account" disabled />
        </el-form-item>
        <el-form-item label="First Name" prop="firstName" required>
          <el-input v-model="editAccountForm.firstName" placeholder="Please enter first name" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName" required>
          <el-input v-model="editAccountForm.lastName" placeholder="Please enter last name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editAccountDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitEditAccount">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { accountApi, type Account, type CreateAccountParams, type UpdateAccountParams } from '@/api/account'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const authStore = useAuthStore()

const accountList = ref<Account[]>([])
const newAccountDialogVisible = ref(false)
const editAccountDialogVisible = ref(false)
const newAccountFormRef = ref<FormInstance>()
const editAccountFormRef = ref<FormInstance>()

const newAccountForm = reactive<CreateAccountParams>({
  account: '',
  firstName: '',
  lastName: ''
})

const editAccountForm = reactive<UpdateAccountParams & { account: string; id?: number }>({
  account: '',
  firstName: '',
  lastName: ''
})

const accountFormRules: FormRules = {
  account: [
    { required: true, message: 'Please enter account', trigger: 'blur' }
  ],
  firstName: [
    { required: true, message: 'Please enter first name', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Please enter last name', trigger: 'blur' }
  ]
}

// 加载账户列表
const loadAccounts = async () => {
  try {
    const response = await accountApi.getAccounts()
    const data = response.data || response || []
    // 转换数据格式，将后端返回的数据转换为前端需要的格式
    // 后端返回 username，前端使用 account 显示
    accountList.value = data.map((item: any) => {
      const firstName = item.firstName || item.first_name || ''
      const lastName = item.lastName || item.last_name || ''
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true || item.active === 'true'
      // 使用 userId 字段，如果没有则使用 id
      const userId = item.userId || item.user_id || item.id
      const isAdmin = (item.username || item.account || '') === 'admin' || item.role === 'Admin' || item.role === 'admin'
      
      return {
        id: userId, // 使用 userId 作为 id
        userId: userId, // 同时保存 userId 字段
        account: item.username || item.account || '', // 后端返回 username，映射到前端的 account
        firstName: firstName,
        lastName: lastName,
        // Admin 账号 Name 固定为 "System Administrator"，不可编辑
        // 其他账号：两个都有 -> "firstName, lastName"，只有一个 -> 只显示该字段，避免多余逗号
        name: isAdmin ? 'System Administrator' : (firstName && lastName ? `${firstName}, ${lastName}` : (firstName || lastName || '')),
        role: item.role || item.userRole || '', // 后端返回的角色，用于判断是否为 admin
        isActive: isActive, // 后端返回的 isActive 字段
        status: isActive ? 'enabled' : 'disabled', // 前端显示用的状态
        createdTime: item.createdAt || item.created_at || item.createdTime || item.created_time || item.createTime || ''
      }
    })
  } catch (error) {
    console.error('Failed to load account list:', error)
    // 登录态失效（401）时，全局拦截器已经提示并跳转，这里不再额外提示
    if (!(error as any)?.isAuthError && (error as any)?.response?.status !== 401) {
      ElMessage.error('Failed to load account list')
    }
    accountList.value = []
  }
}

// 新建账户
const handleNewAccount = () => {
  newAccountForm.account = ''
  newAccountForm.firstName = ''
  newAccountForm.lastName = ''
  newAccountDialogVisible.value = true
}

// 提交新建账户
const handleSubmitNewAccount = async () => {
  if (!newAccountFormRef.value) return
  
  await newAccountFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await accountApi.createAccount(newAccountForm)
        ElMessage.success('Account created successfully')
        newAccountDialogVisible.value = false
        loadAccounts()
      } catch (error: any) {
        console.error('Failed to create account:', error)
        // 优先使用 error.message（来自响应拦截器），然后是 error.response?.data?.message，最后是默认消息
        const errorMessage = error.message || error.response?.data?.message || 'Failed to create account'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 编辑账户
const handleEdit = (row: Account) => {
  // 使用 userId 字段，如果没有则使用 id
  const userId = (row as any).userId || row.id
  editAccountForm.id = userId
  editAccountForm.account = row.account
  editAccountForm.firstName = row.firstName
  editAccountForm.lastName = row.lastName
  editAccountDialogVisible.value = true
}

// 提交编辑账户
const handleSubmitEditAccount = async () => {
  if (!editAccountFormRef.value || !editAccountForm.id) return
  
  await editAccountFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await accountApi.updateAccount(editAccountForm.id, {
          firstName: editAccountForm.firstName,
          lastName: editAccountForm.lastName
        })
        ElMessage.success('Account updated successfully')
        editAccountDialogVisible.value = false
        loadAccounts()
      } catch (error: any) {
        console.error('Failed to update account:', error)
        // 优先使用 error.message（来自响应拦截器），然后是 error.response?.data?.message，最后是默认消息
        const errorMessage = error.message || error.response?.data?.message || 'Failed to update account'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 状态切换
const handleStatusChange = async (row: Account) => {
  // 超级管理员账号状态不允许修改，直接还原并提示
  if (row.account === 'admin' || (row as any).role === 'Admin' || (row as any).role === 'admin') {
    row.isActive = true
    row.status = 'enabled'
    ElMessage.warning('超级管理员的状态不允许修改为不可用')
    return
  }

  const originalIsActive = row.isActive
  // 使用 userId 字段，如果没有则使用 id
  const userId = (row as any).userId || row.id
  if (!userId) {
    ElMessage.error('User ID does not exist, cannot update status')
    row.isActive = originalIsActive
    return
  }
  
  try {
    await accountApi.updateAccountStatus(userId, row.isActive)
    // 更新状态显示
    row.status = row.isActive ? 'enabled' : 'disabled'
    ElMessage.success(`Account ${row.isActive ? 'enabled' : 'disabled'}`)
  } catch (error: any) {
    console.error('Failed to update account status:', error)
    // 优先使用 error.message（来自响应拦截器），然后是 error.response?.data?.message，最后是默认消息
    const errorMessage = error.message || error.response?.data?.message || 'Failed to update account status'
    ElMessage.error(errorMessage)
    // 恢复原状态
    row.isActive = originalIsActive
    row.status = originalIsActive ? 'enabled' : 'disabled'
  }
}

// 重置密码
const handleResetPassword = async (row: Account) => {
  // 使用 userId 字段，如果没有则使用 id
  const userId = (row as any).userId || row.id
  if (!userId) {
    ElMessage.error('User ID does not exist, cannot reset password')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to reset the password for account ${row.account}?`,
      'Confirm',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await accountApi.resetPassword(userId)
    ElMessage.success('Password reset successfully')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to reset password:', error)
      // 优先使用 error.message（来自响应拦截器），然后是 error.response?.data?.message，最后是默认消息
      const errorMessage = error.message || error.response?.data?.message || 'Failed to reset password'
      ElMessage.error(errorMessage)
    }
  }
}

// 监听路由变化，当路由切换到当前页面时刷新数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/account') {
      loadAccounts()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(() => {
  loadAccounts()
})

onMounted(() => {
  loadAccounts()
})
</script>

<style lang="scss" scoped>
.account-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  position: relative;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0;
    width: 100%;
    box-sizing: border-box;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;
      padding: 0;
      margin: 0;

      :deep(.el-icon) {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #d9dde3;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5a6473;
      }
    }
  }

  .table-wrapper {
    width: 100%;
    flex: 1;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
  }

  .account-table {
    background-color: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;

    :deep(.el-table) {
      width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-table__inner-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
    }

    :deep(.el-table__header-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
      
      .el-table__header {
        width: 100% !important;
        background-color: #025189;
        color: #fff;
        box-sizing: border-box;

        th {
          background-color: #025189 !important;
          color: #fff !important;
          border: none;
          font-weight: 500;
          padding: 12px 0;
          box-sizing: border-box;
        }
      }
    }

    :deep(.el-table__body-wrapper) {
      width: 100% !important;
      box-sizing: border-box;
      
      .el-table__body {
        width: 100% !important;
        box-sizing: border-box;
        
        tr {
          background-color: #fff;
          width: 100% !important;
          box-sizing: border-box;
          
          &:hover {
            background-color: #f5f7fa;
          }
          
          td {
            padding: 12px 0;
            border-bottom: 1px solid #ebeef5;
            box-sizing: border-box;
          }
        }
      }
    }

    :deep(.el-table__row--striped) {
      background-color: #fafafa;
    }

    :deep(.el-link) {
      font-size: 14px;
      margin-right: 8px;
    }

    :deep(.el-divider--vertical) {
      margin: 0 8px;
      height: 14px;
    }
  }
}

:deep(.el-dialog) {
  border-radius: 4px;

  .el-dialog__header {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #e4e7ed;
    position: relative;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      top: 20px;
      right: 20px;
    }
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-form-item {
    margin-bottom: 20px;

    .el-form-item__label {
      &::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
      pointer-events: none !important; // 禁用 label 的点击聚焦行为
      cursor: default !important; // 将鼠标指针改为默认样式
    }

    .el-input__wrapper {
      border-radius: 4px;
    }
  }

  .el-dialog__footer {
    padding: 10px 20px 20px;
    border-top: 1px solid #e4e7ed;

    .el-button {
      padding: 10px 20px;
      border-radius: 4px;
    }
  }
}
</style>

