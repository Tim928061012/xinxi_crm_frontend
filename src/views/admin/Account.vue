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
        <span>Administrator</span>
      </div>
    </div>

    <!-- 账户表格 -->
    <el-table
      :data="accountList"
      stripe
      style="width: 100%"
      class="account-table"
    >
      <el-table-column prop="account" label="Account" width="180" />
      <el-table-column prop="name" label="Name" width="200" />
      <el-table-column prop="createdTime" label="Created Time" width="200" />
      <el-table-column label="Status" width="120">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="'enabled'"
            :inactive-value="'disabled'"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <el-link type="primary" @click="handleEdit(row)" :underline="false">
            Edit
          </el-link>
          <el-divider direction="vertical" />
          <el-link type="primary" @click="handleResetPassword(row)" :underline="false">
            Reset Password
          </el-link>
        </template>
      </el-table-column>
    </el-table>

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
          <el-input v-model="newAccountForm.account" placeholder="请输入账户" />
        </el-form-item>
        <el-form-item label="First Name" prop="firstName" required>
          <el-input v-model="newAccountForm.firstName" placeholder="请输入名字" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName" required>
          <el-input v-model="newAccountForm.lastName" placeholder="请输入姓氏" />
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
          <el-input v-model="editAccountForm.firstName" placeholder="请输入名字" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName" required>
          <el-input v-model="editAccountForm.lastName" placeholder="请输入姓氏" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, User } from '@element-plus/icons-vue'
import { accountApi, type Account, type CreateAccountParams, type UpdateAccountParams } from '@/api/account'

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
    { required: true, message: '请输入账户', trigger: 'blur' }
  ],
  firstName: [
    { required: true, message: '请输入名字', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: '请输入姓氏', trigger: 'blur' }
  ]
}

// 加载账户列表
const loadAccounts = async () => {
  try {
    // TODO: 调用实际接口
    // const response = await accountApi.getAccounts()
    // accountList.value = response.data || response
    
    // 临时模拟数据
    accountList.value = [
      {
        id: 1,
        account: '17328392241',
        firstName: 'Tai man',
        lastName: 'Chan',
        name: 'Tai man, Chan',
        status: 'enabled',
        createdTime: '2025-10-12 19:00'
      },
      {
        id: 2,
        account: '18673367255',
        firstName: 'Jackie',
        lastName: 'Chan',
        name: 'Jackie, Chan',
        status: 'disabled',
        createdTime: '2025-08-12 02:30'
      }
    ]
  } catch (error) {
    console.error('加载账户列表失败:', error)
    ElMessage.error('加载账户列表失败')
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
        // TODO: 调用实际接口
        // await accountApi.createAccount(newAccountForm)
        ElMessage.success('创建账户成功')
        newAccountDialogVisible.value = false
        loadAccounts()
      } catch (error) {
        console.error('创建账户失败:', error)
        ElMessage.error('创建账户失败')
      }
    }
  })
}

// 编辑账户
const handleEdit = (row: Account) => {
  editAccountForm.id = row.id
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
        // TODO: 调用实际接口
        // await accountApi.updateAccount(editAccountForm.id, {
        //   firstName: editAccountForm.firstName,
        //   lastName: editAccountForm.lastName
        // })
        ElMessage.success('更新账户成功')
        editAccountDialogVisible.value = false
        loadAccounts()
      } catch (error) {
        console.error('更新账户失败:', error)
        ElMessage.error('更新账户失败')
      }
    }
  })
}

// 状态切换
const handleStatusChange = async (row: Account) => {
  try {
    // TODO: 调用实际接口
    // await accountApi.updateAccountStatus(row.id, row.status)
    ElMessage.success(`账户已${row.status === 'enabled' ? '启用' : '禁用'}`)
  } catch (error) {
    console.error('更新账户状态失败:', error)
    ElMessage.error('更新账户状态失败')
    // 恢复原状态
    row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  }
}

// 重置密码
const handleResetPassword = async (row: Account) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置账户 ${row.account} 的密码吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用实际接口
    // await accountApi.resetPassword(row.id)
    ElMessage.success('密码重置成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }
}

onMounted(() => {
  loadAccounts()
})
</script>

<style lang="scss" scoped>
.account-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;
    }
  }

  .account-table {
    background-color: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

    :deep(.el-table__header-wrapper) {
      .el-table__header {
        background-color: #409eff;
        color: #fff;

        th {
          background-color: #409eff !important;
          color: #fff !important;
          border: none;
          font-weight: 500;
          padding: 12px 0;
        }
      }
    }

    :deep(.el-table__body-wrapper) {
      .el-table__body {
        tr {
          background-color: #fff;
          
          &:hover {
            background-color: #f5f7fa;
          }
          
          td {
            padding: 12px 0;
            border-bottom: 1px solid #ebeef5;
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

