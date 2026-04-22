<template>
  <div class="introducer-detail-page" v-loading.fullscreen="pageLoading" element-loading-text="Loading...">
    <div class="top-header">
      <div class="top-header__leading">
        <el-button :icon="ArrowLeft" circle class="top-header__back" @click="handleBack" />
        <h1 class="top-header__title">{{ headerTitle }}</h1>
      </div>
      <div class="top-header__actions">
        <template v-if="isViewMode">
          <el-button type="primary" @click="goEdit" v-if="introducerNumericId">Edit</el-button>
        </template>
        <template v-else>
          <el-button type="primary" :disabled="saving" @click="() => handleSave(false)">Save</el-button>
          <el-button :disabled="saving" @click="() => handleSave(true)">Save & Close</el-button>
        </template>
      </div>
    </div>

    <div class="introducer-tabs-wrap">
      <el-tabs v-model="activeTab" class="introducer-tabs">
        <el-tab-pane label="General" name="general">
          <div class="tab-content">
            <IntroducerDetailGeneral
              ref="generalFormRef"
              :full-form="fullForm"
              :is-view-mode="isViewMode"
              :introducer-numeric-id="introducerNumericId"
              :lock-contact-nature="!!introducerNumericId"
              :introducer-list="introducerList"
              :form-rules="formRules"
              @open-rm="openRmDialog"
              @open-arm="openArmDialog"
              @load-introducers="loadIntroducersIfNeeded"
              @change-nature="syncNatureToGeneral"
              @new-portfolio="handleNewPortfolio"
              @edit-portfolio="handleEditPortfolio"
              @delete-portfolio="handleDeletePortfolio"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="KYC" name="kyc">
          <div class="tab-content" v-loading.fullscreen="tabLoading.kyc" element-loading-text="Loading KYC data...">
            <div class="kyc-information-card">
              <h3 class="kyc-information-title">Information</h3>
              <el-form label-width="200px" class="kyc-information-form">
                <div class="kyc-info-rows">
                  <div class="kyc-info-row">
                    <el-form-item label="KYC Date (dd/mm/yyyy)">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(kycData.kycDate) }}</span>
                      </template>
                      <template v-else>
                        <el-date-picker
                          v-model="kycData.kycDate"
                          type="date"
                          placeholder="Select date"
                          format="DD/MM/YYYY"
                          value-format="DD/MM/YYYY"
                          class="kyc-info-input"
                          :disabled="isViewMode"
                        />
                      </template>
                    </el-form-item>
                    <el-form-item label="KYC Status">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(kycData.kycStatus) }}</span>
                      </template>
                      <template v-else>
                        <el-select v-model="kycData.kycStatus" placeholder="Please select" class="kyc-info-input" clearable>
                          <el-option label="completed" value="completed" />
                          <el-option label="incompleted" value="incompleted" />
                        </el-select>
                      </template>
                    </el-form-item>
                  </div>
                  <div class="kyc-info-row">
                    <el-form-item label="Next Review Date (dd/mm/yyyy)">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(kycData.nextReviewDate) }}</span>
                      </template>
                      <template v-else>
                        <el-date-picker
                          v-model="kycData.nextReviewDate"
                          type="date"
                          placeholder="Select date"
                          format="DD/MM/YYYY"
                          value-format="DD/MM/YYYY"
                          class="kyc-info-input"
                          :disabled="isViewMode"
                        />
                      </template>
                    </el-form-item>
                    <el-form-item label=" "></el-form-item>
                  </div>
                </div>
              </el-form>
            </div>
            <div class="kyc-section">
              <div class="kyc-upload-header">
                <h3 class="kyc-upload-title">Supporting Documents</h3>
                <el-button v-if="!isViewMode" class="crm-upload-action crm-upload-action--asset" type="primary" link aria-label="Upload" @click="handleUploadKYCDocument('SUPPORTING_DOCUMENT')">
                  <img class="crm-upload-action__asset" :src="crmUploadActionImg" alt="" />
                </el-button>
              </div>
              <el-table v-if="kycData.documents?.length" :data="kycData.documents" stripe style="width: 100%">
                <el-table-column prop="document" label="Document" />
                <el-table-column prop="size" label="Size" width="150" />
                <el-table-column label="Upload Time" width="200">
                  <template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <el-link type="primary" @click="handleOpenKYCDocument(row)" :underline="false">Open</el-link>
                    <el-divider direction="vertical" />
                    <el-link v-if="!isViewMode" type="primary" @click="handleDeleteKYCDocument(row, 'documents')" :underline="false"
                      >Delete</el-link
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="kyc-section">
              <div class="kyc-upload-header">
                <h3 class="kyc-upload-title">Name Screening Documents</h3>
                <el-button v-if="!isViewMode" class="crm-upload-action crm-upload-action--asset" type="primary" link aria-label="Upload" @click="handleUploadKYCDocument('NAME_SCREENING')">
                  <img class="crm-upload-action__asset" :src="crmUploadActionImg" alt="" />
                </el-button>
              </div>
              <el-table
                v-if="kycData.nameScreeningDocuments?.length"
                :data="kycData.nameScreeningDocuments"
                stripe
                style="width: 100%"
              >
                <el-table-column prop="document" label="Document" />
                <el-table-column prop="size" label="Size" width="150" />
                <el-table-column label="Upload Time" width="200">
                  <template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template>
                </el-table-column>
                <el-table-column label="Actions" width="200">
                  <template #default="{ row }">
                    <el-link type="primary" @click="handleOpenKYCDocument(row)" :underline="false">Open</el-link>
                    <el-divider direction="vertical" />
                    <el-link
                      v-if="!isViewMode"
                      type="primary"
                      @click="handleDeleteKYCDocument(row, 'nameScreeningDocuments')"
                      :underline="false"
                      >Delete</el-link
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Documents" name="documents">
          <div class="tab-content" v-loading.fullscreen="tabLoading.documents" element-loading-text="Loading documents...">
            <div v-for="sec in documentSections" :key="sec.key" class="document-section">
              <div class="section-header">
                <h3 class="section-title">{{ sec.title }}</h3>
                <el-button v-if="!isViewMode" class="crm-upload-action crm-upload-action--asset" type="primary" link aria-label="Upload" @click="handleUploadDocument(sec.key)">
                  <img class="crm-upload-action__asset" :src="crmUploadActionImg" alt="" />
                </el-button>
              </div>
              <el-table v-if="documentsData[sec.key]?.length" :data="documentsData[sec.key]" stripe style="width: 100%">
                <el-table-column prop="document" label="Document" />
                <el-table-column prop="size" label="Size" width="150" />
                <el-table-column label="Upload Time" width="200">
                  <template #default="{ row }">{{ formatDateTime(row.uploadTime) }}</template>
                </el-table-column>
                <el-table-column label="Action" width="200">
                  <template #default="{ row }">
                    <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">Open</el-link>
                    <template v-if="!isViewMode">
                      <el-divider direction="vertical" />
                      <el-link type="primary" @click="handleDeleteDocument(row)" :underline="false">Delete</el-link>
                    </template>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Fee Schedule" name="fee">
          <div class="tab-content" v-loading.fullscreen="tabLoading.fee" element-loading-text="Loading fee schedule...">
            <el-form :model="feeScheduleData" label-width="250px" class="fee-schedule-form">
              <div class="form-section">
                <!-- 2×2 网格：行1 Management | Referral，行2 Retrocessions | Others（与示意一致） -->
                <div class="fee-schedule-grid">
                  <div class="fee-schedule-cell">
                    <div class="vulnerable-question-item">
                      <div class="question-label">Management Fee</div>
                      <div class="question-control">
                        <template v-if="isViewMode">
                          <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.managementFee.enabled) }}</span>
                        </template>
                        <template v-else>
                          <el-switch v-model="feeScheduleData.managementFee.enabled" :active-value="true" :inactive-value="false" />
                          <span class="fee-switch-yesno">{{ feeScheduleData.managementFee.enabled ? 'Yes' : 'No' }}</span>
                        </template>
                      </div>
                      <template v-if="feeScheduleData.managementFee.enabled">
                        <div class="fee-form-items">
                          <div class="fee-form-item">
                            <div class="fee-form-label">Yearly Management Fee (%)</div>
                            <span v-if="isViewMode" class="view-mode-text">{{
                              formatDisplayValue(feeScheduleData.managementFee.yearlyManagementFee)
                            }}</span>
                            <el-input
                              v-else
                              v-model.number="feeScheduleData.managementFee.yearlyManagementFee"
                              type="number"
                              class="fee-input"
                            />
                          </div>
                          <div class="fee-form-item">
                            <div class="fee-form-label">Minimum Management Fee (p.a.)</div>
                            <span v-if="isViewMode" class="view-mode-text">{{
                              formatDisplayValue(feeScheduleData.managementFee.minimumManagementFee)
                            }}</span>
                            <el-input
                              v-else
                              v-model.number="feeScheduleData.managementFee.minimumManagementFee"
                              type="number"
                              class="fee-input"
                            />
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <div class="fee-schedule-cell">
                    <div class="vulnerable-question-item">
                      <div class="question-label">Referral Fee</div>
                      <div class="question-control">
                        <template v-if="isViewMode">
                          <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.referralFee.enabled) }}</span>
                        </template>
                        <template v-else>
                          <el-switch v-model="feeScheduleData.referralFee.enabled" :active-value="true" :inactive-value="false" />
                          <span class="fee-switch-yesno">{{ feeScheduleData.referralFee.enabled ? 'Yes' : 'No' }}</span>
                        </template>
                      </div>
                      <template v-if="feeScheduleData.referralFee.enabled">
                        <div class="fee-form-items">
                          <div class="fee-form-item">
                            <div class="fee-form-label">Hurdle Rate (%)</div>
                            <span v-if="isViewMode" class="view-mode-text">{{
                              formatDisplayValue(feeScheduleData.referralFee.hurdleRate)
                            }}</span>
                            <el-input
                              v-else
                              v-model.number="feeScheduleData.referralFee.hurdleRate"
                              type="number"
                              class="fee-input"
                            />
                          </div>
                          <div class="fee-form-item">
                            <div class="fee-form-label">Profit shared to XinXi (%)</div>
                            <span v-if="isViewMode" class="view-mode-text">{{
                              formatDisplayValue(feeScheduleData.referralFee.profitSharedToXinXi)
                            }}</span>
                            <el-input
                              v-else
                              v-model.number="feeScheduleData.referralFee.profitSharedToXinXi"
                              type="number"
                              class="fee-input"
                            />
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>

                  <div class="fee-schedule-cell">
                    <div class="vulnerable-question-item">
                      <div class="question-label">Retrocessions</div>
                      <div class="question-control">
                        <template v-if="isViewMode">
                          <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.retrocession.enabled) }}</span>
                        </template>
                        <template v-else>
                          <el-switch v-model="feeScheduleData.retrocession.enabled" :active-value="true" :inactive-value="false" />
                          <span class="fee-switch-yesno">{{ feeScheduleData.retrocession.enabled ? 'Yes' : 'No' }}</span>
                        </template>
                      </div>
                    </div>
                  </div>

                  <div class="fee-schedule-cell">
                    <div class="vulnerable-question-item">
                      <div class="question-label">Others</div>
                      <div class="question-control">
                        <template v-if="isViewMode">
                          <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.others.enabled) }}</span>
                        </template>
                        <template v-else>
                          <el-switch v-model="feeScheduleData.others.enabled" :active-value="true" :inactive-value="false" />
                          <span class="fee-switch-yesno">{{ feeScheduleData.others.enabled ? 'Yes' : 'No' }}</span>
                        </template>
                      </div>
                      <template v-if="feeScheduleData.others.enabled">
                        <div class="fee-form-items">
                          <div class="fee-form-item">
                            <div class="fee-form-label">Details</div>
                            <span v-if="isViewMode" class="view-mode-text" style="white-space: pre-wrap">{{
                              formatDisplayValue(feeScheduleData.others.details)
                            }}</span>
                            <el-input v-else v-model="feeScheduleData.others.details" type="textarea" :rows="4" />
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="rmDialogVisible" title="Select RM" width="600px" :close-on-click-modal="false">
      <el-table :data="accountList" stripe style="width: 100%" highlight-current-row @row-click="onSelectRm">
        <el-table-column prop="account" label="Account" width="180" />
        <el-table-column prop="name" label="Name" width="200" />
        <el-table-column label="Created Time" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createdTime) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="rmDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="armDialogVisible" title="Select ARM" width="600px" :close-on-click-modal="false">
      <el-table :data="accountList" stripe style="width: 100%" highlight-current-row @row-click="onSelectArm">
        <el-table-column prop="account" label="Account" width="180" />
        <el-table-column prop="name" label="Name" width="200" />
        <el-table-column label="Created Time" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.createdTime) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="armDialogVisible = false">Cancel</el-button>
      </template>
    </el-dialog>

    <!-- Portfolio 对话框（与 Client 详情页一致） -->
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
            @focus="loadBanksIfNeeded()"
          >
            <el-option
              v-for="bank in visibleBanks"
              :key="bank.id"
              :label="bank.bank"
              :value="bank.bank"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Booking Centre" prop="bookingCentre" required>
          <el-select v-model="portfolioForm.bookingCentre" placeholder="Please select booking centre" style="width: 100%" filterable>
            <el-option v-for="centre in availableBookingCentres" :key="centre" :label="centre" :value="centre" />
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

    <el-dialog
      v-model="documentUploadDialogVisible"
      class="document-upload-dialog"
      :title="documentUploadTitle"
      width="500px"
      align-center
      :close-on-click-modal="false"
    >
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-exceed="handleFileExceed"
        v-model:file-list="fileList"
        :limit="10"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">Drag & drop files here, or <em>click to upload</em></div>
        <div class="el-upload__tip">PDF, JPEG or PNG — up to 10 files per batch. Max 100MB per file.</div>
      </el-upload>
      <template #footer>
        <el-button @click="documentUploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitDocumentUpload" :disabled="uploading">Upload</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, UploadFilled } from '@element-plus/icons-vue'
import crmUploadActionImg from '@/assets/crm-upload-action.png'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus'
import IntroducerDetailGeneral from './IntroducerDetailGeneral.vue'
import {
  introducerApi,
  type Introducer,
  type IntroducerFullPayload,
  type IntroducerContactSection,
  type CreateIntroducerParams
} from '@/api/introducer'
import { accountApi, type Account } from '@/api/account'
import { introducerKycApi, type IntroducerKYCData, type KYCDocument } from '@/api/introducer-kyc'
import {
  introducerDocumentsApi,
  type IntroducerDocument,
  type IntroducerDocumentType,
  type IntroducerDocumentsData
} from '@/api/introducer-documents'
import { introducerFeeScheduleApi, type IntroducerFeeSchedule } from '@/api/introducer-fee-schedule'
import { bankApi, type BankCentre } from '@/api/bank'
import { formatDateTime } from '@/utils/date'
import { formatFileSizeMb } from '@/utils/file-size'
import { isAdminRole } from '@/utils/roles'

const route = useRoute()
const router = useRouter()

const pageLoading = ref(false)
const saving = ref(false)
const activeTab = ref('general')
const generalFormRef = ref<{ formRef?: { validate: () => Promise<boolean> } } | null>(null)
const rmDialogVisible = ref(false)
const armDialogVisible = ref(false)
const accountList = ref<Account[]>([])
const introducerList = ref<Introducer[]>([])

const portfolioDialogVisible = ref(false)
const editingPortfolioIndex = ref<number | null>(null)
const portfolioFormRef = ref<FormInstance>()
const portfolioForm = reactive({ bank: '', bookingCentre: '', portfolioNo: '' })

const bankList = ref<BankCentre[]>([])

const visibleBanks = computed(() => {
  const currentBank = portfolioForm.bank
  return (bankList.value || []).filter((bank: BankCentre) => {
    if (!bank) return false
    return bank.isActive || bank.bank === currentBank
  })
})

const availableBookingCentres = computed(() => {
  const selectedBank = bankList.value.find(b => b.bank === portfolioForm.bank)
  if (selectedBank) {
    return selectedBank.bookingCentres.filter(c => c.isActive).map(c => c.name)
  }
  return []
})

const portfolioFormRules = computed<FormRules>(() => ({
  bank: [{ required: true, message: 'Please select bank', trigger: 'change' }],
  bookingCentre: [{ required: true, message: 'Please select booking centre', trigger: 'change' }],
  portfolioNo: [{ required: true, message: 'Please enter portfolio number', trigger: 'blur' }]
}))

const introducerNumericId = computed(() => {
  const raw = route.params.id as string | undefined
  if (!raw || raw === 'new') return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
})

const isViewMode = computed(() => route.name === 'IntroducerView')
const isNew = computed(() => route.name === 'IntroducerNew')

const documentSections: { key: keyof IntroducerDocumentsData; title: string }[] = [
  { key: 'identity', title: 'Identity Proof' },
  { key: 'address', title: 'Address Proof' },
  { key: 'forms', title: 'Forms' },
  { key: 'others', title: 'Others Documents' }
]

const tabLoading = reactive({
  kyc: false,
  documents: false,
  fee: false
})

const kycData = reactive<IntroducerKYCData>({
  kycDate: '',
  kycStatus: '',
  nextReviewDate: '',
  documents: [],
  nameScreeningDocuments: []
})

const documentsData = reactive<IntroducerDocumentsData>({
  identity: [],
  address: [],
  forms: [],
  others: []
})

const documentUploadDialogVisible = ref(false)
const documentUploadType = ref<IntroducerDocumentType | 'kyc'>('identity')
const kycUploadDocumentType = ref<'SUPPORTING_DOCUMENT' | 'NAME_SCREENING'>('SUPPORTING_DOCUMENT')
const documentUploadTitle = computed(() => {
  if (documentUploadType.value === 'kyc') {
    return kycUploadDocumentType.value === 'NAME_SCREENING' ? 'Name Screening Documents' : 'Supporting Documents'
  }
  const titles: Record<IntroducerDocumentType, string> = {
    identity: 'Identity Proof',
    address: 'Address Proof',
    forms: 'Forms',
    others: 'Others Documents'
  }
  return titles[documentUploadType.value as IntroducerDocumentType]
})
const uploadRef = ref()
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

function emptyContact(): IntroducerContactSection {
  return {
    title: '',
    firstName: '',
    lastName: '',
    chineseName: '',
    idType: '',
    idNo: '',
    idExpiry: '',
    mobilePhone: '',
    homePhone: '',
    primaryEmail: '',
    address: '',
    jurisdictionDiffers: false
  }
}

const fullForm = reactive<IntroducerFullPayload>({
  contactNature: 'Corporate',
  general: {
    contactType: 'Introducer',
    contactNature: 'Corporate',
    clientRelationshipStatus: '',
    rm: '',
    arm: '',
    rmUserId: undefined,
    armUserId: undefined,
    linkedIntroducerId: undefined,
    companyName: '',
    corporateType: '',
    industry: '',
    stateOwned: false,
    chineseName: '',
    idType: '',
    idNo: '',
    dateOfCompanySearch: '',
    countryOfRegistration: '',
    businessDomicile: '',
    registrationDate: '',
    gender: '',
    maritalStatus: '',
    educationLevel: '',
    birthday: '',
    countryOfBirth: '',
    dualCitizenship: false,
    nationality: '',
    secondaryNationality: '',
    title: '',
    firstName: '',
    lastName: '',
    indChineseName: '',
    indIdType: '',
    indIdNo: '',
    indIdExpiry: ''
  },
  contact: emptyContact(),
  secondaryContact: emptyContact(),
  portfolios: []
})

const feeScheduleData = reactive<IntroducerFeeSchedule>({
  managementFee: {
    enabled: false,
    yearlyManagementFee: undefined,
    minimumManagementFee: undefined
  },
  retrocession: { enabled: false },
  referralFee: {
    enabled: false,
    hurdleRate: undefined,
    profitSharedToXinXi: undefined
  },
  others: { enabled: false, details: '' }
})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    contactNature: [{ required: true, message: 'Please select contact nature', trigger: 'change' }],
    'general.rm': [{ required: true, message: 'Please select RM', trigger: 'blur' }]
  }
  if (fullForm.contactNature === 'Individual') {
    rules['general.title'] = [{ required: true, message: 'Please select title', trigger: 'change' }]
    rules['general.firstName'] = [{ required: true, message: 'Please enter first name', trigger: 'blur' }]
    rules['general.lastName'] = [{ required: true, message: 'Please enter last name', trigger: 'blur' }]
  } else {
    rules['general.companyName'] = [{ required: true, message: 'Please enter company name', trigger: 'blur' }]
  }
  return rules
})

const headerTitle = computed(() => {
  if (isNew.value) return 'New Introducer'
  if (fullForm.contactNature === 'Corporate') return (fullForm.general.companyName || '').trim() || 'Introducer'
  const fn = (fullForm.general.firstName || '').trim()
  const ln = (fullForm.general.lastName || '').trim()
  const name = [fn, ln].filter(Boolean).join(' ')
  return name || 'Introducer'
})

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function resetFullFormForNew() {
  kycData.kycDate = ''
  kycData.kycStatus = ''
  kycData.nextReviewDate = ''
  kycData.documents = []
  kycData.nameScreeningDocuments = []
  documentsData.identity = []
  documentsData.address = []
  documentsData.forms = []
  documentsData.others = []
  feeScheduleData.managementFee = { enabled: false, yearlyManagementFee: undefined, minimumManagementFee: undefined }
  feeScheduleData.retrocession = { enabled: false }
  feeScheduleData.referralFee = { enabled: false, hurdleRate: undefined, profitSharedToXinXi: undefined }
  feeScheduleData.others = { enabled: false, details: '' }
  delete (feeScheduleData as any).__id
  delete (feeScheduleData as any).__hasExisting
  delete (feeScheduleData as any).__lastUpdatedAt

  fullForm.contactNature = 'Corporate'
  fullForm.general = {
    contactType: 'Introducer',
    contactNature: 'Corporate',
    clientRelationshipStatus: '',
    rm: '',
    arm: '',
    rmUserId: undefined,
    armUserId: undefined,
    linkedIntroducerId: undefined,
    companyName: '',
    corporateType: '',
    industry: '',
    stateOwned: false,
    chineseName: '',
    idType: '',
    idNo: '',
    dateOfCompanySearch: '',
    countryOfRegistration: '',
    businessDomicile: '',
    registrationDate: '',
    gender: '',
    maritalStatus: '',
    educationLevel: '',
    birthday: '',
    countryOfBirth: '',
    dualCitizenship: false,
    nationality: '',
    secondaryNationality: '',
    title: '',
    firstName: '',
    lastName: '',
    indChineseName: '',
    indIdType: '',
    indIdNo: '',
    indIdExpiry: ''
  }
  fullForm.contact = emptyContact()
  fullForm.secondaryContact = emptyContact()
  fullForm.portfolios = []
}

function applyFullPayload(data: Record<string, unknown>) {
  const g = (data.general || {}) as Record<string, unknown>
  fullForm.contactNature = (data.contactNature || g.contactNature || 'Individual') as 'Individual' | 'Corporate'
  fullForm.general = {
    contactType: 'Introducer',
    contactNature: fullForm.contactNature,
    clientRelationshipStatus: (g.clientRelationshipStatus || '') as string,
    introducerIdDisplay: (g.introducerIdDisplay || '') as string,
    rm: (g.rm || '') as string,
    arm: (g.arm || '') as string,
    rmUserId: g.rmUserId as number | undefined,
    armUserId: g.armUserId as number | undefined,
    linkedIntroducerId: (g.linkedIntroducerId as number | undefined) ?? undefined,
    companyName: (g.companyName || '') as string,
    corporateType: (g.corporateType || '') as string,
    industry: (g.industry || '') as string,
    stateOwned: (g.stateOwned as boolean) ?? false,
    chineseName: (g.chineseName || '') as string,
    idType: (g.idType || '') as string,
    idNo: (g.idNo || '') as string,
    dateOfCompanySearch: (g.dateOfCompanySearch || '') as string,
    countryOfRegistration: (g.countryOfRegistration || '') as string,
    businessDomicile: (g.businessDomicile || '') as string,
    registrationDate: (g.registrationDate || '') as string,
    gender: (g.gender || '') as string,
    maritalStatus: (g.maritalStatus || '') as string,
    educationLevel: (g.educationLevel || '') as string,
    birthday: (g.birthday || '') as string,
    countryOfBirth: (g.countryOfBirth || '') as string,
    dualCitizenship: (g.dualCitizenship as boolean) ?? false,
    nationality: (g.nationality || '') as string,
    secondaryNationality: (g.secondaryNationality || '') as string,
    title: (g.title || '') as string,
    firstName: (g.firstName || '') as string,
    lastName: (g.lastName || '') as string,
    indChineseName: (g.indChineseName || '') as string,
    indIdType: (g.indIdType || '') as string,
    indIdNo: (g.indIdNo || '') as string,
    indIdExpiry: (g.indIdExpiry || '') as string
  }
  const c = (data.contact || {}) as Record<string, unknown>
  fullForm.contact = {
    title: (c.title || '') as string,
    firstName: (c.firstName || '') as string,
    lastName: (c.lastName || '') as string,
    chineseName: (c.chineseName || '') as string,
    idType: (c.idType || '') as string,
    idNo: (c.idNo || '') as string,
    idExpiry: (c.idExpiry || '') as string,
    mobilePhone: (c.mobilePhone || '') as string,
    homePhone: (c.homePhone || '') as string,
    primaryEmail: (c.primaryEmail || '') as string,
    address: (c.address || '') as string,
    jurisdictionDiffers: (c.jurisdictionDiffers as boolean) ?? false
  }
  const s = (data.secondaryContact || {}) as Record<string, unknown>
  fullForm.secondaryContact = {
    title: (s.title || '') as string,
    firstName: (s.firstName || '') as string,
    lastName: (s.lastName || '') as string,
    chineseName: (s.chineseName || '') as string,
    idType: (s.idType || '') as string,
    idNo: (s.idNo || '') as string,
    idExpiry: (s.idExpiry || '') as string,
    mobilePhone: (s.mobilePhone || '') as string,
    homePhone: (s.homePhone || '') as string,
    primaryEmail: (s.primaryEmail || '') as string,
    address: (s.address || '') as string,
    jurisdictionDiffers: (s.jurisdictionDiffers as boolean) ?? false
  }
  const ports = (data.portfolios || []) as Record<string, unknown>[]
  fullForm.portfolios = ports.map(p => ({
    id: p.id as number | undefined,
    bank: (p.bank || '') as string,
    bookingCentre: (p.bookingCentre || '') as string,
    portfolioNo: (p.portfolioNo || '') as string,
    uploadTime: (p.uploadTime || '') as string
  }))
}

function buildSavePayload(overrideIntroducerId?: number | null): IntroducerFullPayload {
  fullForm.general.contactNature = fullForm.contactNature
  const id = overrideIntroducerId ?? introducerNumericId.value ?? undefined
  return {
    introducerId: id,
    contactNature: fullForm.contactNature,
    general: { ...fullForm.general },
    contact: { ...fullForm.contact },
    secondaryContact: { ...fullForm.secondaryContact },
    portfolios: fullForm.portfolios.map(p => ({ ...p }))
  }
}

function syncNatureToGeneral() {
  fullForm.general.contactNature = fullForm.contactNature
}

async function loadAccountsForRM() {
  const response = await accountApi.getAccounts()
  const data = (response as { data?: unknown }).data ?? response
  const list = Array.isArray(data) ? data : []
  accountList.value = list
    .filter((item: Record<string, unknown>) => {
      const role = item.role as string | undefined
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true
      return !isAdminRole(role || '') && isActive
    })
    .map((item: Record<string, unknown>) => {
      const firstName = (item.firstName || item.first_name || '') as string
      const lastName = (item.lastName || item.last_name || '') as string
      const userId = (item.userId || item.user_id || item.id) as number
      return {
        id: userId,
        userId,
        account: (item.username || item.account || '') as string,
        name: `${firstName}, ${lastName}`.trim() || (item.account as string),
        createdTime: (item.createdTime || item.created_time || item.createdAt || item.created_at || '') as string
      } as Account
    })
}

async function loadIntroducersIfNeeded() {
  if (introducerList.value.length > 0) return
  const res = await introducerApi.getIntroducers()
  const raw = (res as { data?: unknown }).data ?? res
  const list = Array.isArray(raw) ? raw : []
  introducerList.value = list.map((row: Record<string, unknown>) => {
    const id = (row.introducerId ?? row.id) as number
    const nature = (row.contactNature || row.contact_nature || 'Individual') as string
    const fn = (row.firstName || row.first_name || '') as string
    const ln = (row.lastName || row.last_name || '') as string
    const company = (row.companyName || row.company_name || '') as string
    let label = ''
    if (nature === 'Corporate' || company) label = company || `${fn} ${ln}`.trim()
    else label = [fn, ln].filter(Boolean).join(' ') || company || `Introducer #${id}`
    return {
      id,
      introducer: label,
      contactNature: nature as 'Individual' | 'Corporate',
      rm: '',
      status: (row.isActive === false ? 'disabled' : 'enabled') as 'enabled' | 'disabled',
      isActive: row.isActive !== false
    } as Introducer
  })
}

async function loadIntroducerTabsData() {
  const id = introducerNumericId.value
  if (!id || isNew.value) return
  const nature = fullForm.contactNature as 'Individual' | 'Corporate'

  kycData.kycDate = ''
  kycData.kycStatus = ''
  kycData.nextReviewDate = ''
  kycData.documents = []
  kycData.nameScreeningDocuments = []
  documentsData.identity = []
  documentsData.address = []
  documentsData.forms = []
  documentsData.others = []
  feeScheduleData.managementFee = { enabled: false, yearlyManagementFee: undefined, minimumManagementFee: undefined }
  feeScheduleData.retrocession = { enabled: false }
  feeScheduleData.referralFee = { enabled: false, hurdleRate: undefined, profitSharedToXinXi: undefined }
  feeScheduleData.others = { enabled: false, details: '' }
  delete (feeScheduleData as any).__id
  delete (feeScheduleData as any).__hasExisting
  delete (feeScheduleData as any).__lastUpdatedAt

  tabLoading.kyc = true
  try {
    const kyc = await introducerKycApi.getKYC(id, nature)
    kycData.kycDate = kyc.kycDate ?? ''
    kycData.kycStatus = kyc.kycStatus ?? ''
    kycData.nextReviewDate = kyc.nextReviewDate ?? ''
    kycData.documents = kyc.documents || []
    kycData.nameScreeningDocuments = kyc.nameScreeningDocuments || []
  } catch (e) {
    console.warn('Failed to load introducer KYC:', e)
    kycData.documents = []
    kycData.nameScreeningDocuments = []
  } finally {
    tabLoading.kyc = false
  }

  tabLoading.documents = true
  try {
    const docs = await introducerDocumentsApi.getDocuments(id, nature)
    documentsData.identity = docs.identity || []
    documentsData.address = docs.address || []
    documentsData.forms = docs.forms || []
    documentsData.others = docs.others || []
  } catch (e) {
    console.warn('Failed to load introducer documents:', e)
  } finally {
    tabLoading.documents = false
  }

  tabLoading.fee = true
  try {
    const fee = await introducerFeeScheduleApi.getFeeSchedule(id, nature)
    if (fee.managementFee) Object.assign(feeScheduleData.managementFee, fee.managementFee)
    if (fee.retrocession) Object.assign(feeScheduleData.retrocession, fee.retrocession)
    if (fee.referralFee) Object.assign(feeScheduleData.referralFee, fee.referralFee)
    if (fee.others) Object.assign(feeScheduleData.others, fee.others)
    ;(feeScheduleData as any).__id = (fee as any).__id ?? null
    ;(feeScheduleData as any).__hasExisting = (fee as any).__hasExisting === true
    ;(feeScheduleData as any).__lastUpdatedAt = (fee as any).__lastUpdatedAt || null
  } catch (e) {
    console.warn('Failed to load introducer fee schedule:', e)
  } finally {
    tabLoading.fee = false
  }
}

async function loadDetail() {
  if (isNew.value || !introducerNumericId.value) {
    resetFullFormForNew()
    return
  }
  pageLoading.value = true
  try {
    await loadAccountsForRM()
    await loadIntroducersIfNeeded()
    const response = await introducerApi.getIntroducerFull(introducerNumericId.value)
    const raw = (response as { data?: Record<string, unknown> }).data ?? (response as Record<string, unknown>)
    applyFullPayload(raw)
    await loadIntroducerTabsData()
  } catch (e: unknown) {
    console.error(e)
    ElMessage.error('Failed to load introducer')
    router.push('/introducer')
  } finally {
    pageLoading.value = false
  }
}

function handleBack() {
  router.push('/introducer')
}

function goEdit() {
  if (!introducerNumericId.value) return
  router.push(`/introducer/${introducerNumericId.value}/edit`)
}

function openRmDialog() {
  if (accountList.value.length === 0) {
    void loadAccountsForRM().then(() => {
      rmDialogVisible.value = true
    })
  } else {
    rmDialogVisible.value = true
  }
}

function openArmDialog() {
  if (accountList.value.length === 0) {
    void loadAccountsForRM().then(() => {
      armDialogVisible.value = true
    })
  } else {
    armDialogVisible.value = true
  }
}

function onSelectRm(row: Account) {
  const userName = row.name || row.account || ''
  const userId = row.userId || row.id
  fullForm.general.rm = userName
  fullForm.general.rmUserId = userId as number
  rmDialogVisible.value = false
}

function onSelectArm(row: Account) {
  const userName = row.name || row.account || ''
  const userId = row.userId || row.id
  fullForm.general.arm = userName
  fullForm.general.armUserId = userId as number
  armDialogVisible.value = false
}

async function loadBanks() {
  try {
    const response = await bankApi.getBanks()
    const data = response.data || response || []
    bankList.value = data.map((item: Record<string, unknown>) => {
      const bankId = item.bankId || item.id
      const bankName = item.bankName || item.bank || ''
      const centres = (item.centres || item.bookingCentres || []) as unknown[]
      const isEnabled =
        item.isEnabled === true || item.isEnabled === 'true' || item.isActive === true

      return {
        id: bankId as number,
        bank: bankName as string,
        bookingCentres: centres.map((centre: unknown) => {
          const c = centre as Record<string, unknown>
          return {
            name: typeof centre === 'string' ? centre : String(c.name || ''),
            isActive:
              typeof centre === 'string'
                ? true
                : c.isEnabled === true || c.isEnabled === 'true' || c.isActive === true
          }
        }),
        bookingCentresDisplay: centres.map((c: unknown) => (typeof c === 'string' ? c : (c as { name?: string }).name)).join(', '),
        status: isEnabled ? ('enabled' as const) : ('disabled' as const),
        isActive: isEnabled as boolean,
        createdTime: String(item.createdAt || item.created_at || '')
      } as BankCentre
    })
  } catch (error) {
    console.error('Failed to load banks:', error)
  }
}

function loadBanksIfNeeded() {
  if (bankList.value.length === 0) {
    void loadBanks()
  }
}

function handleNewPortfolio() {
  editingPortfolioIndex.value = null
  portfolioForm.bank = ''
  portfolioForm.bookingCentre = ''
  portfolioForm.portfolioNo = ''
  portfolioDialogVisible.value = true
  nextTick(() => portfolioFormRef.value?.clearValidate())
}

async function handleEditPortfolio(row: Record<string, unknown>, index: number) {
  editingPortfolioIndex.value = index

  portfolioForm.bank = ''
  portfolioForm.bookingCentre = ''
  portfolioForm.portfolioNo = ''

  if (bankList.value.length === 0) {
    await loadBanks()
  }

  portfolioForm.bank = (row.bank as string) || ''
  await nextTick()
  portfolioForm.bookingCentre = (row.bookingCentre as string) || ''
  portfolioForm.portfolioNo = (row.portfolioNo as string) || ''
  portfolioDialogVisible.value = true
  nextTick(() => portfolioFormRef.value?.clearValidate())
}

async function handleDeletePortfolio(index: number) {
  try {
    await ElMessageBox.confirm(
      'This action cannot be undone. Are you sure you want to delete this?',
      '',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        center: true,
        customClass: 'kyc-delete-confirm-dialog',
        confirmButtonClass: 'kyc-delete-confirm-btn',
        showClose: false
      }
    )
    fullForm.portfolios.splice(index, 1)
    ElMessage.success('Portfolio deleted successfully')
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to delete portfolio:', error)
    }
  }
}

function handleSubmitPortfolio() {
  const form = portfolioFormRef.value
  if (!form) return

  void form.validate(valid => {
    if (!valid) return

    const row = {
      bank: portfolioForm.bank.trim(),
      bookingCentre: portfolioForm.bookingCentre?.trim() || '',
      portfolioNo: portfolioForm.portfolioNo.trim(),
      uploadTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }

    if (editingPortfolioIndex.value != null) {
      const prev = fullForm.portfolios[editingPortfolioIndex.value]
      fullForm.portfolios[editingPortfolioIndex.value] = { ...prev, ...row }
      ElMessage.success('Portfolio updated successfully')
    } else {
      fullForm.portfolios.push(row)
      ElMessage.success('Portfolio added successfully')
    }
    portfolioDialogVisible.value = false
  })
}

function validateUploadFile(file: File): string | null {
  const name = file.name.toLowerCase()
  const extOk = name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
  const mime = (file.type || '').toLowerCase()
  const mimeOk =
    !mime ||
    mime === 'application/pdf' ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/png' ||
    mime === 'application/x-pdf'
  if (!extOk) return 'Only PDF, JPEG and PNG files are allowed'
  if (!mimeOk) return 'Only PDF, JPEG and PNG files are allowed'
  if (file.size > 100 * 1024 * 1024) return 'File size cannot exceed 100MB'
  return null
}

const handleFileChange = (file: UploadFile, _uploadFiles: UploadFiles) => {
  if (!file.raw) return
  const msg = validateUploadFile(file.raw)
  if (msg) {
    ElMessage.error(msg)
    nextTick(() => uploadRef.value?.handleRemove(file))
  }
}

const handleFileExceed = () => {
  ElMessage.warning('At most 10 files per batch')
}

const collectUploadFiles = (): File[] => {
  const list = fileList.value
  const fromRaw = list.map(f => f.raw).filter((f): f is File => f instanceof File)
  if (fromRaw.length) return fromRaw
  return list
    .map(f => (f as UploadFile & { file?: File }).file)
    .filter((f): f is File => f instanceof File)
}

const handleUploadKYCDocument = (type: 'SUPPORTING_DOCUMENT' | 'NAME_SCREENING' = 'SUPPORTING_DOCUMENT') => {
  if (!introducerNumericId.value) {
    ElMessage.warning('Please save the introducer first')
    return
  }
  documentUploadType.value = 'kyc'
  kycUploadDocumentType.value = type
  fileList.value = []
  documentUploadDialogVisible.value = true
}

const handleOpenKYCDocument = async (document: KYCDocument) => {
  const id = introducerNumericId.value
  if (!id || !document.id) {
    ElMessage.warning('Document ID is missing')
    return
  }
  try {
    const response = await introducerKycApi.getKYCDocument(id, document.id)
    const blobData = (response as any).data || response
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (e) {
    console.error(e)
    ElMessage.error('Failed to open document')
  }
}

const handleDeleteKYCDocument = async (document: KYCDocument, listKey: 'documents' | 'nameScreeningDocuments') => {
  const id = introducerNumericId.value
  if (!id || !document.id) return
  try {
    await ElMessageBox.confirm('This action cannot be undone. Are you sure you want to delete this?', '', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      center: true,
      showClose: false
    })
    await introducerKycApi.deleteKYCDocument(id, document.id)
    const list = kycData[listKey]
    const index = list.findIndex((d: KYCDocument) => d.id === document.id)
    if (index > -1) list.splice(index, 1)
    ElMessage.success('Document deleted successfully')
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('Failed to delete document')
    }
  }
}

const handleUploadDocument = (type: IntroducerDocumentType) => {
  if (!introducerNumericId.value) {
    ElMessage.warning('Please save the introducer first')
    return
  }
  documentUploadType.value = type
  fileList.value = []
  documentUploadDialogVisible.value = true
}

const handleOpenDocument = async (document: IntroducerDocument) => {
  const id = introducerNumericId.value
  if (!id || !document.id) {
    ElMessage.warning('Document ID is missing')
    return
  }
  try {
    const response = await introducerDocumentsApi.getDocument(id, document.id)
    const blobData = (response as any).data || response
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (e) {
    console.error(e)
    ElMessage.error('Failed to open document')
  }
}

const handleDeleteDocument = async (document: IntroducerDocument) => {
  const id = introducerNumericId.value
  if (!id || !document.id) return
  try {
    await ElMessageBox.confirm('This action cannot be undone. Are you sure you want to delete this?', '', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      center: true,
      showClose: false
    })
    await introducerDocumentsApi.deleteDocument(id, document.id)
    const key = document.type
    const index = documentsData[key].findIndex(d => d.id === document.id)
    if (index > -1) documentsData[key].splice(index, 1)
    ElMessage.success('Document deleted successfully')
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('Failed to delete document')
    }
  }
}

const handleSubmitDocumentUpload = async () => {
  const files = collectUploadFiles()
  const iid = introducerNumericId.value
  const nature = fullForm.contactNature as 'Individual' | 'Corporate'
  if (!files.length || !iid) {
    ElMessage.warning('Please select at least one file')
    return
  }

  uploading.value = true
  try {
    if (documentUploadType.value === 'kyc') {
      const docType = kycUploadDocumentType.value
      const targetList = docType === 'NAME_SCREENING' ? kycData.nameScreeningDocuments : kycData.documents

      const appendKycDocs = (saved: any[]) => {
        saved.forEach((data: any, idx: number) => {
          const file = files[idx]
          const docId = data.documentId || data.id
          if (!docId) return
          targetList.push({
            id: docId,
            document: data.originalFilename || data.document || file?.name || '',
            size: formatFileSizeMb(file?.size ?? 0),
            uploadTime: data.uploadTime || data.createdAt || new Date().toISOString()
          })
        })
      }

      if (files.length === 1) {
        const response = await introducerKycApi.uploadKYCDocument(iid, nature, files[0], docType)
        const raw = (response as any).data ?? response
        const saved = Array.isArray(raw) ? raw : [raw]
        appendKycDocs(saved)
      } else {
        const response = await introducerKycApi.uploadKYCDocumentsBatch(iid, nature, files, docType)
        const saved = (response as any).data
        if (!Array.isArray(saved)) {
          ElMessage.error('Unexpected server response for batch upload')
          return
        }
        appendKycDocs(saved)
      }
    } else {
      const docTypeKey = documentUploadType.value as IntroducerDocumentType
      const targetList = documentsData[docTypeKey]

      const appendDocs = (saved: any[]) => {
        saved.forEach((data: any, idx: number) => {
          const file = files[idx]
          const docId = data.documentId || data.id
          if (!docId) return
          targetList.push({
            id: docId,
            document: data.originalFilename || data.document || file?.name || '',
            size: formatFileSizeMb(file?.size ?? 0),
            uploadTime: data.uploadTime || data.createdAt || new Date().toISOString(),
            type: docTypeKey
          })
        })
      }

      if (files.length === 1) {
        const response = await introducerDocumentsApi.uploadDocument(iid, nature, docTypeKey, files[0])
        const raw = (response as any).data ?? response
        const saved = Array.isArray(raw) ? raw : [raw]
        appendDocs(saved)
      } else {
        const response = await introducerDocumentsApi.uploadDocumentsBatch(iid, nature, docTypeKey, files)
        const saved = (response as any).data
        if (!Array.isArray(saved)) {
          ElMessage.error('Unexpected server response for batch upload')
          return
        }
        appendDocs(saved)
      }
    }
    ElMessage.success(files.length > 1 ? `${files.length} documents uploaded successfully` : 'Document uploaded successfully')
    documentUploadDialogVisible.value = false
    fileList.value = []
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || error.response?.data?.message || 'Failed to upload document')
  } finally {
    uploading.value = false
  }
}

async function handleSave(closeAfter: boolean) {
  const inner = generalFormRef.value?.formRef
  if (!inner) return
  try {
    await inner.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    if (isNew.value) {
      const minPayload: CreateIntroducerParams = {
        contactNature: fullForm.contactNature,
        contactType: 'Introducer',
        clientRelationshipStatus: fullForm.general.clientRelationshipStatus || undefined,
        rm: fullForm.general.rm,
        rmUserId: fullForm.general.rmUserId,
        email: fullForm.contact.primaryEmail || undefined,
        mobilePhone: fullForm.contact.mobilePhone || undefined
      }
      if (fullForm.contactNature === 'Individual') {
        minPayload.title = fullForm.general.title
        minPayload.firstName = fullForm.general.firstName
        minPayload.lastName = fullForm.general.lastName
      } else {
        minPayload.companyName = fullForm.general.companyName
      }
      const res = (await introducerApi.createIntroducer(minPayload)) as Record<string, unknown>
      const created = (res.data as Record<string, unknown> | undefined) ?? res
      const newId = (created.introducerId ?? created.id) as number | undefined
      if (newId == null) {
        ElMessage.error('Create succeeded but no id returned')
        return
      }
      await introducerApi.saveIntroducerFull(newId, buildSavePayload(newId))
      try {
        await introducerKycApi.updateKYC(newId, fullForm.contactNature as 'Individual' | 'Corporate', kycData)
      } catch (e) {
        console.warn('Failed to save introducer KYC:', e)
      }
      try {
        await introducerFeeScheduleApi.updateFeeSchedule(newId, feeScheduleData, fullForm.contactNature as 'Individual' | 'Corporate')
      } catch (e) {
        console.warn('Failed to save introducer fee:', e)
      }
      ElMessage.success('Introducer created successfully')
      if (closeAfter) {
        router.push('/introducer')
      } else {
        router.replace(`/introducer/${newId}/edit`)
      }
      return
    }

    if (!introducerNumericId.value) return
    await introducerApi.saveIntroducerFull(introducerNumericId.value, buildSavePayload())
    try {
      await introducerKycApi.updateKYC(
        introducerNumericId.value,
        fullForm.contactNature as 'Individual' | 'Corporate',
        kycData
      )
    } catch (e) {
      console.warn('Failed to save introducer KYC:', e)
    }
    try {
      await introducerFeeScheduleApi.updateFeeSchedule(
        introducerNumericId.value,
        feeScheduleData,
        fullForm.contactNature as 'Individual' | 'Corporate'
      )
    } catch (e) {
      console.warn('Failed to save introducer fee:', e)
    }
    ElMessage.success('Introducer updated successfully')
    if (closeAfter) {
      router.push('/introducer')
    } else {
      await loadDetail()
    }
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || err.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    void loadDetail()
  },
  { immediate: true }
)

onMounted(() => {
  void loadAccountsForRM()
})
</script>

<style lang="scss" scoped>
.introducer-detail-page {
  min-height: 100%;
  background-color: var(--crm-surface-page, #f1f5f9);
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 24px 12px;
  background-color: var(--crm-surface-page, #f1f5f9);

  .top-header__leading {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .top-header__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--crm-text-primary, #0f172a);
    line-height: 1.35;
    word-break: break-word;
  }

  .top-header__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
}

.introducer-tabs-wrap {
  margin: 4px 24px 12px;
}

.introducer-tabs {
  background: #fff;
  border-radius: var(--crm-radius-md, 8px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 0;

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 12px 16px 0;
    background: #fff;
    border-radius: 6px 6px 0 0;
  }

  :deep(.el-tabs__content) {
    padding: 12px 0;
    background: var(--crm-surface-page, #f1f5f9);
  }
}

.tab-content {
  min-height: 200px;
  padding: 12px 16px 20px;
  background: var(--crm-surface-page, #f1f5f9);
}

.introducer-form {
  max-width: 960px;
}

.form-section {
  background: #fff;
  padding: 16px 20px;
  border-radius: 4px;
}

.view-mode-text {
  color: #303133;
  font-size: 14px;
}

.id-placeholder {
  color: #909399;
  font-size: 14px;
}

.doc-block {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 4px;
  padding: 12px 16px;

  &__head {
    margin-bottom: 8px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.kyc-information-card {
  background: #fff;
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.kyc-information-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
.kyc-info-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kyc-info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.kyc-section {
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 4px;
}
.kyc-upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.kyc-upload-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.document-section {
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 4px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.fee-schedule-form {
  .form-section {
    padding: 0;
  }
}

/* Fee Schedule：2×2 网格，标签在上、开关在下左对齐 */
.fee-schedule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 56px;
  row-gap: 36px;
  padding: 24px 28px;
  background: #fff;
  border-radius: 8px;
  box-sizing: border-box;
  align-items: start;
}

.fee-schedule-cell {
  min-width: 0;
}

.vulnerable-question-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  .question-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    line-height: 1.5;
    margin: 0;
  }

  .question-control {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
  }
}

.fee-switch-yesno {
  font-size: 14px;
  color: #606266;
}

.fee-form-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.fee-form-item {
  .fee-form-label {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }
}

.fee-schedule-cell .fee-input {
  width: 100%;
  max-width: 360px;
}
</style>
