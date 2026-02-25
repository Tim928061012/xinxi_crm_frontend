<template>
  <div class="bank-centre-page">
    <!-- 顶部操作栏（始终显示当前账号信息） -->
    <div class="page-header">
      <el-button type="primary" @click="handleNewBank">
        <el-icon><Plus /></el-icon>
        New Bank & Centre
      </el-button>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.username || authStore.user?.account || 'admin' }}</span>
      </div>
    </div>

    <!-- Loading 状态 -->
    <div v-loading="loading" class="table-wrapper" v-if="loading">
      <div style="min-height: 400px;"></div>
    </div>

    <!-- 有数据时显示表格 -->
    <template v-else-if="bankList.length > 0">
      <div class="table-wrapper">
        <el-table
          :data="bankList"
          stripe
          class="bank-table"
          style="width: 100%"
        >
          <el-table-column prop="bank" label="Bank" width="200" />
          <el-table-column prop="bookingCentresDisplay" label="Booking Centre" />
          <el-table-column label="Status" width="150">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-switch
                  v-model="row.isActive"
                  :active-value="true"
                  :inactive-value="false"
                  @change="handleStatusChange(row)"
                />
                <span :style="{ color: row.isActive ? '#67c23a' : '#909399' }">
                  {{ row.isActive ? 'enabled' : 'disabled' }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Created Time" width="200">
            <template #default="{ row }">
              {{ formatDateTime(row.createdTime) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="150">
            <template #default="{ row }">
              <el-link type="primary" @click="handleView(row)" :underline="false">
                View
              </el-link>
              <el-divider direction="vertical" />
            <el-link type="primary" @click="handleEdit(row)" :underline="false">
              Edit
            </el-link>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <!-- 无数据时显示中间的按钮 -->
    <div v-else class="empty-state">
      <el-button type="primary" size="large" @click="handleNewBank">
        <el-icon><Plus /></el-icon>
        New Bank & Centre
      </el-button>
    </div>

    <!-- 新建银行模态框 -->
    <el-dialog
      v-model="newBankDialogVisible"
      title="New Bank & Centre"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="newBankFormRef"
        :model="newBankForm"
        :rules="newBankFormRules"
        label-width="140px"
      >
        <el-form-item label="Bank" prop="bank" required>
          <el-input v-model="newBankForm.bank" placeholder="Please enter bank name" />
        </el-form-item>

        <el-form-item prop="bookingCentres" required class="booking-centre-form-item">
          <template #label>
            <span class="booking-centre-label">
              <span>Booking Centre</span>
              <span style="color: #909399; font-size: 12px; display: block; margin-top: 2px;">
                (At least 1 required)
              </span>
            </span>
          </template>
          <div class="booking-centres-wrapper">
            <div
              v-for="(centre, index) in newBankForm.bookingCentres"
              :key="index"
              class="booking-centre-item"
            >
              <el-input
                v-model="centre.name"
                :placeholder="`Booking Centre ${index + 1}`"
                style="flex: 1; margin-right: 8px;"
              />
              <!-- 新建时：只允许删除未保存的 Booking Centre，不提供启用/禁用开关 -->
              <el-button
                v-if="newBankForm.bookingCentres.length > 1"
                type="danger"
                :icon="Minus"
                circle
                size="small"
                @click="removeBookingCentre('new', index)"
              />
            </div>
            <el-button
              type="text"
              :icon="Plus"
              @click="addBookingCentre('new')"
              class="add-booking-centre-btn"
            >
              Add a new Booking Centre
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newBankDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitNewBank">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 编辑银行模态框 -->
    <el-dialog
      v-model="editBankDialogVisible"
      title="New Bank & Centre"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editBankFormRef"
        :model="editBankForm"
        :rules="editBankFormRules"
        label-width="140px"
      >
        <el-form-item label="Bank" prop="bank" required>
          <el-input v-model="editBankForm.bank" placeholder="Please enter bank name" />
        </el-form-item>

        <el-form-item prop="bookingCentres" required class="booking-centre-form-item">
          <template #label>
            <span class="booking-centre-label">
              <span>Booking Centre</span>
              <span style="color: #909399; font-size: 12px; display: block; margin-top: 2px;">
                (At least 1 required)
              </span>
            </span>
          </template>
          <div class="booking-centres-wrapper">
            <div
              v-for="(centre, index) in editBankForm.bookingCentres"
              :key="index"
              class="booking-centre-item"
            >
              <el-input
                v-model="centre.name"
                :placeholder="`Booking Centre ${index + 1}`"
                style="flex: 1; margin-right: 8px;"
              />
              <!-- 编辑时：已存在的 Centre 只能启用/禁用，不能删除；新添加的 Centre 只能删除，不能启用/禁用 -->
              <div
                v-if="!centre.isNew"
                class="centre-status"
              >
                <el-switch
                  v-model="centre.isActive"
                  :active-value="true"
                  :inactive-value="false"
                />
                <span :style="{ color: centre.isActive ? '#67c23a' : '#909399', marginLeft: '8px' }">
                  {{ centre.isActive ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <el-button
                v-if="centre.isNew && editBankForm.bookingCentres.length > 1"
                type="danger"
                :icon="Minus"
                circle
                size="small"
                @click="removeBookingCentre('edit', index)"
              />
            </div>
            <el-button
              type="text"
              :icon="Plus"
              @click="addBookingCentre('edit')"
              class="add-booking-centre-btn"
            >
              Add a new Booking Centre
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editBankDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitEditBank">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情模态框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Bank & Centre Details"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Bank">{{ viewData.bank || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Booking Centres">
          <div v-if="viewData.bookingCentres && viewData.bookingCentres.length > 0">
            <div
              v-for="(centre, index) in viewData.bookingCentres"
              :key="index"
              style="margin-bottom: 8px;"
            >
              {{ centre.name }} - 
              <el-tag :type="centre.isActive ? 'success' : 'info'" size="small">
                {{ centre.isActive ? 'Enabled' : 'Disabled' }}
              </el-tag>
            </div>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="viewData.isActive ? 'success' : 'info'">
            {{ viewData.isActive ? 'enabled' : 'disabled' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Created Time">{{ formatDateTime(viewData.createdTime) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="viewDialogVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onActivated, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, User, Minus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { bankApi, type BankCentre, type CreateBankCentreParams, type UpdateBankCentreParams, type BookingCentre } from '@/api/bank'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const authStore = useAuthStore()
const bankList = ref<BankCentre[]>([])
const loading = ref(false)
const newBankDialogVisible = ref(false)
const editBankDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const newBankFormRef = ref<FormInstance>()
const editBankFormRef = ref<FormInstance>()
const viewData = ref<BankCentre | null>(null)

const newBankForm = reactive<CreateBankCentreParams>({
  bank: '',
  bookingCentres: [{ name: '', isActive: true }]
})

const editBankForm = reactive<UpdateBankCentreParams & { id?: number; bookingCentres: (BookingCentre & { isNew?: boolean })[] }>({
  bank: '',
  bookingCentres: [{ name: '', isActive: true }]
})

// 表单验证规则
const validateBookingCentres = (rule: any, value: any, callback: any) => {
  if (!value || value.length === 0) {
    callback(new Error('At least 1 booking centre is required'))
    return
  }
  
  // 检查是否有空的名称
  const hasEmptyName = value.some((centre: BookingCentre) => !centre.name || centre.name.trim() === '')
  if (hasEmptyName) {
    callback(new Error('All booking centres must have a name'))
    return
  }
  
  callback()
}

const newBankFormRules: FormRules = {
  bank: [
    { required: true, message: 'Please enter bank name', trigger: 'blur' }
  ],
  bookingCentres: [
    { validator: validateBookingCentres, trigger: 'change' }
  ]
}

const editBankFormRules: FormRules = {
  bank: [
    { required: true, message: 'Please enter bank name', trigger: 'blur' }
  ],
  bookingCentres: [
    { validator: validateBookingCentres, trigger: 'change' }
  ]
}

// 加载银行列表
const loadBanks = async () => {
  loading.value = true
  try {
    const response = await bankApi.getBanks()
    const data = response.data || response || []
    bankList.value = data.map((item: any) => {
      // 后端字段映射
      const bankId = item.bankId || item.id
      const bankName = item.bankName || item.bank || ''
      const centres = item.centres || item.bookingCentres || item.booking_centres || []
      const isEnabled = item.isEnabled === true || item.isEnabled === 'true' || item.isActive === true || item.isActive === 'true' || item.active === true
      const createdAt = item.createdAt || item.created_at || ''
      
      // 格式化 Booking Centres 显示字符串
      const bookingCentresDisplay = centres
        .map((centre: any) => centre.name || centre)
        .filter((name: string) => name)
        .join(', ')
      
      return {
        id: bankId, // 映射自 bankId
        bank: bankName, // 映射自 bankName
        bookingCentres: centres.map((centre: any) => ({
          name: typeof centre === 'string' ? centre : (centre.name || ''),
          isActive: typeof centre === 'string' ? true : (centre.isEnabled === true || centre.isEnabled === 'true' || centre.isActive === true || centre.isActive === 'true' || centre.active === true)
        })),
        bookingCentresDisplay: bookingCentresDisplay,
        status: isEnabled ? 'enabled' : 'disabled',
        isActive: isEnabled, // 映射自 isEnabled
        createdTime: createdAt // 映射自 createdAt
      }
    })
  } catch (error) {
    console.error('Failed to load bank list:', error)
    // 登录态失效（401）时，全局拦截器已经提示并跳转，这里不再额外提示
    if (!(error as any)?.isAuthError && (error as any)?.response?.status !== 401) {
      ElMessage.error('Failed to load bank list')
    }
    bankList.value = []
  } finally {
    // 添加最小延迟，避免闪烁
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  }
}

// 新建银行
const handleNewBank = () => {
  // 重置表单
  newBankForm.bank = ''
  newBankForm.bookingCentres = [{ name: '', isActive: true }]
  newBankDialogVisible.value = true
}

// 添加 Booking Centre
const addBookingCentre = (type: 'new' | 'edit') => {
  if (type === 'new') {
    // 新建表单：所有 Booking Centre 都是“未保存”的，只支持删除，不支持禁用
    newBankForm.bookingCentres.push({ name: '', isActive: true })
  } else {
    // 编辑表单：新添加的 Booking Centre 标记为 isNew，只支持删除，不支持禁用
    editBankForm.bookingCentres.push({ name: '', isActive: true, isNew: true } as BookingCentre & { isNew?: boolean })
  }
}

// 删除 Booking Centre
const removeBookingCentre = (type: 'new' | 'edit', index: number) => {
  if (type === 'new') {
    // 新建表单：允许删除任意未保存的 Booking Centre（至少保留 1 个）
    if (newBankForm.bookingCentres.length > 1) {
      newBankForm.bookingCentres.splice(index, 1)
    }
  } else {
    // 编辑表单：只允许删除当前会话中新添加的 Booking Centre（isNew = true），已存在的不能删除
    const centre = editBankForm.bookingCentres[index] as BookingCentre & { isNew?: boolean }
    if (centre?.isNew && editBankForm.bookingCentres.length > 1) {
      editBankForm.bookingCentres.splice(index, 1)
    }
  }
}

// 提交新建银行
const handleSubmitNewBank = async () => {
  if (!newBankFormRef.value) return
  
  await newBankFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 过滤掉空的 booking centres
        const bookingCentres = newBankForm.bookingCentres
          .filter(centre => centre.name && centre.name.trim() !== '')
          .map(centre => ({
            name: centre.name.trim(),
            isActive: centre.isActive
          }))
        
        const requestData: CreateBankCentreParams = {
          bank: newBankForm.bank.trim(),
          bookingCentres: bookingCentres
        }

        await bankApi.createBank(requestData)
        ElMessage.success('Bank & Centre created successfully')
        newBankDialogVisible.value = false
        loadBanks()
      } catch (error: any) {
        console.error('Failed to create bank:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to create bank'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 编辑银行
const handleEdit = async (row: BankCentre) => {
  // 如果 Bank 已被禁用，不允许编辑
  if (!row.isActive) {
    ElMessage.warning('Please enable this Bank before editing')
    return
  }
  try {
    // 获取详情数据
    const response = await bankApi.getBankById(row.id)
    const data = response.data || response
    
    // 后端字段映射
    const bankId = data.bankId || data.id || row.id
    const bankName = data.bankName || data.bank || row.bank || ''
    const centres = data.centres || data.bookingCentres || data.booking_centres || row.bookingCentres || []
    
    // 填充编辑表单
    editBankForm.id = bankId
    editBankForm.bank = bankName
    editBankForm.bookingCentres = centres.map((centre: any) => ({
      name: typeof centre === 'string' ? centre : (centre.name || ''),
      isActive: typeof centre === 'string'
        ? true
        : (centre.isEnabled === true || centre.isEnabled === 'true' || centre.isActive === true || centre.isActive === 'true' || centre.active === true),
      // 从后端加载的 Booking Centre 视为“已存在”，不能删除，只能启用/禁用
      isNew: false
    })) as (BookingCentre & { isNew?: boolean })[]
    
    // 确保至少有一个
    if (editBankForm.bookingCentres.length === 0) {
      editBankForm.bookingCentres = [{ name: '', isActive: true }]
    }

    editBankDialogVisible.value = true
  } catch (error: any) {
    console.error('Failed to load bank details:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to load bank details'
    ElMessage.error(errorMessage)
  }
}

// 提交编辑银行
const handleSubmitEditBank = async () => {
  if (!editBankFormRef.value || !editBankForm.id) return
  
  await editBankFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 过滤掉空的 booking centres
        const bookingCentres = editBankForm.bookingCentres
          .filter(centre => centre.name && centre.name.trim() !== '')
          .map(centre => ({
            name: centre.name.trim(),
            isActive: centre.isActive
          }))
        
        const requestData: UpdateBankCentreParams = {
          bank: editBankForm.bank.trim(),
          bookingCentres: bookingCentres
        }

        await bankApi.updateBank(editBankForm.id, requestData)
        ElMessage.success('Bank & Centre updated successfully')
        editBankDialogVisible.value = false
        loadBanks()
      } catch (error: any) {
        console.error('Failed to update bank:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to update bank'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 查看详情
const handleView = async (row: BankCentre) => {
  try {
    const response = await bankApi.getBankById(row.id)
    const data = response.data || response
    
    // 后端字段映射
    const bankId = data.bankId || data.id || row.id
    const bankName = data.bankName || data.bank || row.bank || ''
    const centres = data.centres || data.bookingCentres || data.booking_centres || row.bookingCentres || []
    const isEnabled = data.isEnabled === true || data.isEnabled === 'true' || data.isActive === true || data.isActive === 'true' || data.active === true || row.isActive
    const createdAt = data.createdAt || data.created_at || row.createdTime
    
    const bookingCentres = centres.map((centre: any) => ({
      name: typeof centre === 'string' ? centre : (centre.name || ''),
      isActive: typeof centre === 'string' ? true : (centre.isEnabled === true || centre.isEnabled === 'true' || centre.isActive === true || centre.isActive === 'true' || centre.active === true)
    }))
    
    viewData.value = {
      id: bankId,
      bank: bankName,
      bookingCentres: bookingCentres,
      bookingCentresDisplay: bookingCentres.map(c => c.name).join(', '),
      status: isEnabled ? 'enabled' : 'disabled',
      isActive: isEnabled,
      createdTime: createdAt
    }
    
    viewDialogVisible.value = true
  } catch (error: any) {
    console.error('Failed to load bank details:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to load bank details'
    ElMessage.error(errorMessage)
  }
}

// 状态切换
const handleStatusChange = async (row: BankCentre) => {
  const originalIsActive = row.isActive
  try {
    // 使用专门的更新状态 API
    await bankApi.updateBankStatus(row.id, row.isActive || false)
    
    ElMessage.success(`Bank & Centre ${row.isActive ? 'enabled' : 'disabled'}`)
    row.status = row.isActive ? 'enabled' : 'disabled'
  } catch (error: any) {
    console.error('Failed to update bank status:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to update bank status'
    ElMessage.error(errorMessage)
    // 恢复原状态
    row.isActive = originalIsActive
    row.status = originalIsActive ? 'enabled' : 'disabled'
  }
}

// 监听路由变化，当路由切换到当前页面时刷新数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/bank-centre') {
      loadBanks()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(() => {
  loadBanks()
})

onMounted(() => {
  loadBanks()
})
</script>

<style lang="scss" scoped>
.bank-centre-page {
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

  .bank-table {
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

  .empty-state {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 100px);
  }

  .booking-centres-wrapper {
    width: 100%;

    .booking-centre-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .centre-status {
        display: flex;
        align-items: center;
        min-width: 120px;
        margin-right: 8px;
      }
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
    
    .add-booking-centre-btn {
      padding: 0;
      background: transparent;
      border: none;
      color: #025189;
      font-size: 14px;
      
      &:hover {
        background: transparent;
        color: #0369a1;
      }
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }

  // 必填字段红色星号
  .el-form-item.is-required {
    .el-form-item__label {
      &::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
    }
  }
  
  // Booking Centre 字段的星号间距在外部定义，确保优先级

  .el-form-item {
    margin-bottom: 20px;

    .el-form-item__label {
      line-height: 1.2;
      word-break: break-word;
      white-space: normal;
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

// 在 :deep(.el-dialog) 外部定义，确保样式优先级足够高
// 针对 Booking Centre 字段，彻底解决星号间距问题
// 方法1: 缩小 ::before 的 margin-right
:deep(.el-dialog .booking-centre-form-item.is-required .el-form-item__label::before) {
  margin-right: 0px !important; // 完全移除间距
}

// 方法2: 使用负 margin 来进一步缩小间距（如果方法1不够）
:deep(.el-dialog .booking-centre-form-item.is-required .el-form-item__label .booking-centre-label) {
  margin-left: -3px !important; // 使用负 margin 抵消剩余的间距
  padding-left: 0 !important;
  display: inline !important;
  vertical-align: baseline;
}
</style>

