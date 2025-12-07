<template>
  <div class="client-detail-page">
    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <el-button type="primary" @click="handleSave" :loading="saving">
          Save
        </el-button>
        <span v-if="lastSavedTime" class="last-saved">
          Last saved {{ lastSavedTime }}...
        </span>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.name || 'User' }}</span>
      </div>
    </div>

    <!-- Tab 导航 -->
    <el-tabs v-model="activeTab" class="client-tabs">
      <el-tab-pane label="General" name="general">
        <div class="tab-content">
          <el-form
            ref="clientFormRef"
            :model="clientForm"
            :rules="clientFormRules"
            label-width="200px"
            class="client-form"
          >
            <!-- Client Information Section -->
            <div class="form-section">
              <h3 class="section-title">Client Information</h3>
              <div class="form-row">
                <el-form-item label="Contact Type">
                  <el-input v-model="clientForm.general.contactType" disabled />
                </el-form-item>
                <el-form-item label="Contact Nature" prop="contactNature">
                  <el-select
                    v-model="clientForm.general.contactNature"
                    placeholder="Please select"
                    style="width: 100%"
                    :disabled="isEditMode"
                    @change="handleContactNatureChange"
                  >
                    <el-option label="Individual" value="Individual" />
                    <el-option label="Corporate" value="Corporate" />
                  </el-select>
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item label="Client Id">
                  <el-input v-model="clientForm.general.clientId" placeholder="Please enter client ID" />
                </el-form-item>
                <el-form-item label="Client Relationship Status">
                  <el-select
                    v-model="clientForm.general.clientRelationshipStatus"
                    placeholder="Please select"
                    style="width: 100%"
                  >
                    <el-option label="Prospecting" value="Prospecting" />
                    <el-option label="On Boarding" value="On Boarding" />
                  </el-select>
                </el-form-item>
              </div>

              <!-- Individual 字段 -->
              <template v-if="clientForm.general.contactNature === 'Individual'">
                <div class="form-row">
                  <el-form-item label="Title" prop="title">
                    <el-select v-model="(clientForm.general as any).title" placeholder="Please select" style="width: 100%">
                      <el-option label="Mr." value="Mr." />
                      <el-option label="Mrs." value="Mrs." />
                      <el-option label="Miss" value="Miss" />
                      <el-option label="Dr." value="Dr." />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="RM" prop="rm">
                    <el-input
                      v-model="clientForm.general.rm"
                      placeholder="Please select RM"
                      readonly
                      @click="handleSelectRM"
                      style="cursor: pointer;"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="First Name" prop="firstName">
                    <el-input v-model="(clientForm.general as any).firstName" placeholder="Please enter first name" />
                  </el-form-item>
                  <el-form-item label="Introducer">
                    <el-select
                      v-model="(clientForm.general as any).introducer"
                      placeholder="Please select"
                      style="width: 100%"
                      filterable
                      @focus="loadIntroducersIfNeeded"
                    >
                      <el-option
                        v-for="intro in introducerList"
                        :key="intro.id"
                        :label="intro.introducer"
                        :value="intro.introducer"
                      />
                    </el-select>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Last Name" prop="lastName">
                    <el-input v-model="(clientForm.general as any).lastName" placeholder="Please enter last name" />
                  </el-form-item>
                  <el-form-item label="Gender">
                    <el-radio-group v-model="(clientForm.general as any).gender">
                      <el-radio label="Male">Male</el-radio>
                      <el-radio label="Female">Female</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" />
                  </el-form-item>
                  <el-form-item label="Marital Status">
                    <el-select v-model="(clientForm.general as any).maritalStatus" placeholder="Please select" style="width: 100%">
                      <el-option label="Single" value="Single" />
                      <el-option label="Married" value="Married" />
                      <el-option label="Divorced" value="Divorced" />
                      <el-option label="Widowed" value="Widowed" />
                    </el-select>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Id Type">
                    <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%">
                      <el-option label="Passport" value="Passport" />
                      <el-option label="ID Card" value="ID Card" />
                      <el-option label="Driver License" value="Driver License" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Education Level">
                    <el-select v-model="(clientForm.general as any).educationLevel" placeholder="Please select" style="width: 100%">
                      <el-option label="High School" value="High School" />
                      <el-option label="Bachelor" value="Bachelor" />
                      <el-option label="Master" value="Master" />
                      <el-option label="PhD" value="PhD" />
                    </el-select>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Id No.">
                    <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" />
                  </el-form-item>
                  <el-form-item label="Birthday (dd/mm/yyyy)">
                    <el-date-picker
                      v-model="(clientForm.general as any).birthday"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                    />
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Id Expiry (dd/mm/yyyy)">
                    <el-date-picker
                      v-model="(clientForm.general as any).idExpiry"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="Country/Region of Birth">
                    <el-input
                      v-model="(clientForm.general as any).countryOfBirth"
                      placeholder="Please enter country/region"
                    >
                      <template #suffix>
                        <el-icon><Globe /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Dual Citizenship">
                    <el-switch
                      v-model="(clientForm.general as any).dualCitizenship"
                      :active-value="true"
                      :inactive-value="false"
                    />
                    <span style="margin-left: 8px;">{{ (clientForm.general as any).dualCitizenship ? 'Yes' : 'No' }}</span>
                  </el-form-item>
                  <el-form-item label="Nationality">
                    <el-input
                      v-model="(clientForm.general as any).nationality"
                      placeholder="Please enter nationality"
                    >
                      <template #suffix>
                        <el-icon><Globe /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>
              </template>

              <!-- Corporate 字段 -->
              <template v-else>
                <div class="form-row">
                  <el-form-item label="Company Name" prop="companyName">
                    <el-input v-model="(clientForm.general as any).companyName" placeholder="Please enter company name" />
                  </el-form-item>
                  <el-form-item label="RM" prop="rm">
                    <el-input
                      v-model="clientForm.general.rm"
                      placeholder="Please select RM"
                      readonly
                      @click="handleSelectRM"
                      style="cursor: pointer;"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Corporate Type">
                    <el-select v-model="(clientForm.general as any).corporateType" placeholder="Please select" style="width: 100%">
                      <el-option label="Limited Company" value="Limited Company" />
                      <el-option label="Corporation" value="Corporation" />
                      <el-option label="Partnership" value="Partnership" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Introducer">
                    <el-select
                      v-model="(clientForm.general as any).introducer"
                      placeholder="Please select"
                      style="width: 100%"
                      filterable
                      @focus="loadIntroducersIfNeeded"
                    >
                      <el-option
                        v-for="intro in introducerList"
                        :key="intro.id"
                        :label="intro.introducer"
                        :value="intro.introducer"
                      />
                    </el-select>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Industry">
                    <el-select v-model="(clientForm.general as any).industry" placeholder="Please select" style="width: 100%">
                      <el-option label="Finance" value="Finance" />
                      <el-option label="Technology" value="Technology" />
                      <el-option label="Manufacturing" value="Manufacturing" />
                      <el-option label="Retail" value="Retail" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Chinese Name">
                    <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" />
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="State Owned">
                    <el-switch
                      v-model="(clientForm.general as any).stateOwned"
                      :active-value="true"
                      :inactive-value="false"
                    />
                    <span style="margin-left: 8px;">{{ (clientForm.general as any).stateOwned ? 'Yes' : 'No' }}</span>
                  </el-form-item>
                  <el-form-item label="Id Type">
                    <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%">
                      <el-option label="Business License" value="Business License" />
                      <el-option label="Registration Certificate" value="Registration Certificate" />
                    </el-select>
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Id No.">
                    <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" />
                  </el-form-item>
                  <el-form-item label="Date of Company Search/COI Issued (dd/mm/yyyy)">
                    <el-date-picker
                      v-model="(clientForm.general as any).dateOfCompanySearch"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                    />
                  </el-form-item>
                </div>

                <div class="form-row">
                  <el-form-item label="Country/Region of Registration">
                    <el-input
                      v-model="(clientForm.general as any).countryOfRegistration"
                      placeholder="Please enter country/region"
                    >
                      <template #suffix>
                        <el-icon><Globe /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>
              </template>
            </div>

            <!-- Contact Section -->
            <div class="form-section">
              <h3 class="section-title">Contact</h3>
              <div class="form-row">
                <el-form-item label="Mobile Phone">
                  <el-input v-model="clientForm.contact.mobilePhone" placeholder="Please enter mobile phone">
                    <template #suffix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Primary Email">
                  <el-input v-model="clientForm.contact.primaryEmail" placeholder="Please enter email">
                    <template #suffix>
                      <el-icon><Message /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item label="Home Phone">
                  <el-input v-model="clientForm.contact.homePhone" placeholder="Please enter home phone">
                    <template #suffix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                  <el-switch
                    v-model="clientForm.contact.jurisdictionDiffers"
                    :active-value="true"
                    :inactive-value="false"
                  />
                  <span style="margin-left: 8px;">{{ clientForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item label="Address" style="width: 100%;">
                  <el-input
                    v-model="clientForm.contact.address"
                    type="textarea"
                    :rows="3"
                    placeholder="Please enter address"
                  />
                </el-form-item>
              </div>
            </div>

            <!-- Portfolio Section -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Portfolio</h3>
                <el-button type="primary" :icon="Plus" @click="handleNewPortfolio">
                  New Portfolio
                </el-button>
              </div>

              <el-table
                v-if="clientForm.portfolios && clientForm.portfolios.length > 0"
                :data="clientForm.portfolios"
                stripe
                style="width: 100%"
              >
                <el-table-column prop="bank" label="Bank" width="200" />
                <el-table-column prop="bookingCentre" label="Booking Centre" width="200" />
                <el-table-column prop="portfolioNo" label="Portfolio No." width="200" />
                <el-table-column label="Upload Time" width="200">
                  <template #default="{ row }">
                    {{ formatDateTime(row.uploadTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="Actions" width="150">
                  <template #default="{ row, $index }">
                    <el-link type="primary" @click="handleEditPortfolio(row, $index)" :underline="false">
                      Edit
                    </el-link>
                    <el-divider direction="vertical" />
                    <el-link type="primary" @click="handleDeletePortfolio($index)" :underline="false">
                      Delete
                    </el-link>
                  </template>
                </el-table-column>
              </el-table>
              <div v-else class="empty-portfolio">
                <p>No portfolios yet. Click "New Portfolio" to add one.</p>
              </div>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="KYC" name="kyc">
        <div class="tab-content">
          <p>KYC content will be added later.</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Investment Risk Profile" name="risk">
        <div class="tab-content">
          <p>Investment Risk Profile content will be added later.</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Documents" name="documents">
        <div class="tab-content">
          <p>Documents content will be added later.</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Fee Schedule" name="fee">
        <div class="tab-content">
          <p>Fee Schedule content will be added later.</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- RM 选择对话框 -->
    <el-dialog
      v-model="rmSelectDialogVisible"
      title="Select RM"
      width="600px"
    >
      <el-table
        :data="accountList"
        stripe
        style="width: 100%"
        @row-click="handleRMSelect"
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
        <el-button @click="rmSelectDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>

    <!-- Portfolio 对话框 -->
    <el-dialog
      v-model="portfolioDialogVisible"
      :title="editingPortfolioIndex !== null ? 'Edit Portfolio' : 'New Portfolio'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="portfolioFormRef"
        :model="portfolioForm"
        :rules="portfolioFormRules"
        label-width="140px"
      >
        <el-form-item label="Bank" prop="bank" required>
          <el-select 
            v-model="portfolioForm.bank" 
            placeholder="Please select bank" 
            style="width: 100%" 
            filterable
            @focus="loadBanksIfNeeded"
          >
            <el-option
              v-for="bank in bankList"
              :key="bank.id"
              :label="bank.bank"
              :value="bank.bank"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Booking Centre" prop="bookingCentre" required>
          <el-select v-model="portfolioForm.bookingCentre" placeholder="Please select booking centre" style="width: 100%" filterable>
            <el-option
              v-for="centre in availableBookingCentres"
              :key="centre"
              :label="centre"
              :value="centre"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Portfolio No." prop="portfolioNo" required>
          <el-input v-model="portfolioForm.portfolioNo" placeholder="Please enter portfolio number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="portfolioDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitPortfolio">Submit</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, Plus, User, Phone, Message, Globe } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userClientApi, type Client, type IndividualGeneralInfo, type CorporateGeneralInfo, type CreateClientParams } from '@/api/user/client'
import { portfolioApi, type Portfolio, type CreatePortfolioParams } from '@/api/user/portfolio'
import { accountApi, type Account } from '@/api/account'
import { introducerApi, type Introducer } from '@/api/introducer'
import { bankApi, type BankCentre } from '@/api/bank'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const clientId = computed(() => {
  const id = route.params.id as string
  return id === 'new' ? null : parseInt(id)
})
const isEditMode = computed(() => clientId.value !== null)
const isViewMode = computed(() => route.path.includes('/view'))

const activeTab = ref('general')
const saving = ref(false)
const lastSavedTime = ref<string | null>(null)
const clientFormRef = ref<FormInstance>()
const portfolioFormRef = ref<FormInstance>()

// 表单数据
const clientForm = reactive<CreateClientParams & { portfolios: Portfolio[] }>({
  contactNature: 'Individual',
  general: {
    contactType: 'Client',
    contactNature: 'Individual',
    firstName: '',
    lastName: '',
    rm: ''
  } as IndividualGeneralInfo,
  contact: {
    mobilePhone: '',
    homePhone: '',
    primaryEmail: '',
    address: '',
    jurisdictionDiffers: false
  },
  portfolios: []
})

// RM 和 Introducer 选择
const rmSelectDialogVisible = ref(false)
const accountList = ref<Account[]>([])
const introducerList = ref<Introducer[]>([])
const bankList = ref<BankCentre[]>([])

// Portfolio 管理
const portfolioDialogVisible = ref(false)
const editingPortfolioIndex = ref<number | null>(null)
const portfolioForm = reactive<CreatePortfolioParams>({
  clientId: 0,
  bank: '',
  bookingCentre: '',
  portfolioNo: ''
})

// 可用的 Booking Centres（根据选择的 Bank 动态获取）
const availableBookingCentres = computed(() => {
  const selectedBank = bankList.value.find(b => b.bank === portfolioForm.bank)
  if (selectedBank) {
    return selectedBank.bookingCentres
      .filter(c => c.isActive)
      .map(c => c.name)
  }
  return []
})

// 表单验证规则
const clientFormRules = computed<FormRules>(() => {
  const rules: FormRules = {
    contactNature: [
      { required: true, message: 'Please select contact nature', trigger: 'change' }
    ],
    rm: [
      { required: true, message: 'Please select RM', trigger: 'blur' }
    ]
  }

  if (clientForm.general.contactNature === 'Individual') {
    rules.title = [{ required: true, message: 'Please select title', trigger: 'change' }]
    rules.firstName = [{ required: true, message: 'Please enter first name', trigger: 'blur' }]
    rules.lastName = [{ required: true, message: 'Please enter last name', trigger: 'blur' }]
  } else {
    rules.companyName = [{ required: true, message: 'Please enter company name', trigger: 'blur' }]
  }

  return rules
})

const portfolioFormRules: FormRules = {
  bank: [
    { required: true, message: 'Please select bank', trigger: 'change' }
  ],
  bookingCentre: [
    { required: true, message: 'Please select booking centre', trigger: 'change' }
  ],
  portfolioNo: [
    { required: true, message: 'Please enter portfolio number', trigger: 'blur' }
  ]
}

// 加载数据
const loadClient = async () => {
  if (!clientId.value) return

  try {
    const response = await userClientApi.getClientById(clientId.value)
    const data = response.data || response

    // 填充表单数据
    clientForm.contactNature = data.contactNature || data.contact_nature || 'Individual'
    clientForm.general = data.general || {}
    clientForm.contact = data.contact || {}
    
    // 加载 Portfolio 列表
    try {
      const portfolioResponse = await portfolioApi.getPortfolios(clientId.value)
      const portfolios = portfolioResponse.data || portfolioResponse || []
      clientForm.portfolios = portfolios.map((item: any) => ({
        id: item.id,
        bank: item.bank || '',
        bookingCentre: item.bookingCentre || item.booking_centre || '',
        portfolioNo: item.portfolioNo || item.portfolio_no || '',
        uploadTime: item.uploadTime || item.upload_time || item.createdAt || item.created_at || ''
      }))
    } catch (error) {
      console.warn('Failed to load portfolios:', error)
      clientForm.portfolios = []
    }
  } catch (error: any) {
    console.error('Failed to load client:', error)
    ElMessage.error('Failed to load client details')
  }
}

const loadAccounts = async () => {
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
        name: `${firstName}, ${lastName}`,
        isActive: item.isActive === true || item.isActive === 'true' || item.active === true,
        status: item.isActive ? 'enabled' : 'disabled',
        createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || ''
      }
    })
  } catch (error) {
    console.error('Failed to load accounts:', error)
  }
}

const loadIntroducers = async () => {
  try {
    const response = await introducerApi.getIntroducers()
    const data = response.data || response || []
    introducerList.value = data.map((item: any) => {
      const contactNature = item.contactNature || item.contact_nature || 'Individual'
      let introducerName = ''
      if (contactNature === 'Individual') {
        const firstName = item.firstName || item.first_name || ''
        const lastName = item.lastName || item.last_name || ''
        introducerName = `${firstName}, ${lastName}`.trim()
      } else {
        introducerName = item.companyName || item.company_name || ''
      }

      return {
        id: item.introducerId || item.id,
        introducer: introducerName,
        contactNature: contactNature
      }
    })
  } catch (error) {
    console.error('Failed to load introducers:', error)
  }
}

const loadBanks = async () => {
  try {
    const response = await bankApi.getBanks()
    const data = response.data || response || []
    bankList.value = data.map((item: any) => {
      const bankId = item.bankId || item.id
      const bankName = item.bankName || item.bank || ''
      const centres = item.centres || item.bookingCentres || []
      const isEnabled = item.isEnabled === true || item.isEnabled === 'true' || item.isActive === true

      return {
        id: bankId,
        bank: bankName,
        bookingCentres: centres.map((centre: any) => ({
          name: typeof centre === 'string' ? centre : (centre.name || ''),
          isActive: typeof centre === 'string' ? true : (centre.isEnabled === true || centre.isEnabled === 'true' || centre.isActive === true)
        })),
        bookingCentresDisplay: centres.map((c: any) => (typeof c === 'string' ? c : c.name)).join(', '),
        status: isEnabled ? 'enabled' : 'disabled',
        isActive: isEnabled,
        createdTime: item.createdAt || item.created_at || ''
      }
    })
  } catch (error) {
    console.error('Failed to load banks:', error)
  }
}

// 处理函数
const handleBack = () => {
  router.push('/user/client')
}

const handleContactNatureChange = () => {
  // 切换 Contact Nature 时重置 General 信息
  if (clientForm.general.contactNature === 'Individual') {
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Individual',
      firstName: '',
      lastName: '',
      rm: clientForm.general.rm || ''
    } as IndividualGeneralInfo
  } else {
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Corporate',
      companyName: '',
      rm: clientForm.general.rm || ''
    } as CorporateGeneralInfo
  }
}

const loadIntroducersIfNeeded = () => {
  if (introducerList.value.length === 0) {
    loadIntroducers()
  }
}

const loadBanksIfNeeded = () => {
  if (bankList.value.length === 0) {
    loadBanks()
  }
}

const handleSelectRM = () => {
  if (accountList.value.length === 0) {
    loadAccounts()
  }
  rmSelectDialogVisible.value = true
}

const handleRMSelect = (account: Account) => {
  clientForm.general.rm = account.name || account.account || ''
  ;(clientForm.general as any).rmUserId = account.userId || account.id
  rmSelectDialogVisible.value = false
}

const handleSave = async () => {
  if (!clientFormRef.value) return

  await clientFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        let currentClientId = clientId.value
        
        if (isEditMode.value && currentClientId) {
          // 更新现有 Client
          await userClientApi.updateClient(currentClientId, clientForm)
          ElMessage.success('Client updated successfully')
        } else {
          // 创建新 Client
          const response = await userClientApi.createClient(clientForm)
          const responseData = response.data || response
          // 尝试多种可能的字段名获取 ID
          const newId = responseData.id || 
                       responseData.clientId || 
                       responseData.data?.id || 
                       responseData.data?.clientId ||
                       (typeof responseData === 'number' ? responseData : null)
          
          if (!newId) {
            console.error('Response data:', responseData)
            throw new Error('Failed to get client ID from response')
          }
          
          currentClientId = newId
          ElMessage.success('Client created successfully')
          
          // 如果有未保存的 Portfolio，现在保存它们
          const unsavedPortfolios = clientForm.portfolios.filter(p => !p.id)
          if (unsavedPortfolios.length > 0 && currentClientId) {
            for (const portfolio of unsavedPortfolios) {
              try {
                const portfolioResponse = await portfolioApi.createPortfolio({
                  clientId: currentClientId,
                  bank: portfolio.bank,
                  bookingCentre: portfolio.bookingCentre,
                  portfolioNo: portfolio.portfolioNo
                })
                const portfolioData = portfolioResponse.data || portfolioResponse
                const portfolioId = portfolioData.id || portfolioData.data?.id
                if (portfolioId) {
                  portfolio.id = portfolioId
                }
              } catch (error) {
                console.error('Failed to save portfolio:', error)
              }
            }
          }
          
          // 确保跳转到编辑页面
          if (currentClientId) {
            // 使用 nextTick 确保状态更新后再跳转
            await nextTick()
            // 使用 push 而不是 replace，确保路由历史正确
            await router.push(`/user/client/${currentClientId}/edit`)
          } else {
            throw new Error('Client ID is missing after creation')
          }
        }
        
        // 更新最后保存时间
        const now = new Date()
        const minutes = now.getMinutes()
        lastSavedTime.value = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      } catch (error: any) {
        console.error('Failed to save client:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to save client'
        ElMessage.error(errorMessage)
      } finally {
        saving.value = false
      }
    }
  })
}

const handleNewPortfolio = () => {
  editingPortfolioIndex.value = null
  portfolioForm.clientId = clientId.value || 0
  portfolioForm.bank = ''
  portfolioForm.bookingCentre = ''
  portfolioForm.portfolioNo = ''
  portfolioDialogVisible.value = true
}

const handleEditPortfolio = (portfolio: Portfolio, index: number) => {
  editingPortfolioIndex.value = index
  portfolioForm.clientId = clientId.value || 0
  portfolioForm.bank = portfolio.bank
  portfolioForm.bookingCentre = portfolio.bookingCentre
  portfolioForm.portfolioNo = portfolio.portfolioNo
  portfolioDialogVisible.value = true
}

const handleDeletePortfolio = async (index: number) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this portfolio?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    const portfolio = clientForm.portfolios[index]
    if (portfolio.id && clientId.value) {
      await portfolioApi.deletePortfolio(clientId.value, portfolio.id)
    }
    
    clientForm.portfolios.splice(index, 1)
    ElMessage.success('Portfolio deleted successfully')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete portfolio:', error)
      ElMessage.error('Failed to delete portfolio')
    }
  }
}

const handleSubmitPortfolio = async () => {
  if (!portfolioFormRef.value) return

  await portfolioFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingPortfolioIndex.value !== null) {
          // 编辑模式
          const portfolio = clientForm.portfolios[editingPortfolioIndex.value]
          if (portfolio.id && clientId.value) {
            await portfolioApi.updatePortfolio(clientId.value, portfolio.id, portfolioForm)
          }
          Object.assign(portfolio, {
            bank: portfolioForm.bank,
            bookingCentre: portfolioForm.bookingCentre,
            portfolioNo: portfolioForm.portfolioNo,
            uploadTime: new Date().toISOString()
          })
          ElMessage.success('Portfolio updated successfully')
        } else {
          // 新建模式
          if (clientId.value) {
            portfolioForm.clientId = clientId.value
            const response = await portfolioApi.createPortfolio(portfolioForm)
            const newPortfolio: Portfolio = {
              id: (response.data || response).id,
              bank: portfolioForm.bank,
              bookingCentre: portfolioForm.bookingCentre,
              portfolioNo: portfolioForm.portfolioNo,
              uploadTime: new Date().toISOString()
            }
            clientForm.portfolios.push(newPortfolio)
            ElMessage.success('Portfolio created successfully')
          } else {
            // 如果还没有保存 Client，先添加到本地数组
            clientForm.portfolios.push({
              bank: portfolioForm.bank,
              bookingCentre: portfolioForm.bookingCentre,
              portfolioNo: portfolioForm.portfolioNo,
              uploadTime: new Date().toISOString()
            })
            ElMessage.success('Portfolio added successfully')
          }
        }
        portfolioDialogVisible.value = false
      } catch (error: any) {
        console.error('Failed to save portfolio:', error)
        const errorMessage = error.message || error.response?.data?.message || 'Failed to save portfolio'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 监听 Bank 变化，更新可用的 Booking Centres
watch(() => portfolioForm.bank, () => {
  portfolioForm.bookingCentre = ''
})

onMounted(async () => {
  // 新建模式下，完全不加载任何数据，页面立即渲染
  // 编辑模式下，只加载必要的 client 数据
  if (isEditMode.value) {
    await loadClient()
  }
  
  // 下拉选项数据完全按需加载，不在 onMounted 中加载
  // 这些数据只在用户点击对应的选择器时才加载
})
</script>

<style lang="scss" scoped>
.client-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;

  .top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .last-saved {
        color: #909399;
        font-size: 14px;
        margin-left: 8px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;
    }
  }

  .client-tabs {
    flex: 1;
    background-color: #fff;
    margin: 20px;
    border-radius: 4px;
    padding: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      padding: 0 20px;
    }
  }

  .tab-content {
    min-height: 400px;
  }

  .client-form {
    .form-section {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #e4e7ed;

      &:last-child {
        border-bottom: none;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
    }

    .empty-portfolio {
      text-align: center;
      padding: 40px;
      color: #909399;
    }
  }
}

:deep(.el-dialog) {
  .el-form-item.is-required {
    .el-form-item__label {
      &::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
    }
  }
}
</style>

