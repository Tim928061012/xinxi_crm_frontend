<template>
  <div class="introducer-page">
    <!-- 有数据时显示顶部操作栏和表格 -->
    <template v-if="introducerList.length > 0">
      <div class="page-header">
        <el-button type="primary" @click="handleNewIntroducer">
          <el-icon><Plus /></el-icon>
          New Introducer
        </el-button>
        <div class="user-info">
          <el-icon><User /></el-icon>
          <span>Administrator</span>
        </div>
      </div>

      <!-- 介绍人表格 -->
      <div class="table-wrapper">
        <el-table
          :data="introducerList"
          stripe
          class="introducer-table"
          style="width: 100%"
        >
          <el-table-column prop="introducer" label="Introducer" width="200" />
          <el-table-column prop="contactNature" label="Contact Nature" width="150" />
          <el-table-column prop="rm" label="RM" width="200" />
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
      <el-button type="primary" size="large" @click="handleNewIntroducer">
        <el-icon><Plus /></el-icon>
        New Introducer
      </el-button>
    </div>

    <!-- 新建介绍人模态框 -->
    <el-dialog
      v-model="newIntroducerDialogVisible"
      :title="newIntroducerForm.contactNature === 'Individual' ? 'New Introducer (Individual)' : 'New Introducer (Corporate)'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="newIntroducerFormRef"
        :model="newIntroducerForm"
        :rules="newIntroducerFormRules"
        label-width="180px"
      >
        <el-form-item label="Contact Type">
          <el-input v-model="newIntroducerForm.contactType" disabled />
        </el-form-item>
        
        <el-form-item label="Contact Nature" prop="contactNature" required>
          <el-select v-model="newIntroducerForm.contactNature" placeholder="Please select contact nature" style="width: 100%">
            <el-option label="Individual" value="Individual" />
            <el-option label="Corporate" value="Corporate" />
          </el-select>
        </el-form-item>

        <el-form-item label="Client Relationship Status" prop="clientRelationshipStatus">
          <el-select v-model="newIntroducerForm.clientRelationshipStatus" placeholder="Please select" style="width: 100%">
            <el-option label="Prospecting" value="Prospecting" />
            <el-option label="On Boarding" value="On Boarding" />
          </el-select>
        </el-form-item>

        <!-- Individual 字段 -->
        <template v-if="newIntroducerForm.contactNature === 'Individual'">
          <el-form-item label="Title" prop="title" required>
            <el-select v-model="newIntroducerForm.title" placeholder="Please select title" style="width: 100%">
              <el-option label="Mr." value="Mr." />
              <el-option label="Mrs." value="Mrs." />
              <el-option label="Miss" value="Miss" />
              <el-option label="Dr." value="Dr." />
            </el-select>
          </el-form-item>
          <el-form-item label="First Name" prop="firstName" required>
            <el-input v-model="newIntroducerForm.firstName" placeholder="Please enter first name" />
          </el-form-item>
          <el-form-item label="Last Name" prop="lastName" required>
            <el-input v-model="newIntroducerForm.lastName" placeholder="Please enter last name" />
          </el-form-item>
        </template>

        <!-- Corporate 字段 -->
        <template v-if="newIntroducerForm.contactNature === 'Corporate'">
          <el-form-item label="Company Name" prop="companyName" required>
            <el-input v-model="newIntroducerForm.companyName" placeholder="Please enter company name" />
          </el-form-item>
        </template>

        <!-- 公共字段 -->
        <el-form-item label="RM" prop="rm" required>
          <el-input 
            v-model="newIntroducerForm.rm" 
            placeholder="Please select RM"
            readonly
            @click="handleSelectRM('new')"
            style="cursor: pointer;"
          >
            <template #suffix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="newIntroducerForm.email" placeholder="Please enter email">
            <template #suffix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Mobile Phone" prop="mobilePhone">
          <el-input v-model="newIntroducerForm.mobilePhone" placeholder="Please enter mobile phone">
            <template #suffix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newIntroducerDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitNewIntroducer">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 编辑介绍人模态框 -->
    <el-dialog
      v-model="editIntroducerDialogVisible"
      :title="editIntroducerForm.contactNature === 'Individual' ? 'Edit Introducer (Individual)' : 'Edit Introducer (Corporate)'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editIntroducerFormRef"
        :model="editIntroducerForm"
        :rules="editIntroducerFormRules"
        label-width="180px"
      >
        <el-form-item label="Contact Type">
          <el-input v-model="editIntroducerForm.contactType" disabled />
        </el-form-item>
        
        <el-form-item label="Contact Nature">
          <el-input v-model="editIntroducerForm.contactNature" disabled />
        </el-form-item>

        <el-form-item label="Client Relationship Status" prop="clientRelationshipStatus">
          <el-select v-model="editIntroducerForm.clientRelationshipStatus" placeholder="Please select" style="width: 100%">
            <el-option label="Prospecting" value="Prospecting" />
            <el-option label="On Boarding" value="On Boarding" />
          </el-select>
        </el-form-item>

        <!-- Individual 字段 -->
        <template v-if="editIntroducerForm.contactNature === 'Individual'">
          <el-form-item label="Title" prop="title" required>
            <el-select v-model="editIntroducerForm.title" placeholder="Please select title" style="width: 100%">
              <el-option label="Mr." value="Mr." />
              <el-option label="Mrs." value="Mrs." />
              <el-option label="Miss" value="Miss" />
              <el-option label="Dr." value="Dr." />
            </el-select>
          </el-form-item>
          <el-form-item label="First Name" prop="firstName" required>
            <el-input v-model="editIntroducerForm.firstName" placeholder="Please enter first name" />
          </el-form-item>
          <el-form-item label="Last Name" prop="lastName" required>
            <el-input v-model="editIntroducerForm.lastName" placeholder="Please enter last name" />
          </el-form-item>
        </template>

        <!-- Corporate 字段 -->
        <template v-if="editIntroducerForm.contactNature === 'Corporate'">
          <el-form-item label="Company Name" prop="companyName" required>
            <el-input v-model="editIntroducerForm.companyName" placeholder="Please enter company name" />
          </el-form-item>
        </template>

        <!-- 公共字段 -->
        <el-form-item label="RM" prop="rm" required>
          <el-input 
            v-model="editIntroducerForm.rm" 
            placeholder="Please select RM"
            readonly
            @click="handleSelectRM('edit')"
            style="cursor: pointer;"
          >
            <template #suffix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="editIntroducerForm.email" placeholder="Please enter email">
            <template #suffix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Mobile Phone" prop="mobilePhone">
          <el-input v-model="editIntroducerForm.mobilePhone" placeholder="Please enter mobile phone">
            <template #suffix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editIntroducerDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitEditIntroducer">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 用户选择对话框 -->
    <el-dialog
      v-model="userSelectDialogVisible"
      title="Select RM"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-table
        :data="accountList"
        stripe
        style="width: 100%"
        @row-click="handleAccountSelect"
        highlight-current-row
      >
        <el-table-column prop="account" label="Account" width="180" />
        <el-table-column prop="name" label="Name" width="200" />
        <el-table-column label="Created Time" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createdTime) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="userSelectDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情模态框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="Introducer Details"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border v-if="viewData">
        <el-descriptions-item label="Contact Type">{{ viewData.contactType || 'Introducer' }}</el-descriptions-item>
        <el-descriptions-item label="Contact Nature">{{ viewData.contactNature }}</el-descriptions-item>
        <el-descriptions-item label="Client Relationship Status">{{ viewData.clientRelationshipStatus || '-' }}</el-descriptions-item>
        <template v-if="viewData.contactNature === 'Individual'">
          <el-descriptions-item label="Title">{{ viewData.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="First Name">{{ viewData.firstName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Last Name">{{ viewData.lastName || '-' }}</el-descriptions-item>
        </template>
        <template v-if="viewData.contactNature === 'Corporate'">
          <el-descriptions-item label="Company Name">{{ viewData.companyName || '-' }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="RM">{{ viewData.rm || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ viewData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Mobile Phone">{{ viewData.mobilePhone || '-' }}</el-descriptions-item>
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
import { Plus, User, Message, Phone } from '@element-plus/icons-vue'
import { introducerApi, type Introducer, type CreateIntroducerParams, type UpdateIntroducerParams } from '@/api/introducer'
import { accountApi, type Account } from '@/api/account'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const introducerList = ref<Introducer[]>([])
const newIntroducerDialogVisible = ref(false)
const editIntroducerDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const userSelectDialogVisible = ref(false)
const newIntroducerFormRef = ref<FormInstance>()
const editIntroducerFormRef = ref<FormInstance>()
const viewData = ref<Introducer | null>(null)
const accountList = ref<Account[]>([])
const currentRMFormType = ref<'new' | 'edit'>('new')
const selectedRMUserId = ref<number | null>(null) // 保存选中的 userId

const newIntroducerForm = reactive<CreateIntroducerParams>({
  contactNature: 'Individual',
  contactType: 'Introducer',
  clientRelationshipStatus: '',
  title: '',
  firstName: '',
  lastName: '',
  companyName: '',
  rm: '',
  rmUserId: undefined,
  email: '',
  mobilePhone: ''
})

const editIntroducerForm = reactive<UpdateIntroducerParams & { id?: number }>({
  contactNature: 'Individual',
  contactType: 'Introducer',
  clientRelationshipStatus: '',
  title: '',
  firstName: '',
  lastName: '',
  companyName: '',
  rm: '',
  rmUserId: undefined,
  email: '',
  mobilePhone: ''
})

// 动态表单验证规则 - 新建表单
const newIntroducerFormRules = computed<FormRules>(() => {
  const rules: FormRules = {
    contactNature: [
      { required: true, message: 'Please select contact nature', trigger: 'change' }
    ],
    rm: [
      { required: true, message: 'Please enter RM', trigger: 'blur' }
    ]
  }

  // 根据 Contact Nature 动态添加验证规则
  if (newIntroducerForm.contactNature === 'Individual') {
    rules.title = [{ required: true, message: 'Please select title', trigger: 'change' }]
    rules.firstName = [{ required: true, message: 'Please enter first name', trigger: 'blur' }]
    rules.lastName = [{ required: true, message: 'Please enter last name', trigger: 'blur' }]
  } else if (newIntroducerForm.contactNature === 'Corporate') {
    rules.companyName = [{ required: true, message: 'Please enter company name', trigger: 'blur' }]
  }

  return rules
})

// 动态表单验证规则 - 编辑表单
const editIntroducerFormRules = computed<FormRules>(() => {
  const rules: FormRules = {
    rm: [
      { required: true, message: 'Please enter RM', trigger: 'blur' }
    ]
  }

  // 根据 Contact Nature 动态添加验证规则
  if (editIntroducerForm.contactNature === 'Individual') {
    rules.title = [{ required: true, message: 'Please select title', trigger: 'change' }]
    rules.firstName = [{ required: true, message: 'Please enter first name', trigger: 'blur' }]
    rules.lastName = [{ required: true, message: 'Please enter last name', trigger: 'blur' }]
  } else if (editIntroducerForm.contactNature === 'Corporate') {
    rules.companyName = [{ required: true, message: 'Please enter company name', trigger: 'blur' }]
  }

  return rules
})

// 加载介绍人列表
const loadIntroducers = async () => {
  try {
    const response = await introducerApi.getIntroducers()
    const data = response.data || response || []
    
    // 先加载账户列表，用于根据 rmUserId 查找 RM 名称
    let accountMap = new Map<number, string>()
    try {
      const accountResponse = await accountApi.getAccounts()
      const accounts = accountResponse.data || accountResponse || []
      accounts.forEach((acc: any) => {
        const userId = acc.userId || acc.user_id || acc.id
        const firstName = acc.firstName || acc.first_name || ''
        const lastName = acc.lastName || acc.last_name || ''
        const name = `${firstName}, ${lastName}`.trim() || acc.name || acc.account || ''
        if (userId) {
          accountMap.set(userId, name)
        }
      })
    } catch (error) {
      console.warn('Failed to load accounts for RM mapping:', error)
    }
    
    introducerList.value = data.map((item: any) => {
      // 后端字段映射
      const introducerId = item.introducerId || item.id
      const contactNature = item.contactNature || item.contact_nature || 'Individual'
      const relationshipStatus = item.relationshipStatus || item.relationship_status || ''
      const rmUserId = item.rmUserId || item.rm_user_id || item.userId || item.user_id
      const createdAt = item.createdAt || item.created_at || ''
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true || item.active === 'true'
      
      // 根据类型生成显示名称
      let introducerName = ''
      if (contactNature === 'Individual') {
        const firstName = item.firstName || item.first_name || ''
        const lastName = item.lastName || item.last_name || ''
        introducerName = `${firstName}, ${lastName}`.trim()
      } else {
        introducerName = item.companyName || item.company_name || ''
      }
      
      // 根据 rmUserId 查找 RM 名称
      let rmName = ''
      if (rmUserId && accountMap.has(rmUserId)) {
        rmName = accountMap.get(rmUserId) || ''
      }
      
      return {
        id: introducerId, // 映射自 introducerId
        introducer: introducerName,
        contactNature: contactNature,
        rm: rmName, // 根据 rmUserId 查找的名称
        rmUserId: rmUserId, // 保存 rmUserId
        status: isActive ? 'enabled' : 'disabled',
        isActive: isActive,
        createdTime: createdAt, // 映射自 createdAt
        // 个人字段
        title: item.title || '',
        firstName: item.firstName || item.first_name || '',
        lastName: item.lastName || item.last_name || '',
        // 企业字段
        companyName: item.companyName || item.company_name || '',
        // 公共字段
        contactType: item.contactType || item.contact_type || 'Introducer',
        clientRelationshipStatus: relationshipStatus, // 映射自 relationshipStatus
        email: item.email || '',
        mobilePhone: item.mobilePhone || item.mobile_phone || item.mobile || ''
      }
    })
  } catch (error) {
    console.error('Failed to load introducer list:', error)
    ElMessage.error('Failed to load introducer list')
    introducerList.value = []
  }
}

// 新建介绍人
const handleNewIntroducer = () => {
  // 重置表单
  newIntroducerForm.contactNature = 'Individual'
  newIntroducerForm.contactType = 'Introducer'
  newIntroducerForm.clientRelationshipStatus = ''
  newIntroducerForm.title = ''
  newIntroducerForm.firstName = ''
  newIntroducerForm.lastName = ''
  newIntroducerForm.companyName = ''
  newIntroducerForm.rm = ''
  newIntroducerForm.rmUserId = undefined
  newIntroducerForm.email = ''
  newIntroducerForm.mobilePhone = ''
  selectedRMUserId.value = null
  newIntroducerDialogVisible.value = true
}

// 提交新建介绍人
const handleSubmitNewIntroducer = async () => {
  if (!newIntroducerFormRef.value) return
  
  await newIntroducerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 根据 Contact Nature 构建请求数据
        const requestData: CreateIntroducerParams = {
          contactNature: newIntroducerForm.contactNature,
          contactType: 'Introducer',
          clientRelationshipStatus: newIntroducerForm.clientRelationshipStatus || undefined,
          rm: newIntroducerForm.rm,
          rmUserId: selectedRMUserId.value || newIntroducerForm.rmUserId || undefined,
          email: newIntroducerForm.email || undefined,
          mobilePhone: newIntroducerForm.mobilePhone || undefined
        }

        if (newIntroducerForm.contactNature === 'Individual') {
          requestData.title = newIntroducerForm.title
          requestData.firstName = newIntroducerForm.firstName
          requestData.lastName = newIntroducerForm.lastName
        } else {
          requestData.companyName = newIntroducerForm.companyName
        }

        await introducerApi.createIntroducer(requestData)
        ElMessage.success('Introducer created successfully')
        newIntroducerDialogVisible.value = false
        loadIntroducers()
      } catch (error: any) {
        console.error('Failed to create introducer:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to create introducer'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 编辑介绍人
const handleEdit = async (row: Introducer) => {
  try {
    // 获取详情数据
    const response = await introducerApi.getIntroducerById(row.id)
    const data = response.data || response
    
    // 填充编辑表单（后端字段映射）
    const introducerId = data.introducerId || data.id || row.id
    const relationshipStatus = data.relationshipStatus || data.relationship_status || ''
    const rmUserId = data.rmUserId || data.rm_user_id || data.userId || data.user_id
    
    editIntroducerForm.id = introducerId
    editIntroducerForm.contactNature = data.contactNature || data.contact_nature || row.contactNature
    editIntroducerForm.contactType = data.contactType || data.contact_type || 'Introducer'
    editIntroducerForm.clientRelationshipStatus = relationshipStatus
    editIntroducerForm.rm = row.rm || '' // 使用列表中的 RM 名称
    editIntroducerForm.rmUserId = rmUserId
    editIntroducerForm.email = data.email || ''
    editIntroducerForm.mobilePhone = data.mobilePhone || data.mobile_phone || data.mobile || ''
    selectedRMUserId.value = rmUserId

    if (editIntroducerForm.contactNature === 'Individual') {
      editIntroducerForm.title = data.title || ''
      editIntroducerForm.firstName = data.firstName || data.first_name || ''
      editIntroducerForm.lastName = data.lastName || data.last_name || ''
      editIntroducerForm.companyName = ''
    } else {
      editIntroducerForm.companyName = data.companyName || data.company_name || ''
      editIntroducerForm.title = ''
      editIntroducerForm.firstName = ''
      editIntroducerForm.lastName = ''
    }

    editIntroducerDialogVisible.value = true
  } catch (error: any) {
    console.error('Failed to load introducer details:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to load introducer details'
    ElMessage.error(errorMessage)
  }
}

// 提交编辑介绍人
const handleSubmitEditIntroducer = async () => {
  if (!editIntroducerFormRef.value || !editIntroducerForm.id) return
  
  await editIntroducerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 根据 Contact Nature 构建请求数据
        const requestData: UpdateIntroducerParams = {
          contactNature: editIntroducerForm.contactNature,
          contactType: 'Introducer',
          clientRelationshipStatus: editIntroducerForm.clientRelationshipStatus || undefined,
          rm: editIntroducerForm.rm,
          rmUserId: selectedRMUserId.value || editIntroducerForm.rmUserId || undefined,
          email: editIntroducerForm.email || undefined,
          mobilePhone: editIntroducerForm.mobilePhone || undefined
        }

        if (editIntroducerForm.contactNature === 'Individual') {
          requestData.title = editIntroducerForm.title
          requestData.firstName = editIntroducerForm.firstName
          requestData.lastName = editIntroducerForm.lastName
        } else {
          requestData.companyName = editIntroducerForm.companyName
        }

        await introducerApi.updateIntroducer(editIntroducerForm.id, requestData)
        ElMessage.success('Introducer updated successfully')
        editIntroducerDialogVisible.value = false
        loadIntroducers()
      } catch (error: any) {
        console.error('Failed to update introducer:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to update introducer'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 查看详情
const handleView = async (row: Introducer) => {
  try {
    const response = await introducerApi.getIntroducerById(row.id)
    const data = response.data || response
    
    // 后端字段映射
    const introducerId = data.introducerId || data.id || row.id
    const relationshipStatus = data.relationshipStatus || data.relationship_status || ''
    const createdAt = data.createdAt || data.created_at || row.createdTime
    const isActive = data.isActive === true || data.isActive === 'true' || data.active === true || row.isActive
    
    viewData.value = {
      id: introducerId,
      introducer: row.introducer,
      contactNature: data.contactNature || data.contact_nature || row.contactNature,
      rm: row.rm, // 使用列表中的 RM 名称
      status: isActive ? 'enabled' : 'disabled',
      isActive: isActive,
      createdTime: createdAt,
      title: data.title || '',
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      companyName: data.companyName || data.company_name || '',
      contactType: data.contactType || data.contact_type || 'Introducer',
      clientRelationshipStatus: relationshipStatus,
      email: data.email || '',
      mobilePhone: data.mobilePhone || data.mobile_phone || data.mobile || ''
    }
    
    viewDialogVisible.value = true
  } catch (error: any) {
    console.error('Failed to load introducer details:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to load introducer details'
    ElMessage.error(errorMessage)
  }
}

// 加载账户列表（用于 RM 选择）
const loadAccountsForRM = async () => {
  try {
    const response = await accountApi.getAccounts()
    const data = response.data || response || []
    accountList.value = data.map((item: any) => {
      const firstName = item.firstName || item.first_name || ''
      const lastName = item.lastName || item.last_name || ''
      const userId = item.userId || item.user_id || item.id
      
      return {
        id: userId,
        userId: userId,
        account: item.username || item.account || '',
        firstName: firstName,
        lastName: lastName,
        name: `${firstName}, ${lastName}`, // 格式：firstName, lastName
        isActive: item.isActive === true || item.isActive === 'true' || item.active === true,
        status: item.isActive ? 'enabled' : 'disabled',
        createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || ''
      }
    })
  } catch (error) {
    console.error('Failed to load account list:', error)
    ElMessage.error('Failed to load account list')
    accountList.value = []
  }
}

// 选择 RM
const handleSelectRM = (type: 'new' | 'edit') => {
  currentRMFormType.value = type
  if (accountList.value.length === 0) {
    loadAccountsForRM()
  }
  userSelectDialogVisible.value = true
}

// 账户选择处理
const handleAccountSelect = (account: Account) => {
  // 使用 account 列表页的 name 字段（格式：firstName, lastName）
  const userName = account.name || account.account || ''
  const userId = account.userId || account.id
  
  if (currentRMFormType.value === 'new') {
    newIntroducerForm.rm = userName
    newIntroducerForm.rmUserId = userId
    selectedRMUserId.value = userId
  } else {
    editIntroducerForm.rm = userName
    editIntroducerForm.rmUserId = userId
    selectedRMUserId.value = userId
  }
  
  userSelectDialogVisible.value = false
}

// 状态切换
const handleStatusChange = async (row: Introducer) => {
  const originalIsActive = row.isActive
  try {
    // 使用专门的更新状态 API
    await introducerApi.updateIntroducerStatus(row.id, row.isActive || false)
    
    ElMessage.success(`Introducer ${row.isActive ? 'enabled' : 'disabled'}`)
    row.status = row.isActive ? 'enabled' : 'disabled'
  } catch (error: any) {
    console.error('Failed to update introducer status:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to update introducer status'
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
    if (newPath === '/introducer') {
      loadIntroducers()
    }
  },
  { immediate: false }
)

// 当组件被激活时（从其他路由切换回来时）刷新数据
onActivated(() => {
  loadIntroducers()
})

onMounted(() => {
  loadIntroducers()
})
</script>

<style lang="scss" scoped>
.introducer-page {
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

  .introducer-table {
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

  // Client Relationship Status 行间距调整
  .el-form-item {
    margin-bottom: 20px;

    .el-form-item__label {
      line-height: 1.2;
      word-break: break-word;
      white-space: normal;
      
      // 针对 Client Relationship Status 特殊处理，缩小行间距
      &[for*="clientRelationshipStatus"] {
        line-height: 1.1;
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

// 修复可选字段的星号显示问题
:deep(.el-form-item) {
  // 只有必填字段显示星号
  &.is-required .el-form-item__label::before {
    content: '*';
    color: #f56c6c;
    margin-right: 4px;
  }
  
  // 可选字段不显示星号
  &:not(.is-required) .el-form-item__label::before {
    content: '';
  }
}
</style>

