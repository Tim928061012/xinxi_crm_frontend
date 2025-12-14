<template>
  <div class="bank-centre-page">
    <!-- 有数据时显示顶部操作栏和表格 -->
    <template v-if="bankList.length > 0">
      <div class="page-header">
        <el-button type="primary" @click="handleNewBank">
          <el-icon><Plus /></el-icon>
          New Bank & Centre
        </el-button>
        <div class="user-info">
          <el-icon><User /></el-icon>
          <span>Administrator</span>
        </div>
      </div>

      <!-- 银行表格 -->
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

        <el-form-item prop="bookingCentres" required>
          <template #label>
            <span>Booking Centre <span style="color: #f56c6c;">*</span> <span style="color: #909399; font-size: 12px;">(At least 1 required)</span></span>
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
              <div class="centre-status">
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

        <el-form-item prop="bookingCentres" required>
          <template #label>
            <span>Booking Centre <span style="color: #f56c6c;">*</span> <span style="color: #909399; font-size: 12px;">(At least 1 required)</span></span>
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
              <div class="centre-status">
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
                v-if="editBankForm.bookingCentres.length > 1"
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
import { bankApi, type BankCentre, type CreateBankCentreParams, type UpdateBankCentreParams, type BookingCentre } from '@/api/bank'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const bankList = ref<BankCentre[]>([])
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

const editBankForm = reactive<UpdateBankCentreParams & { id?: number }>({
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
    ElMessage.error('Failed to load bank list')
    bankList.value = []
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
    newBankForm.bookingCentres.push({ name: '', isActive: true })
  } else {
    editBankForm.bookingCentres.push({ name: '', isActive: true })
  }
}

// 删除 Booking Centre
const removeBookingCentre = (type: 'new' | 'edit', index: number) => {
  if (type === 'new') {
    if (newBankForm.bookingCentres.length > 1) {
      newBankForm.bookingCentres.splice(index, 1)
    }
  } else {
    if (editBankForm.bookingCentres.length > 1) {
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
      isActive: typeof centre === 'string' ? true : (centre.isEnabled === true || centre.isEnabled === 'true' || centre.isActive === true || centre.isActive === 'true' || centre.active === true)
    }))
    
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

  .el-form-item {
    margin-bottom: 20px;

    .el-form-item__label {
      line-height: 1.2;
      word-break: break-word;
      white-space: normal;
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

