<template>
  <div class="account-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <el-button type="primary" @click="handleNewAccount">
        <el-icon><Plus /></el-icon>
        New Account
      </el-button>
      <div class="user-info">
        <span>{{ authStore.user?.username || authStore.user?.account || 'admin' }}</span>
        <span v-if="authStore.user?.roleDisplayName || authStore.user?.role" class="user-role-pill">
          {{ authStore.user?.roleDisplayName || roleDisplayName(authStore.user?.role) }}
        </span>
      </div>
    </div>

    <!-- 账户表格 -->
    <div class="table-wrapper">
      <el-table
        :data="accountList"
        class="account-table"
        style="width: 100%"
        :row-style="crmTableRowStyle"
        :cell-style="crmTableCellStyle"
      >
      <el-table-column prop="account" label="Account" width="190" />
      <el-table-column prop="name" label="Name" width="230" />
      <el-table-column label="Role" width="130">
        <template #default="{ row }">
          {{ roleDisplayName(row.role) }}
        </template>
      </el-table-column>
      <el-table-column label="Created Time" width="210">
        <template #default="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
      </el-table-column>
      <el-table-column label="Status" min-width="165">
        <template #default="{ row }">
          <div class="table-status-cell">
            <!-- admin 账号状态开关置灰不可修改 -->
            <el-switch
              v-model="row.isActive"
              :active-value="true"
              :inactive-value="false"
              :disabled="isSystemAdmin(row)"
              @change="handleStatusChange(row)"
            />
            <span :style="{ color: '#909399' }">
              {{ row.isActive ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <template v-if="!isSystemAdmin(row)">
              <el-link type="primary" class="action-link" @click="handleEdit(row)" :underline="false">
                Edit
              </el-link>
              <span class="action-sep" aria-hidden="true">|</span>
            </template>
            <el-link type="primary" class="action-link" @click="handleResetPassword(row)" :underline="false">
              Reset Password
            </el-link>
          </div>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <!-- 新建账户模态框 -->
    <el-dialog
      v-model="newAccountDialogVisible"
      class="crm-compact-dialog"
      title="New Account"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="newAccountFormRef"
        :model="newAccountForm"
        :rules="accountFormRules"
        label-position="left"
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
        <el-form-item label="Role" prop="role" required>
          <el-select v-model="newAccountForm.role" placeholder="Please select role" style="width: 100%">
            <el-option label="RM/ARM" value="RM/ARM" />
            <el-option label="Operation" value="OPERATION" />
            <el-option label="Compliance" value="COMPLIANCE" />
            <el-option label="RO" value="RO" />
          </el-select>
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
      class="crm-compact-dialog"
      title="Edit Account"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editAccountFormRef"
        :model="editAccountForm"
        :rules="accountFormRules"
        label-position="left"
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
        <el-form-item label="Role">
          <el-input v-model="editAccountForm.roleDisplayName" disabled />
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
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { accountApi, type Account, type CreateAccountParams, type UpdateAccountParams } from '@/api/account'
import { formatDateTime } from '@/utils/date'
import { isAdminRole, roleDisplayName } from '@/utils/roles'
import { formatPersonName } from '@/utils/name'

const route = useRoute()
const authStore = useAuthStore()

const crmTableRowStyle = () => ({ height: '41.31px' })
const crmTableCellStyle = () => ({ paddingTop: '4px', paddingBottom: '4px' })

const accountList = ref<Account[]>([])
let accountLoadingPromise: Promise<void> | null = null
const newAccountDialogVisible = ref(false)
const editAccountDialogVisible = ref(false)
const newAccountFormRef = ref<FormInstance>()
const editAccountFormRef = ref<FormInstance>()

const newAccountForm = reactive<CreateAccountParams>({
  account: '',
  firstName: '',
  lastName: '',
  role: 'RM/ARM'
})

const editAccountForm = reactive<UpdateAccountParams & { account: string; id?: number; roleDisplayName?: string }>({
  account: '',
  firstName: '',
  lastName: '',
  roleDisplayName: ''
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
  ],
  role: [
    { required: true, message: 'Please select role', trigger: 'change' }
  ]
}

const isSystemAdmin = (row: Pick<Account, 'account' | 'role'> | any) =>
  (row.account || '') === 'admin' || isAdminRole(row.role)

// 加载账户列表
const loadAccounts = async () => {
  if (accountLoadingPromise) {
    return accountLoadingPromise
  }
  accountLoadingPromise = (async () => {
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
      const isAdmin = (item.username || item.account || '') === 'admin' || isAdminRole(item.role)
      
      return {
        id: userId, // 使用 userId 作为 id
        userId: userId, // 同时保存 userId 字段
        account: item.username || item.account || '', // 后端返回 username，映射到前端的 account
        firstName: firstName,
        lastName: lastName,
        // Admin 账号 Name 固定为 "System Administrator"，其他账号统一 "firstName, lastName"
        name: isAdmin ? 'System Administrator' : formatPersonName(firstName, lastName),
        role: item.role || item.userRole || '', // 后端返回的角色，用于判断是否为 admin
        roleDisplayName: roleDisplayName(item.role || item.userRole || ''),
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
  })().finally(() => {
    accountLoadingPromise = null
  })
  return accountLoadingPromise
}

// 新建账户
const handleNewAccount = () => {
  newAccountForm.account = ''
  newAccountForm.firstName = ''
  newAccountForm.lastName = ''
  newAccountForm.role = 'RM/ARM'
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
  editAccountForm.role = row.role
  editAccountForm.roleDisplayName = roleDisplayName(row.role)
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
  if (isSystemAdmin(row)) {
    row.isActive = true
    row.status = 'enabled'
    ElMessage.warning('Super admin status cannot be changed to disabled')
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
  padding: 20px 28px 28px;
  background-color: var(--crm-surface-page);
  min-height: 100%;
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
    margin-bottom: 12px;
    padding: 0;
    width: 100%;
    box-sizing: border-box;

    .user-info {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #1f2a37;
      font-size: 14px;
      line-height: 1;
      padding: 8px 12px;
      margin: 0;
      border-radius: 10px;
      background: #e8eff6;

      .user-role-pill {
        display: inline-flex;
        align-items: center;
        margin-left: 2px;
        padding: 0;
        font-size: 13px;
        line-height: 1;
        font-weight: 500;
        color: #025189;
      }

    }
  }

  .table-wrapper {
    width: 100%;
    flex: 1;
    min-height: 420px;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    position: relative;
  }

  .account-table {
    --crm-table-header-bg: #004080;
    --crm-table-header-text: #ffffff;
    --crm-table-border: #e4e7ed;
    background-color: #fff;
    border-radius: var(--crm-radius-lg);
    overflow: hidden;
    box-shadow: var(--crm-shadow-card);
    border: 1px solid rgba(226, 232, 240, 0.9);
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

      &::before {
        display: none;
      }
    }

    :deep(.el-table__header-wrapper th.el-table__cell) {
      background: var(--crm-table-header-bg) !important;
      color: var(--crm-table-header-text) !important;
      font-weight: 600;
      font-size: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      padding: 8px 0 !important;
    }

    :deep(.el-table__header-wrapper th.el-table__cell .cell) {
      color: var(--crm-table-header-text) !important;
    }

    :deep(.el-table__body-wrapper td.el-table__cell) {
      border-color: var(--crm-table-border);
      padding: 4px 0 !important;
    }

    :deep(.el-table__body-wrapper td.el-table__cell .cell) {
      line-height: 24px !important;
    }

    :deep(.el-table__body-wrapper tr) {
      background: #fff;
      height: 41.31px;
    }

    :deep(.el-table__body-wrapper tbody tr:hover > td.el-table__cell) {
      background: #f5f9fc !important;
    }


    .table-actions {
      display: inline-flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 0;
      font-size: 14px;
      white-space: nowrap;
    }

    .action-sep {
      color: #c0c4cc;
      padding: 0 6px;
      user-select: none;
    }

    .action-link {
      font-weight: 500;
    }

    :deep(.el-table__body td.el-table-fixed-column--right),
    :deep(.el-table__header th.el-table-fixed-column--right) {
      padding-left: 8px !important;
      padding-right: 8px !important;
    }
  }

  .table-status-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    line-height: 24px;
    white-space: nowrap;
  }
}

:deep(.crm-compact-dialog.el-dialog) {
  border-radius: var(--crm-radius-sm, 4px);

  .el-dialog__header {
    padding: 8px 16px 6px;
    border-bottom: none;
    position: relative;

    .el-dialog__title {
      display: block;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }

    .el-dialog__headerbtn {
      top: -12px;
      right: -12px;
    }
  }

  .el-dialog__body {
    padding: 4px 24px 2px;
  }

  .el-form-item {
    margin-bottom: 14px;
    align-items: flex-start;

    .el-form-item__label {
      &::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
      justify-content: flex-start;
      text-align: left;
      padding-right: 12px;
      pointer-events: none !important; // 禁用 label 的点击聚焦行为
      cursor: default !important; // 将鼠标指针改为默认样式
    }

    .el-input__wrapper {
      border-radius: 4px;
    }

    .el-form-item__content {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-width: 0;
    }
  }

  .el-form-item__error {
    position: static;
    padding-top: 4px;
    line-height: 16px;
    min-height: 16px;
    white-space: normal;
  }

  .el-dialog__footer {
    padding: 6px 24px 14px;
    border-top: none;

    .el-button {
      min-width: 96px;
      height: 36px;
      padding: 0 18px;
      border-radius: 4px;
    }
  }
}
</style>
