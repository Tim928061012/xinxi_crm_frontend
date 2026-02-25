<template>
  <div class="client-detail-page">
    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <!-- View 模式下显示 Edit 按钮（仅普通用户，admin 没有编辑功能） -->
        <template v-if="isViewMode && route.path.startsWith('/user/client/')">
          <el-button type="primary" @click="handleEdit">
            Edit
          </el-button>
        </template>
        <!-- Edit/New 模式下显示保存按钮 -->
        <template v-else>
          <el-button type="primary" @click="() => handleSave(false)" :loading="saving">
            Save
          </el-button>
          <el-button @click="() => handleSave(true)" :loading="saving">
            Save & Close
          </el-button>
        </template>
        <span v-if="currentTabLastSaved" class="last-saved">
          {{ currentTabLastSaved }}
        </span>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>{{ authStore.user?.username || authStore.user?.account || 'User' }}</span>
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

              <!-- Individual 字段 -->
              <template v-if="clientForm.general.contactNature === 'Individual'">
                <!-- 第1行: Contact Type, RM -->
                <div class="form-row">
                  <el-form-item label="Contact Type">
                    <el-input v-model="clientForm.general.contactType" disabled />
                  </el-form-item>
                  <el-form-item label="RM" prop="general.rm">
                    <el-input
                      v-model="clientForm.general.rm"
                      placeholder="Please select RM"
                      :readonly="isViewMode"
                      :disabled="isViewMode"
                      @click.native.stop="!isViewMode && handleSelectRM()"
                      :style="isViewMode ? '' : 'cursor: pointer;'"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <!-- 第2行: Contact Nature, ARM -->
                <div class="form-row">
                  <el-form-item label="Contact Nature" prop="general.contactNature">
                    <el-select
                      v-model="clientForm.general.contactNature"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isEditMode || isViewMode"
                      @change="handleContactNatureChange"
                    >
                      <el-option label="Individual" value="Individual" />
                      <el-option label="Corporate" value="Corporate" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="ARM">
                    <el-input
                      v-model="(clientForm.general as any).arm"
                      placeholder="Please select ARM"
                      :readonly="isViewMode"
                      :disabled="isViewMode"
                      @click.native.stop="!isViewMode && handleSelectARM()"
                      :style="isViewMode ? '' : 'cursor: pointer;'"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <!-- 第3行: Introducer, Client Id -->
                <div class="form-row">
                  <el-form-item label="Introducer">
                    <el-select
                      v-model="(clientForm.general as any).introducerId"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isViewMode"
                      filterable
                      @focus="!isViewMode && loadIntroducersIfNeeded()"
                    >
                      <el-option
                        v-for="intro in visibleIntroducers"
                        :key="intro.id"
                        :label="intro.introducer"
                        :value="intro.id"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Client Id">
                    <el-input v-model="clientForm.general.clientId" placeholder="Please enter client ID" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第4行: Gender, Client Relationship Status -->
                <div class="form-row">
                  <el-form-item label="Gender">
                    <el-radio-group v-model="(clientForm.general as any).gender" :disabled="isViewMode">
                      <el-radio label="Male">Male</el-radio>
                      <el-radio label="Female">Female</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="Client Relationship Status">
                    <el-select
                      v-model="clientForm.general.clientRelationshipStatus"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isViewMode"
                    >
                      <el-option label="Prospecting" value="Prospecting" />
                      <el-option label="On Boarding" value="On Boarding" />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第5行: Marital Status, Title -->
                <div class="form-row">
                  <el-form-item label="Marital Status">
                    <el-select v-model="(clientForm.general as any).maritalStatus" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Single" value="Single" />
                      <el-option label="Married" value="Married" />
                      <el-option label="Divorced" value="Divorced" />
                      <el-option label="Widowed" value="Widowed" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Title" prop="general.title">
                    <el-select v-model="(clientForm.general as any).title" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Mr." value="Mr." />
                      <el-option label="Mrs." value="Mrs." />
                      <el-option label="Miss" value="Miss" />
                      <el-option label="Dr." value="Dr." />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第6行: Education Level, First Name -->
                <div class="form-row">
                  <el-form-item label="Education Level">
                    <el-select v-model="(clientForm.general as any).educationLevel" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="High School" value="High School" />
                      <el-option label="Bachelor" value="Bachelor" />
                      <el-option label="Master" value="Master" />
                      <el-option label="PhD" value="PhD" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="First Name" prop="general.firstName">
                    <el-input v-model="(clientForm.general as any).firstName" placeholder="Please enter first name" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第7行: Birthday(dd/mm/yyyy), Last Name -->
                <div class="form-row">
                  <el-form-item label="Birthday (dd/mm/yyyy)">
                    <el-date-picker
                      v-model="(clientForm.general as any).birthday"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                      :disabled="isViewMode"
                    />
                  </el-form-item>
                  <el-form-item label="Last Name" prop="general.lastName">
                    <el-input v-model="(clientForm.general as any).lastName" placeholder="Please enter last name" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第8行: Country/Region of Birth, Chinese Name -->
                <div class="form-row">
                  <el-form-item label="Country/Region of Birth">
                    <el-select
                      v-model="(clientForm.general as any).countryOfBirth"
                      placeholder="Please select country/region"
                      style="width: 100%"
                      :disabled="isViewMode"
                      filterable
                    >
                      <el-option
                        v-for="country in nationalityList"
                        :key="country"
                        :label="country"
                        :value="country"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Chinese Name">
                    <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第9行: Dual Citizenship, Id Type -->
                <div class="form-row">
                  <el-form-item label="Dual Citizenship">
                    <el-switch
                      v-model="(clientForm.general as any).dualCitizenship"
                      :active-value="true"
                      :inactive-value="false"
                      :disabled="isViewMode"
                    />
                    <span style="margin-left: 8px;">{{ (clientForm.general as any).dualCitizenship ? 'Yes' : 'No' }}</span>
                  </el-form-item>
                  <el-form-item label="Id Type">
                    <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Passport" value="Passport" />
                      <el-option label="ID Card" value="ID Card" />
                      <el-option label="Driver License" value="Driver License" />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第10行: Nationality, Id No. -->
                <div class="form-row">
                  <el-form-item label="Nationality">
                    <el-select
                      v-model="(clientForm.general as any).nationality"
                      placeholder="Please select nationality"
                      style="width: 100%"
                      :disabled="isViewMode"
                      filterable
                    >
                      <el-option
                        v-for="country in nationalityList"
                        :key="country"
                        :label="country"
                        :value="country"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Id No.">
                    <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第11行: Id Expiry(dd/mm/yyyy) - 单独一行，靠左 -->
                <div class="form-row form-row-single">
                  <el-form-item label="Id Expiry (dd/mm/yyyy)">
                    <el-date-picker
                      v-model="(clientForm.general as any).idExpiry"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                      :disabled="isViewMode"
                    />
                  </el-form-item>
                </div>
              </template>

              <!-- Corporate 字段 -->
              <template v-else>
                <!-- 第1行: Contact Type, RM -->
                <div class="form-row">
                  <el-form-item label="Contact Type">
                    <el-input v-model="clientForm.general.contactType" disabled />
                  </el-form-item>
                  <el-form-item label="RM" prop="general.rm">
                    <el-input
                      v-model="clientForm.general.rm"
                      placeholder="Please select RM"
                      :readonly="isViewMode"
                      :disabled="isViewMode"
                      @click.native.stop="!isViewMode && handleSelectRM()"
                      :style="isViewMode ? '' : 'cursor: pointer;'"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <!-- 第2行: Contact Nature, ARM -->
                <div class="form-row">
                  <el-form-item label="Contact Nature" prop="general.contactNature">
                    <el-select
                      v-model="clientForm.general.contactNature"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isEditMode || isViewMode"
                      @change="handleContactNatureChange"
                    >
                      <el-option label="Individual" value="Individual" />
                      <el-option label="Corporate" value="Corporate" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="ARM">
                    <el-input
                      v-model="(clientForm.general as any).arm"
                      placeholder="Please select ARM"
                      :readonly="isViewMode"
                      :disabled="isViewMode"
                      @click.native.stop="!isViewMode && handleSelectARM()"
                      :style="isViewMode ? '' : 'cursor: pointer;'"
                    >
                      <template #suffix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </div>

                <!-- 第3行: Introducer, Client Id -->
                <div class="form-row">
                  <el-form-item label="Introducer">
                    <el-select
                      v-model="(clientForm.general as any).introducerId"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isViewMode"
                      filterable
                      @focus="!isViewMode && loadIntroducersIfNeeded()"
                    >
                      <el-option
                        v-for="intro in visibleIntroducers"
                        :key="intro.id"
                        :label="intro.introducer"
                        :value="intro.id"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Client Id">
                    <el-input v-model="clientForm.general.clientId" placeholder="Please enter client ID" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第4行: Chinese Name, Client Relationship Status -->
                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" />
                  </el-form-item>
                  <el-form-item label="Client Relationship Status">
                    <el-select
                      v-model="clientForm.general.clientRelationshipStatus"
                      placeholder="Please select"
                      style="width: 100%"
                      :disabled="isViewMode"
                    >
                      <el-option label="Prospecting" value="Prospecting" />
                      <el-option label="On Boarding" value="On Boarding" />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第5行: Id Type, Company Name -->
                <div class="form-row">
                  <el-form-item label="Id Type">
                    <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Business License" value="Business License" />
                      <el-option label="Registration Certificate" value="Registration Certificate" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Company Name" prop="general.companyName">
                    <el-input v-model="(clientForm.general as any).companyName" placeholder="Please enter company name" :disabled="isViewMode" />
                  </el-form-item>
                </div>

                <!-- 第6行: Id No., Corporate Type -->
                <div class="form-row">
                  <el-form-item label="Id No.">
                    <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" :disabled="isViewMode" />
                  </el-form-item>
                  <el-form-item label="Corporate Type">
                    <el-select v-model="(clientForm.general as any).corporateType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Limited Company" value="Limited Company" />
                      <el-option label="Corporation" value="Corporation" />
                      <el-option label="Partnership" value="Partnership" />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第7行: Date of Company Search/COI Issued(dd/mm/yyyy), Industry -->
                <div class="form-row">
                  <el-form-item label="Date of Company Search/COI Issued (dd/mm/yyyy)" style="align-self: flex-start;">
                    <el-date-picker
                      v-model="(clientForm.general as any).dateOfCompanySearch"
                      type="date"
                      placeholder="Select date"
                      format="DD/MM/YYYY"
                      value-format="DD/MM/YYYY"
                      style="width: 100%"
                      :disabled="isViewMode"
                    />
                  </el-form-item>
                  <el-form-item label="Industry">
                    <el-select v-model="(clientForm.general as any).industry" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Finance" value="Finance" />
                      <el-option label="Technology" value="Technology" />
                      <el-option label="Manufacturing" value="Manufacturing" />
                      <el-option label="Retail" value="Retail" />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第8行: Country/Region of Registration - 单独一行，靠左 -->
                <div class="form-row form-row-single">
                  <el-form-item label="Country/Region of Registration">
                    <el-select
                      v-model="(clientForm.general as any).countryOfRegistration"
                      placeholder="Please select country/region"
                      style="width: 100%"
                      :disabled="isViewMode"
                      filterable
                    >
                      <el-option
                        v-for="country in nationalityList"
                        :key="country"
                        :label="country"
                        :value="country"
                      />
                    </el-select>
                  </el-form-item>
                </div>

                <!-- 第8行: State Owned -->
                <div class="form-row">
                  <el-form-item label="State Owned">
                    <el-switch
                      v-model="(clientForm.general as any).stateOwned"
                      :active-value="true"
                      :inactive-value="false"
                      :disabled="isViewMode"
                    />
                    <span style="margin-left: 8px;">{{ (clientForm.general as any).stateOwned ? 'Yes' : 'No' }}</span>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
              </template>
            </div>

            <!-- Contact Section -->
            <div class="form-section">
              <h3 class="section-title">Contact</h3>
              <div class="form-row">
                <el-form-item label="Mobile Phone">
                  <el-input v-model="clientForm.contact.mobilePhone" placeholder="Please enter mobile phone" :disabled="isViewMode">
                    <template #suffix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Primary Email">
                  <el-input v-model="clientForm.contact.primaryEmail" placeholder="Please enter email" :disabled="isViewMode">
                    <template #suffix>
                      <el-icon><Message /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-row" style="margin-bottom: 10px;">
                <el-form-item label="Home Phone" style="align-self: flex-start;">
                  <el-input v-model="clientForm.contact.homePhone" placeholder="Please enter home phone" :disabled="isViewMode">
                    <template #suffix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="Address" style="width: 100%;">
                  <el-input
                    v-model="clientForm.contact.address"
                    type="textarea"
                    :rows="3"
                    placeholder="Please enter address"
                    :disabled="isViewMode"
                  />
                </el-form-item>
              </div>

              <div class="form-row" style="margin-top: 0; margin-bottom: 20px;">
                <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                  <el-switch
                    v-model="clientForm.contact.jurisdictionDiffers"
                    :active-value="true"
                    :inactive-value="false"
                    :disabled="isViewMode"
                  />
                  <span style="margin-left: 8px;">{{ clientForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                </el-form-item>
                <el-form-item></el-form-item>
              </div>
            </div>

            <!-- Portfolio Section -->
            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Portfolio</h3>
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleNewPortfolio">
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
                    <template v-if="!isViewMode">
                      <el-link type="primary" @click="handleEditPortfolio(row, $index)" :underline="false">
                        Edit
                      </el-link>
                      <el-divider direction="vertical" />
                      <el-link type="primary" @click="handleDeletePortfolio($index)" :underline="false">
                        Delete
                      </el-link>
                    </template>
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
          <div class="kyc-section">
            <div class="kyc-upload-header">
              <h3 class="kyc-upload-title">Upload Supporting Documents</h3>
              <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadKYCDocument">
                Upload
              </el-button>
            </div>
            <el-table
              v-if="kycData.documents && kycData.documents.length > 0"
              :data="kycData.documents"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="document" label="Document" />
              <el-table-column prop="size" label="Size" width="150" />
              <el-table-column label="Upload Time" width="200">
                <template #default="{ row }">
                  {{ formatDateTime(row.uploadTime) }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenKYCDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteKYCDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Investment Risk Profile" name="risk">
        <div class="tab-content">
          <el-form :model="riskProfileData" label-width="250px" class="risk-profile-form">
            <!-- Investment Risk Rating Section -->
            <div class="form-section">
              <div class="form-row">
                <el-form-item label="Investment Risk Rating">
                  <el-select v-model="riskProfileData.investmentRiskRating" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                    <el-option label="Conservative" value="Conservative" />
                    <el-option label="Moderate" value="Moderate" />
                    <el-option label="Balanced" value="Balanced" />
                    <el-option label="Growth" value="Growth" />
                    <el-option label="Aggressive" value="Aggressive" />
                  </el-select>
                </el-form-item>
                <el-form-item label="HongKong PI">
                  <el-switch
                    v-model="riskProfileData.hongKongPI"
                    :active-value="true"
                    :inactive-value="false"
                    :disabled="isViewMode"
                  />
                  <span style="margin-left: 8px;">{{ riskProfileData.hongKongPI ? 'Yes' : 'No' }}</span>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item label="Remarks" style="width: 100%;">
                  <el-input
                    v-model="riskProfileData.remarks"
                    type="textarea"
                    :rows="4"
                    placeholder="Please enter remarks"
                    :disabled="isViewMode"
                  />
                </el-form-item>
              </div>
            </div>

            <!-- Vulnerable Client Assessment Section -->
            <div class="form-section">
              <h3 class="section-title">Vulnerable Client Assessment</h3>
              <div class="vulnerable-assessment-container">
                <div class="vulnerable-questions">
                  <div class="vulnerable-question-item">
                    <div class="question-label">1. Age 65 years old and above</div>
                    <div class="question-control">
                      <el-switch
                        v-model="riskProfileData.vulnerableClientAssessment.age65AndAbove"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.age65AndAbove ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">2. Physical or intellectual disabilities</div>
                    <div class="question-control">
                      <el-switch
                        v-model="riskProfileData.vulnerableClientAssessment.physicalOrIntellectualDisabilities"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.physicalOrIntellectualDisabilities ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">3. Not proficient in written or spoken English</div>
                    <div class="question-control">
                      <el-switch
                        v-model="riskProfileData.vulnerableClientAssessment.notProficientInEnglish"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.notProficientInEnglish ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">4. Education primary or below and has no investment</div>
                    <div class="question-control">
                      <el-switch
                        v-model="riskProfileData.vulnerableClientAssessment.educationPrimaryOrBelow"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.educationPrimaryOrBelow ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                </div>
                <div class="vulnerable-client-info">
                  <div class="vulnerable-question-item">
                    <div class="question-label">Vulnerable Client</div>
                    <div class="question-control">
                      <el-switch
                        v-model="riskProfileData.vulnerableClientAssessment.vulnerableClient"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.vulnerableClient ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">Review Date (dd/mm/yyyy)</div>
                    <div class="question-control">
                      <el-date-picker
                        v-model="riskProfileData.vulnerableClientAssessment.reviewDate"
                        type="date"
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                        value-format="DD/MM/YYYY"
                        style="width: 60%"
                        :disabled="isViewMode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Investment Knowledge & Experience Section -->
            <div class="form-section investment-knowledge-section">
              <h3 class="section-title">Investment Knowledge & Experience</h3>
              <div class="investment-table-wrapper">
                <el-table :data="riskProfileData.investmentKnowledgeExperience.types" stripe class="investment-table">
                <el-table-column prop="type" label="Type" min-width="400" align="right" class-name="type-column">
                  <template #header>
                    <span class="table-header-bold">Type</span>
                  </template>
                  <template #default="{ row }">
                    <span class="type-text">{{ row.type }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Knowledge" width="150" align="center">
                  <template #header>
                    <span class="table-header-bold">Knowledge</span>
                  </template>
                  <template #default="{ row }">
                    <el-checkbox v-model="row.knowledge" :disabled="isViewMode" />
                  </template>
                </el-table-column>
                <el-table-column label="Experience" width="150" align="center">
                  <template #header>
                    <span class="table-header-bold">Experience</span>
                  </template>
                  <template #default="{ row }">
                    <el-checkbox v-model="row.experience" :disabled="isViewMode" />
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Documents" name="documents">
        <div class="tab-content">
          <!-- Upload Identity Proof -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Identity Proof</h3>
              <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('identity')">
                Upload
              </el-button>
            </div>
            <el-table
              v-if="documentsData.identity && documentsData.identity.length > 0"
              :data="documentsData.identity"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="document" label="Document" />
              <el-table-column prop="size" label="Size" width="150" />
              <el-table-column label="Upload Time" width="200">
                <template #default="{ row }">
                  {{ formatDateTime(row.uploadTime) }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload Address Proof -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Address Proof</h3>
              <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('address')">
                Upload
              </el-button>
            </div>
            <el-table
              v-if="documentsData.address && documentsData.address.length > 0"
              :data="documentsData.address"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="document" label="Document" />
              <el-table-column prop="size" label="Size" width="150" />
              <el-table-column label="Upload Time" width="200">
                <template #default="{ row }">
                  {{ formatDateTime(row.uploadTime) }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload Forms -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Forms</h3>
              <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('forms')">
                Upload
              </el-button>
            </div>
            <el-table
              v-if="documentsData.forms && documentsData.forms.length > 0"
              :data="documentsData.forms"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="document" label="Document" />
              <el-table-column prop="size" label="Size" width="150" />
              <el-table-column label="Upload Time" width="200">
                <template #default="{ row }">
                  {{ formatDateTime(row.uploadTime) }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload XinXi Statements -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload XinXi Statements</h3>
              <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('statements')">
                Upload
              </el-button>
            </div>
            <el-table
              v-if="documentsData.statements && documentsData.statements.length > 0"
              :data="documentsData.statements"
              stripe
              style="width: 100%"
            >
              <el-table-column prop="document" label="Document" />
              <el-table-column prop="size" label="Size" width="150" />
              <el-table-column label="Upload Time" width="200">
                <template #default="{ row }">
                  {{ formatDateTime(row.uploadTime) }}
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Fee Schedule" name="fee">
        <div class="tab-content">
          <el-form :model="feeScheduleData" label-width="250px" class="fee-schedule-form">
            <div class="form-section">
              <div class="vulnerable-assessment-container">
                <div class="vulnerable-questions">
                  <!-- Management Fee -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Management Fee</div>
                    <div class="question-control">
                      <el-switch
                        v-model="feeScheduleData.managementFee.enabled"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ feeScheduleData.managementFee.enabled ? 'Yes' : 'No' }}</span>
                    </div>
                    <template v-if="feeScheduleData.managementFee.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Yearly Management Fee (%)</div>
                          <el-input v-model.number="feeScheduleData.managementFee.yearlyManagementFee" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                        </div>
                        <div class="fee-form-item">
                          <div class="fee-form-label">Minimum Management Fee (p.a.)</div>
                          <el-input v-model.number="feeScheduleData.managementFee.minimumManagementFee" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- Retrocession -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Retrocession</div>
                    <div class="question-control">
                      <el-switch
                        v-model="feeScheduleData.retrocession.enabled"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ feeScheduleData.retrocession.enabled ? 'Yes' : 'No' }}</span>
                    </div>
                  </div>
                </div>

                <div class="vulnerable-client-info">
                  <!-- Performance Fee -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Performance Fee</div>
                    <div class="question-control">
                      <el-switch
                        v-model="feeScheduleData.performanceFee.enabled"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ feeScheduleData.performanceFee.enabled ? 'Yes' : 'No' }}</span>
                    </div>
                    <template v-if="feeScheduleData.performanceFee.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Hurdle Rate (%)</div>
                          <el-input v-model.number="feeScheduleData.performanceFee.hurdleRate" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                        </div>
                        <div class="fee-form-item">
                          <div class="fee-form-label">Profit shared to XinXi (%)</div>
                          <el-input v-model.number="feeScheduleData.performanceFee.profitSharedToXinXi" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- Others -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Others</div>
                    <div class="question-control">
                      <el-switch
                        v-model="feeScheduleData.others.enabled"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ feeScheduleData.others.enabled ? 'Yes' : 'No' }}</span>
                    </div>
                    <template v-if="feeScheduleData.others.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Details</div>
                          <el-input
                            v-model="feeScheduleData.others.details"
                            type="textarea"
                            :rows="4"
                            placeholder="Please enter details"
                            class="fee-input"
                            :disabled="isViewMode"
                            :resize="'none'"
                          />
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

    <!-- RM 选择对话框 -->
    <el-dialog
      v-model="rmSelectDialogVisible"
      title="Select RM"
      width="600px"
    >
      <el-table
        :data="accountList.filter(account => account.isActive || account.userId === clientForm.general.rmUserId || account.id === clientForm.general.rmUserId)"
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

    <!-- ARM 选择对话框 -->
    <el-dialog
      v-model="armSelectDialogVisible"
      title="Select ARM"
      width="600px"
    >
      <el-table
        :data="accountList.filter(account => account.isActive || account.userId === (clientForm.general as any).armUserId || account.id === (clientForm.general as any).armUserId)"
        stripe
        style="width: 100%"
        @row-click="handleARMSelect"
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
        <el-button @click="armSelectDialogVisible = false">Cancel</el-button>
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
            :disabled="isViewMode"
            filterable
            @focus="!isViewMode && loadBanksIfNeeded()"
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
          <el-select v-model="portfolioForm.bookingCentre" placeholder="Please select booking centre" style="width: 100%" :disabled="isViewMode" filterable>
            <el-option
              v-for="centre in availableBookingCentres"
              :key="centre"
              :label="centre"
              :value="centre"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Portfolio No." prop="portfolioNo" required>
          <el-input v-model="portfolioForm.portfolioNo" placeholder="Please enter portfolio number" :disabled="isViewMode" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="portfolioDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitPortfolio">Submit</el-button>
      </template>
    </el-dialog>

    <!-- 文档上传对话框 -->
    <el-dialog
      v-model="documentUploadDialogVisible"
      :title="documentUploadTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :limit="1"
        accept=".pdf"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Drag & drop files here, or <em>click to upload</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            Only pdf can be uploaded, and the size does not exceed 100MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="documentUploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitDocumentUpload" :loading="uploading">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus'
import { ArrowLeft, Plus, User, Phone, Message, Location, UploadFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userClientApi, type Client, type IndividualGeneralInfo, type CorporateGeneralInfo, type CreateClientParams } from '@/api/user/client'
import { individualClientApi, type CreateIndividualClientRequest } from '@/api/clientIndividual'
import { portfolioApi, type Portfolio, type CreatePortfolioParams } from '@/api/user/portfolio'
import { accountApi, type Account } from '@/api/account'
import { introducerApi, type Introducer } from '@/api/introducer'
import { bankApi, type BankCentre } from '@/api/bank'
import { kycApi, type KYCData, type KYCDocument } from '@/api/user/kyc'
import { documentsApi, type DocumentsData, type Document, type DocumentType } from '@/api/user/documents'
import { riskProfileApi, type InvestmentRiskProfile, type InvestmentType } from '@/api/user/risk-profile'
import { feeScheduleApi, type FeeSchedule } from '@/api/user/fee-schedule'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const clientId = computed(() => {
  // 如果是新建模式（路由名称为 UserClientNew 或路径包含 /new），返回 null
  if (route.name === 'UserClientNew' || route.path.includes('/new')) {
    return null
  }
  // 否则尝试从路由参数中获取 id
  const id = route.params.id as string
  if (!id || id === 'new') {
    return null
  }
  const parsedId = parseInt(id)
  return isNaN(parsedId) ? null : parsedId
})
const isEditMode = computed(() => clientId.value !== null && clientId.value !== undefined)
// View 模式：路径包含 /view 或者是 admin 的 view 路由（/client/:id 且不是 /client/:id/edit）
// 或者是普通用户的 view 路由（UserClientView，即 /user/client/:id 且不是 /user/client/:id/edit）
const isViewMode = computed(() => {
  const path = route.path
  const routeName = route.name
  // 如果是 admin 的 view 路由（AdminClientView），或者是路径包含 /view
  if (routeName === 'AdminClientView' || path.includes('/view')) {
    return true
  }
  // 如果是 /client/:id 且不是 /client/:id/edit，也是 view 模式（admin）
  if (path.startsWith('/client/') && !path.includes('/edit') && !path.includes('/new')) {
    return true
  }
  // 如果是普通用户的 view 路由（UserClientView），即 /user/client/:id 且不是 /user/client/:id/edit
  if (routeName === 'UserClientView' || (path.startsWith('/user/client/') && !path.includes('/edit') && !path.includes('/new') && path !== '/user/client')) {
    return true
  }
  return false
})

const activeTab = ref('general')
const saving = ref(false)
// 各 Tab 的最后保存时间文案（进入编辑页时从后端获取，保存成功后更新）
const tabLastSaved: Record<string, string> = reactive({
  general: '',
  kyc: '',
  risk: '',
  documents: '',
  fee: ''
})
const currentTabLastSaved = computed(() => tabLastSaved[activeTab.value] || '')
const clientFormRef = ref<FormInstance>()
const portfolioFormRef = ref<FormInstance>()

// 全球国家/地区列表（全英文，注意地缘政治敏感度，按字母顺序排列）
const nationalityList = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Argentina',
  'Australia',
  'Austria',
  'Bangladesh',
  'Belgium',
  'Brazil',
  'Bulgaria',
  'Cambodia',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hong Kong, China', // 中国香港
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Korea, North',
  'Korea, South',
  'Kuwait',
  'Latvia',
  'Lebanon',
  'Lithuania',
  'Luxembourg',
  'Macau, China', // 中国澳门
  'Malaysia',
  'Mexico',
  'Morocco',
  'Myanmar',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Oman',
  'Pakistan',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'South Africa',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Taiwan, China', // 中国台湾
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
  'Yemen',
  'Zimbabwe'
].sort((a, b) => a.localeCompare(b, 'en'))

// 表单数据
const clientForm = reactive<CreateClientParams & { portfolios: Portfolio[] }>({
  contactNature: 'Individual',
  general: {
    contactType: 'Client',
    contactNature: 'Individual',
    firstName: '',
    lastName: '',
    rm: '',
    arm: ''
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

// RM、ARM 和 Introducer 选择
const rmSelectDialogVisible = ref(false)
const armSelectDialogVisible = ref(false)
const accountList = ref<Account[]>([])
const introducerList = ref<Introducer[]>([])
const bankList = ref<BankCentre[]>([])

// Introducer 下拉可见列表：只显示启用的 + 当前已选中的（即使已禁用也保留）
const visibleIntroducers = computed(() => {
  const currentId = (clientForm.general as any).introducerId
  return (introducerList.value || []).filter((intro: any) => {
    if (!intro) return false
    return intro.isActive || intro.id === currentId
  })
})

// Bank 下拉可见列表：只显示启用的 + 当前已选中的（即使已禁用也保留）
const visibleBanks = computed(() => {
  const currentBank = portfolioForm.bank
  return (bankList.value || []).filter((bank: any) => {
    if (!bank) return false
    return bank.isActive || bank.bank === currentBank
  })
})

// Portfolio 管理
const portfolioDialogVisible = ref(false)
const editingPortfolioIndex = ref<number | null>(null)
const portfolioForm = reactive<CreatePortfolioParams>({
  clientId: 0,
  bank: '',
  bookingCentre: '',
  portfolioNo: ''
})

// KYC 数据
const kycData = reactive<KYCData>({
  documents: []
})

// Documents 数据
const documentsData = reactive<DocumentsData>({
  identity: [],
  address: [],
  forms: [],
  statements: []
})

// Investment Risk Profile 数据
const riskProfileData = reactive<InvestmentRiskProfile>({
  investmentRiskRating: undefined,
  remarks: '',
  hongKongPI: false,
  vulnerableClientAssessment: {
    age65AndAbove: false,
    physicalOrIntellectualDisabilities: false,
    notProficientInEnglish: false,
    educationPrimaryOrBelow: false,
    vulnerableClient: false,
    reviewDate: undefined
  },
  investmentKnowledgeExperience: {
    types: [
      { type: 'Alternative Investments', knowledge: false, experience: false },
      { type: 'Bonds', knowledge: false, experience: false },
      { type: 'Bonds With Special Features', knowledge: false, experience: false },
      { type: 'Commodities', knowledge: false, experience: false },
      { type: 'Deposits (including foreign currency deposits)', knowledge: false, experience: false },
      { type: 'Equities', knowledge: false, experience: false },
      { type: 'Equity Funds / Money Market Funds', knowledge: false, experience: false },
      { type: 'Synthetic ETF / Futures-based ETF / Leveraged and Inverse Products', knowledge: false, experience: false },
      { type: 'Other Mutual Funds', knowledge: false, experience: false },
      { type: 'Derivatives', knowledge: false, experience: false },
      { type: 'Foreign Exchange (e.g. Spot)', knowledge: false, experience: false },
      { type: 'Security Tokens', knowledge: false, experience: false },
      { type: 'Margin/Leveraged Trading', knowledge: false, experience: false }
    ]
  }
})

// Fee Schedule 数据
const feeScheduleData = reactive<FeeSchedule>({
  managementFee: {
    enabled: false,
    yearlyManagementFee: undefined,
    minimumManagementFee: undefined
  },
  retrocession: {
    enabled: false
  },
  performanceFee: {
    enabled: false,
    hurdleRate: undefined,
    profitSharedToXinXi: undefined
  },
  others: {
    enabled: false,
    details: undefined
  }
})

// 文档上传
const documentUploadDialogVisible = ref(false)
const documentUploadType = ref<DocumentType | 'kyc'>('identity')
const documentUploadTitle = computed(() => {
  if (documentUploadType.value === 'kyc') {
    return 'Upload Supporting Documents'
  }
  const titles: Record<DocumentType, string> = {
    identity: 'Upload Identity Proof',
    address: 'Upload Address Proof',
    forms: 'Upload Forms',
    statements: 'Upload XinXi Statements'
  }
  return titles[documentUploadType.value]
})
const uploadRef = ref()
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)
const currentUploadFile = ref<File | null>(null)

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
  // 在 View 模式下，不应用任何验证规则
  if (isViewMode.value) {
    return {}
  }

  const rules: FormRules = {
    'general.contactNature': [
      { required: true, message: 'Please select contact nature', trigger: 'change' }
    ],
    'general.rm': [
      { required: true, message: 'Please select RM', trigger: 'change' }
    ]
  }

  if (clientForm.general.contactNature === 'Individual') {
    rules['general.title'] = [{ required: true, message: 'Please select title', trigger: 'change' }]
    rules['general.firstName'] = [{ required: true, message: 'Please enter first name', trigger: 'blur' }]
    rules['general.lastName'] = [{ required: true, message: 'Please enter last name', trigger: 'blur' }]
  } else {
    rules['general.companyName'] = [{ required: true, message: 'Please enter company name', trigger: 'blur' }]
  }

  return rules
})

// Portfolio 表单验证规则（在 View 模式下不应用验证）
const portfolioFormRules = computed<FormRules>(() => {
  // 在 View 模式下，不应用任何验证规则
  if (isViewMode.value) {
    return {}
  }

  return {
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
})

// 加载数据
const loadClient = async () => {
  if (!clientId.value) return

  try {
    const response = await userClientApi.getClientById(clientId.value)
    const data = response.data || response

    // 填充表单数据
    clientForm.contactNature = data.contactNature || data.contact_nature || 'Individual'
    
    // 处理 General 信息
    if (data.general) {
      const general = data.general
      // 确保general对象有contactNature
      if (!general.contactNature) {
        general.contactNature = clientForm.contactNature
      }
      // 确保general对象有contactType
      if (!general.contactType) {
        general.contactType = 'Client'
      }
      clientForm.general = general as any
    } else {
      // 如果没有general，创建默认值
      if (clientForm.contactNature === 'Individual') {
        clientForm.general = {
          contactType: 'Client',
          contactNature: 'Individual',
          firstName: '',
          lastName: '',
          rm: '',
          arm: ''
        } as IndividualGeneralInfo
      } else {
        clientForm.general = {
          contactType: 'Client',
          contactNature: 'Corporate',
          companyName: '',
          rm: '',
          arm: ''
        } as CorporateGeneralInfo
      }
    }
    
    // 如果存在 introducerId，则预先加载 Introducer 列表，保证下拉中有对应的名称
    if ((clientForm.general as any).introducerId) {
      try {
        await loadIntroducers()
      } catch (e) {
        console.warn('Failed to preload introducers for existing client:', e)
      }
    }

    // 初始化 General Tab 的 Last saved（用后端的 updatedTime/createdTime）
    const baseTime = data.updatedTime || data.updated_time || data.createdTime || data.created_time
    if (baseTime) {
      tabLastSaved.general = `Last saved: ${formatDateTime(baseTime)}`
      // 默认情况下，其他 Tab 还没有各自的记录时，也先用这个时间
      if (!tabLastSaved.kyc) tabLastSaved.kyc = tabLastSaved.general
      if (!tabLastSaved.risk) tabLastSaved.risk = tabLastSaved.general
      if (!tabLastSaved.documents) tabLastSaved.documents = tabLastSaved.general
      if (!tabLastSaved.fee) tabLastSaved.fee = tabLastSaved.general
    }

    // 处理 Contact 信息
    clientForm.contact = data.contact || {
      mobilePhone: '',
      homePhone: '',
      primaryEmail: '',
      address: '',
      jurisdictionDiffers: false
    }
    
    // 处理 Portfolio 列表（后端ClientDetailDTO已包含portfolios）
    if (data.portfolios && Array.isArray(data.portfolios)) {
      clientForm.portfolios = data.portfolios.map((item: any) => ({
        id: item.id,
        bank: item.bank || '',
        bookingCentre: item.bookingCentre || item.booking_centre || '',
        portfolioNo: item.portfolioNo || item.portfolio_no || '',
        uploadTime: item.uploadTime || item.upload_time || item.createdAt || item.created_at || ''
      }))
    } else {
      // 如果没有portfolios，尝试单独加载
      try {
        const portfolioResponse = await portfolioApi.getPortfolios(clientId.value, clientForm.contactNature)
        const portfolios = portfolioResponse.data || portfolioResponse || []
        clientForm.portfolios = portfolios.map((item: any) => ({
          id: item.portfolioId || item.id,
          bank: item.bankName || item.bank || '',
          bookingCentre: item.bookingCentre || item.booking_centre || '',
          portfolioNo: item.portfolioNumber || item.portfolioNo || item.portfolio_no || '',
          uploadTime: item.uploadTime || item.upload_time || item.createdAt || item.created_at || ''
        }))
      } catch (error) {
        console.warn('Failed to load portfolios:', error)
        clientForm.portfolios = []
      }
    }
    
    // 加载RM和ARM和Introducer名称（如果后端没有返回）
    if (clientForm.general.rmUserId && !clientForm.general.rm) {
      try {
        await loadAccounts()
        const account = accountList.value.find(a => a.userId === clientForm.general.rmUserId)
        if (account) {
          clientForm.general.rm = account.name || account.account || ''
        }
      } catch (error) {
        console.warn('Failed to load RM name:', error)
      }
    }
    
    // 加载ARM名称（如果后端没有返回）
    if ((clientForm.general as any).armUserId && !(clientForm.general as any).arm) {
      try {
        if (accountList.value.length === 0) {
          await loadAccounts()
        }
        const account = accountList.value.find(a => a.userId === (clientForm.general as any).armUserId || a.id === (clientForm.general as any).armUserId)
        if (account) {
          (clientForm.general as any).arm = account.name || account.account || ''
        }
      } catch (error) {
        console.warn('Failed to load ARM name:', error)
      }
    }
    
    if ((clientForm.general as any).introducerId && !(clientForm.general as any).introducer) {
      try {
        await loadIntroducers()
        const introducer = introducerList.value.find(i => i.id === (clientForm.general as any).introducerId)
        if (introducer) {
          (clientForm.general as any).introducer = introducer.introducer || ''
        }
      } catch (error) {
        console.warn('Failed to load Introducer name:', error)
      }
    }

    // 加载 KYC 数据
    try {
      const kyc = await kycApi.getKYC(clientId.value, clientForm.contactNature as any)
      kycData.documents = kyc.documents || []

      // KYC Tab 的 Last saved：取最新的文档上传时间
      const kycTimes = kycData.documents
        .map(d => d.uploadTime)
        .filter(Boolean)
        .map(t => new Date(t))
        .filter(d => !isNaN(d.getTime()))
      if (kycTimes.length > 0) {
        const latest = new Date(Math.max(...kycTimes.map(d => d.getTime())))
        tabLastSaved.kyc = `Last saved: ${formatDateTime(latest)}`
      }
    } catch (error) {
      console.warn('Failed to load KYC data:', error)
      kycData.documents = []
    }

    // 加载 Documents 数据
    try {
      const documents = await documentsApi.getDocuments(clientId.value, clientForm.contactNature as any)
      documentsData.identity = documents.identity || []
      documentsData.address = documents.address || []
      documentsData.forms = documents.forms || []
      documentsData.statements = documents.statements || []

      // Documents Tab 的 Last saved：取所有文档中最新的上传时间
      const allDocs = [
        ...documentsData.identity,
        ...documentsData.address,
        ...documentsData.forms,
        ...documentsData.statements
      ]
      const docTimes = allDocs
        .map(d => d.uploadTime)
        .filter(Boolean)
        .map(t => new Date(t))
        .filter(d => !isNaN(d.getTime()))
      if (docTimes.length > 0) {
        const latest = new Date(Math.max(...docTimes.map(d => d.getTime())))
        tabLastSaved.documents = `Last saved: ${formatDateTime(latest)}`
      }
    } catch (error) {
      console.warn('Failed to load documents:', error)
    }

    // 加载 Investment Risk Profile 数据
    try {
      const risk = await riskProfileApi.getRiskProfile(clientId.value, clientForm.contactNature as any)
      // 用后端返回的数据整体替换前端结构，确保元数据（如 __hasExisting）也被带上
      Object.assign(riskProfileData, risk)

      // Risk Tab 的 Last saved：用后端 riskProfile 的 updatedAt/createdAt
      const riskLast = (risk as any).__lastUpdatedAt
      if (riskLast) {
        tabLastSaved.risk = `Last saved: ${formatDateTime(riskLast)}`
      }
    } catch (error) {
      console.warn('Failed to load risk profile:', error)
    }

    // 加载 Fee Schedule 数据
    try {
      const fee = await feeScheduleApi.getFeeSchedule(clientId.value, clientForm.contactNature as any)
      if (fee.managementFee) Object.assign(feeScheduleData.managementFee, fee.managementFee)
      if (fee.retrocession) Object.assign(feeScheduleData.retrocession, fee.retrocession)
      if (fee.performanceFee) Object.assign(feeScheduleData.performanceFee, fee.performanceFee)
      if (fee.others) Object.assign(feeScheduleData.others, fee.others)

      // 把后端返回的元数据（id、是否已存在、最后更新时间）同步到当前会话的 feeScheduleData 上，
      // 这样后续保存时 feeScheduleApi.updateFeeSchedule 才能正确区分是创建还是更新
      ;(feeScheduleData as any).__id = (fee as any).__id ?? null
      ;(feeScheduleData as any).__hasExisting = (fee as any).__hasExisting === true
      ;(feeScheduleData as any).__lastUpdatedAt = (fee as any).__lastUpdatedAt || null

      // Fee Tab 的 Last saved：用后端 feeSchedule 的 updatedAt/createdAt
      const feeLast = (fee as any).__lastUpdatedAt
      if (feeLast) {
        tabLastSaved.fee = `Last saved: ${formatDateTime(feeLast)}`
      }
    } catch (error) {
      console.warn('Failed to load fee schedule:', error)
    }

    // 在 View 模式下，清除所有表单验证错误
    if (isViewMode.value) {
      nextTick(() => {
        clientFormRef.value?.clearValidate()
        portfolioFormRef.value?.clearValidate()
      })
    }
  } catch (error: any) {
    console.error('Failed to load client:', error)
    // 登录态失效（401）时，全局拦截器已经提示并跳转，这里不再额外提示
    if (!(error as any)?.isAuthError && (error as any)?.response?.status !== 401) {
      ElMessage.error('Failed to load client details')
    }
  }
}

const loadAccounts = async () => {
  try {
    // 使用 RM 列表接口，获取所有非 admin 的 RM 账号（包括禁用的，用于保持历史关联）
    const response = await accountApi.getRMs()
    const data = response.data || response || []
    // 不过滤 isActive，确保下拉选项中仍能包含已禁用的 RM，以便显示历史关联
    accountList.value = data.map((item: any) => {
      const firstName = item.firstName || item.first_name || ''
      const lastName = item.lastName || item.last_name || ''
      const userId = item.userId || item.user_id || item.id
      const isActive = item.isActive === true || item.isActive === 'true' || item.active === true

      return {
        id: userId,
        userId: userId,
        account: item.username || item.account || '',
        firstName: firstName,
        lastName: lastName,
        name: `${lastName}, ${firstName}`, // RM显示格式：lastName, firstName
        isActive,
        status: isActive ? 'enabled' : 'disabled',
        createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || ''
      }
    })
  } catch (error) {
    console.error('Failed to load RM accounts:', error)
    // 如果RM接口失败，尝试使用原接口并过滤admin和disabled状态
    try {
      const response = await accountApi.getAccounts()
      const data = response.data || response || []
      accountList.value = data
        // 仍然过滤掉 admin 账号，但保留启用和禁用的 RM
        .filter((item: any) => {
          const role = (item.role || '').toLowerCase()
          const isAdmin = role === 'admin'
          return !isAdmin
        })
        .map((item: any) => {
          const firstName = item.firstName || item.first_name || ''
          const lastName = item.lastName || item.last_name || ''
          const userId = item.userId || item.user_id || item.id
          const isActive = item.isActive === true || item.isActive === 'true' || item.active === true

          return {
            id: userId,
            userId: userId,
            account: item.username || item.account || '',
            firstName: firstName,
            lastName: lastName,
            name: `${lastName}, ${firstName}`,
            isActive,
            status: isActive ? 'enabled' : 'disabled',
            createdTime: item.createdTime || item.created_time || item.createdAt || item.created_at || ''
          }
        })
    } catch (fallbackError) {
      console.error('Failed to load accounts with fallback:', fallbackError)
    }
  }
}

const loadIntroducers = async () => {
  try {
    // 使用介绍人列表接口，获取所有介绍人（包括禁用的，用于保持历史关联）
    const response = await introducerApi.getIntroducers()
    const data = response.data || response || []
    // 不过滤 isActive，确保下拉选项中仍能包含已禁用的 Introducer，以便显示历史关联
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
      const isActive = item.isActive === true || item.isActive === 'true' || item.is_active === true || item.active === true

      return {
        id: item.introducerId || item.id,
        introducer: introducerName,
        contactNature: contactNature,
        isActive,
        status: isActive ? 'enabled' : 'disabled'
      }
    })
  } catch (error) {
    console.error('Failed to load introducers:', error)
    // 如果接口失败，保留现有列表，避免清空已有关联
    console.error('Failed to load introducers with fallback:', error)
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
  // admin 在 /client/* 下查看时，返回 admin 的 Client 列表
  // 普通用户在 /user/client/* 下查看时，返回 user 的 Client 列表
  if (route.path.startsWith('/client')) {
    router.push('/client')
  } else {
    router.push('/user/client')
  }
}

// 处理 Edit 按钮点击，跳转到编辑页面
const handleEdit = () => {
  if (!clientId.value) return
  // 普通用户在 /user/client/:id 下查看时，跳转到 /user/client/:id/edit
  // admin 没有编辑功能，所以只处理普通用户的情况
  if (route.path.startsWith('/user/client/')) {
    router.push(`/user/client/${clientId.value}/edit`)
  }
}

const handleContactNatureChange = () => {
  // 切换 Contact Nature 时重置 General 信息
  if (clientForm.general.contactNature === 'Individual') {
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Individual',
      firstName: '',
      lastName: '',
      rm: clientForm.general.rm || '',
      arm: (clientForm.general as any).arm || ''
    } as IndividualGeneralInfo
  } else {
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Corporate',
      companyName: '',
      rm: clientForm.general.rm || '',
      arm: (clientForm.general as any).arm || ''
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

const handleSelectARM = () => {
  if (accountList.value.length === 0) {
    loadAccounts()
  }
  armSelectDialogVisible.value = true
}

const handleARMSelect = (account: Account) => {
  ;(clientForm.general as any).arm = account.name || account.account || ''
  ;(clientForm.general as any).armUserId = account.userId || account.id
  armSelectDialogVisible.value = false
}

const handleSave = async (closeAfter: boolean = false) => {
  if (!clientFormRef.value) return

  await clientFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        let currentClientId = clientId.value
        
        const buildLastSavedLabel = () => {
          const now = new Date()
          const day = String(now.getDate()).padStart(2, '0')
          const month = String(now.getMonth() + 1).padStart(2, '0')
          const year = now.getFullYear()
          const hours = String(now.getHours()).padStart(2, '0')
          const minutes = String(now.getMinutes()).padStart(2, '0')
          return `Last saved: ${day}/${month}/${year} ${hours}:${minutes}`
        }

        if (isEditMode.value && currentClientId) {
          // 更新现有 Client，并保存所有 Tab 的数据
          await userClientApi.updateClient(currentClientId, clientForm)

          // 保存 KYC
          try {
            await kycApi.updateKYC(currentClientId, kycData)
          } catch (error) {
            console.warn('Failed to save KYC:', error)
          }

          // 保存 Documents
          try {
            await documentsApi.updateDocuments(currentClientId, documentsData)
          } catch (error) {
            console.warn('Failed to save documents:', error)
          }

          // 保存 Investment Risk Profile
          try {
            await riskProfileApi.updateRiskProfile(currentClientId, riskProfileData, clientForm.contactNature as any)
          } catch (error) {
            console.warn('Failed to save investment risk profile:', error)
          }

          // 保存 Fee Schedule
          try {
            await feeScheduleApi.updateFeeSchedule(currentClientId, feeScheduleData, clientForm.contactNature as any)
          } catch (error) {
            console.warn('Failed to save fee schedule:', error)
          }

          ElMessage.success('Client updated successfully')

          // 更新当前会话内各 Tab 的最后保存时间
          const label = buildLastSavedLabel()
          tabLastSaved.general = label
          tabLastSaved.kyc = label
          tabLastSaved.risk = label
          tabLastSaved.documents = label
          tabLastSaved.fee = label

          // Save & Close：返回列表（根据当前路由前缀区分 admin 和 user）
          if (closeAfter) {
            await nextTick()
            const isAdminRoute = route.path.startsWith('/client')
            await router.push(isAdminRoute ? '/client' : '/user/client')
          }
        } else {
          // 创建新 Client
          let response
          // 如果是个人客户，调用 /client-individuals 接口
          if (clientForm.general.contactNature === 'Individual') {
            const general = clientForm.general as any
            const now = new Date()

            // 使用 ISO8601 格式，匹配后端默认期望的 `yyyy-MM-dd'T'HH:mm:ss.SSSX`
            const formatToIsoString = (date: Date | string | null | undefined): string => {
              if (!date) return ''
              const d = typeof date === 'string' ? new Date(date) : date
              if (isNaN(d.getTime())) return ''
              return d.toISOString()
            }

            const parseDdMmYyyyToDate = (value: string | null | undefined): string | null => {
              if (!value) return null
              const parts = value.split('/')
              if (parts.length !== 3) return null
              const [day, month, year] = parts
              const d = new Date(Number(year), Number(month) - 1, Number(day))
              if (isNaN(d.getTime())) return null
              return formatToIsoString(d)
            }

            const genderValue = general.gender === 'Male' ? 1 : general.gender === 'Female' ? 2 : 0
            const authUser = authStore.user
            const creatorId = authUser ? Number((authUser as any).id) || 0 : 0
            const creatorName = authUser?.name || authUser?.username || ''

            const payload: CreateIndividualClientRequest = {
              id: 0,
              contactType: general.contactType || 'Client',
              contactNature: general.contactNature || 'Individual',
              rmUserId: general.rmUserId || 0,
              armUserId: (general as any).armUserId || 0,
              introducerId: general.introducerId || 0,
              clientBusinessId: general.clientId || '',
              relationshipStatus: general.clientRelationshipStatus || '',
              gender: genderValue,
              maritalStatus: general.maritalStatus || '',
              title: general.title || '',
              firstName: general.firstName || '',
              lastName: general.lastName || '',
              chineseName: general.chineseName || '',
              educationLevel: general.educationLevel || '',
              birthday: parseDdMmYyyyToDate(general.birthday) || null,
              birthCountry: general.countryOfBirth || '',
              hasDualCitizenship: !!general.dualCitizenship,
              nationality: general.nationality || '',
              idType: general.idType || '',
              idNumber: general.idNo || '',
              idExpiryDate: parseDdMmYyyyToDate(general.idExpiry) || null,
              compliance: false,
              operation: false,
              previousRelationshipStatus: '',
              creatorId,
              creatorName,
              updatorId: creatorId,
              updatorName: creatorName,
              createdAt: formatToIsoString(now),
              updatedAt: formatToIsoString(now),
              isDeleted: false
            }

            response = await individualClientApi.createIndividualClient(payload)
          } else {
            // 其他类型仍然走原来的 /user/clients 接口
            response = await userClientApi.createClient(clientForm)
          }

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

          // 保存其他 Tab 的数据
          try {
            await kycApi.updateKYC(currentClientId, kycData)
          } catch (error) {
            console.warn('Failed to save KYC:', error)
          }
          
          try {
            await documentsApi.updateDocuments(currentClientId, documentsData)
          } catch (error) {
            console.warn('Failed to save documents:', error)
          }
          
          try {
            await riskProfileApi.updateRiskProfile(currentClientId, riskProfileData, clientForm.contactNature as any)
          } catch (error) {
            console.warn('Failed to save investment risk profile:', error)
          }
          
          try {
            await feeScheduleApi.updateFeeSchedule(currentClientId, feeScheduleData, clientForm.contactNature as any)
          } catch (error) {
            console.warn('Failed to save fee schedule:', error)
          }
          
          // 更新当前会话内各 Tab 的最后保存时间
          const label = buildLastSavedLabel()
          tabLastSaved.general = label
          tabLastSaved.kyc = label
          tabLastSaved.risk = label
          tabLastSaved.documents = label
          tabLastSaved.fee = label
          
          // 根据是否 Save & Close 决定跳转逻辑（根据当前路由前缀区分 admin 和 user）
          if (currentClientId) {
            await nextTick()
            const isAdminRoute = route.path.startsWith('/client')
            if (closeAfter) {
              await router.push(isAdminRoute ? '/client' : '/user/client')
            } else {
              await router.push(
                isAdminRoute ? `/client/${currentClientId}` : `/user/client/${currentClientId}/edit`
              )
            }
          } else {
            throw new Error('Client ID is missing after creation')
          }
        }
        
        // 旧的“X 分钟前”逻辑废弃，改为每次保存时设置具体时间文案（见上方 tabLastSaved）
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
  if (!clientId.value) {
    ElMessage.warning('Please save the client first')
    return
  }
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

    const portfolio = clientForm.portfolios[index]
    if (portfolio.id) {
      await portfolioApi.deletePortfolio(portfolio.id)
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
          if (portfolio.id) {
            await portfolioApi.updatePortfolio(portfolio.id, portfolioForm)
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
            // 传递clientType给createPortfolio
            const response = await portfolioApi.createPortfolio({
              ...portfolioForm,
              clientType: clientForm.contactNature
            })
            const responseData = response.data || response
            const newPortfolio: Portfolio = {
              id: responseData.portfolioId || responseData.id,
              bank: portfolioForm.bank,
              bookingCentre: portfolioForm.bookingCentre,
              portfolioNo: portfolioForm.portfolioNo,
              uploadTime: responseData.uploadTime || responseData.createdAt || new Date().toISOString()
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

// KYC 文档处理
const handleUploadKYCDocument = () => {
  if (!clientId.value) {
    ElMessage.warning('Please save the client first')
    return
  }
  documentUploadType.value = 'kyc'
  fileList.value = []
  currentUploadFile.value = null
  documentUploadDialogVisible.value = true
}

const handleOpenKYCDocument = async (document: KYCDocument) => {
  if (!clientId.value || !document.id) return
  try {
    const response = await kycApi.getKYCDocument(clientId.value, document.id)
    const blobData = (response as any).data || response
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Failed to open document:', error)
    ElMessage.error('Failed to open document')
  }
}

const handleDeleteKYCDocument = async (document: KYCDocument) => {
  if (!clientId.value || !document.id) return
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
    await kycApi.deleteKYCDocument(clientId.value, document.id)
    const index = kycData.documents.findIndex(d => d.id === document.id)
    if (index > -1) {
      kycData.documents.splice(index, 1)
    }
    ElMessage.success('Document deleted successfully')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete document:', error)
      ElMessage.error('Failed to delete document')
    }
  }
}

// Documents 处理
const handleUploadDocument = (type: DocumentType) => {
  if (!clientId.value) {
    ElMessage.warning('Please save the client first')
    return
  }
  documentUploadType.value = type
  fileList.value = []
  currentUploadFile.value = null
  documentUploadDialogVisible.value = true
}

const handleOpenDocument = async (document: Document) => {
  if (!clientId.value || !document.id) return
  try {
    const response = await documentsApi.getDocument(clientId.value, document.id)
    const blobData = (response as any).data || response
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Failed to open document:', error)
    ElMessage.error('Failed to open document')
  }
}

const handleDeleteDocument = async (document: Document) => {
  if (!clientId.value || !document.id) return
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
    await documentsApi.deleteDocument(clientId.value, document.id)
    // 从对应的数组中删除
    const type = document.type
    const index = documentsData[type].findIndex(d => d.id === document.id)
    if (index > -1) {
      documentsData[type].splice(index, 1)
    }
    ElMessage.success('Document deleted successfully')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete document:', error)
      ElMessage.error('Failed to delete document')
    }
  }
}

// 文件上传处理
const handleFileChange = (file: UploadFile, files: UploadFiles) => {
  if (file.raw) {
    // 检查文件类型
    if (file.raw.type !== 'application/pdf') {
      ElMessage.error('Only PDF files are allowed')
      fileList.value = []
      return
    }
    // 检查文件大小 (100MB)
    if (file.raw.size > 100 * 1024 * 1024) {
      ElMessage.error('File size cannot exceed 100MB')
      fileList.value = []
      return
    }
    currentUploadFile.value = file.raw
  }
}

const handleSubmitDocumentUpload = async () => {
  if (!currentUploadFile.value || !clientId.value) {
    ElMessage.warning('Please select a file')
    return
  }

  uploading.value = true
  try {
    if (documentUploadType.value === 'kyc') {
      const response = await kycApi.uploadKYCDocument(clientId.value, clientForm.contactNature as any, currentUploadFile.value)
      const data = response.data || response
      const newDoc: KYCDocument = {
        id: data.id,
        document: data.document || currentUploadFile.value.name,
        size: formatFileSize(currentUploadFile.value.size),
        uploadTime: data.uploadTime || new Date().toISOString()
      }
      kycData.documents.push(newDoc)
      ElMessage.success('Document uploaded successfully')
    } else {
      const response = await documentsApi.uploadDocument(clientId.value, clientForm.contactNature as any, documentUploadType.value, currentUploadFile.value)
      const data = response.data || response
      const newDoc: Document = {
        id: data.id,
        document: data.document || currentUploadFile.value.name,
        size: formatFileSize(currentUploadFile.value.size),
        uploadTime: data.uploadTime || new Date().toISOString(),
        type: documentUploadType.value
      }
      documentsData[documentUploadType.value].push(newDoc)
      ElMessage.success('Document uploaded successfully')
    }
    documentUploadDialogVisible.value = false
    fileList.value = []
    currentUploadFile.value = null
  } catch (error: any) {
    console.error('Failed to upload document:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to upload document'
    ElMessage.error(errorMessage)
  } finally {
    uploading.value = false
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i]
}

// 监听 Bank 变化，更新可用的 Booking Centres
watch(() => portfolioForm.bank, () => {
  portfolioForm.bookingCentre = ''
})

// 监听 View 模式变化，清除验证错误
watch(isViewMode, (newVal) => {
  if (newVal) {
    // 进入 View 模式时，清除所有表单验证错误
    nextTick(() => {
      clientFormRef.value?.clearValidate()
      portfolioFormRef.value?.clearValidate()
    })
  }
})

onMounted(async () => {
  try {
    // 新建模式下，完全不加载任何数据，页面立即渲染
    // 编辑模式下，只加载必要的 client 数据
    if (isEditMode.value) {
      await loadClient()
    }
    
    // 下拉选项数据完全按需加载，不在 onMounted 中加载
    // 这些数据只在用户点击对应的选择器时才加载
  } catch (error) {
    console.error('Error in onMounted:', error)
    // 即使出错也不阻止页面渲染
  }
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
    overflow: visible !important;
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
        margin-left: 15px;
        padding-left: 0;
      }
      
      .section-header {
        .section-title {
          margin-left: 15px;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
        align-items: start;
        
        .el-form-item {
          margin-bottom: 0;
          
          :deep(.el-form-item__label) {
            line-height: 1.5;
            white-space: normal;
            word-break: break-word;
            padding-bottom: 0;
            height: auto;
            min-height: 32px;
            display: flex;
            align-items: center;
            pointer-events: none; // 禁用 label 的点击聚焦行为
            cursor: default; // 将鼠标指针改为默认样式
          }
        }
      }

      .form-row-single {
        grid-template-columns: 1fr 1fr;
        
        .el-form-item:first-child {
          grid-column: 1;
          max-width: 100%;
        }
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

// KYC Section
.kyc-section {
  .kyc-upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px 20px;
    background-color: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    margin-left: 20px; // 略微靠右
  }

  .kyc-upload-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

// Document Section
.document-section {
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
    font-weight: 400;
    color: #606266;
    margin-left: 25px;
  }
}

// Risk Profile Form
.risk-profile-form {
  position: relative;
  
  .form-section {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid #e4e7ed;

    &:last-child {
      border-bottom: none;
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

    // 禁用 label 的点击聚焦行为
    :deep(.el-form-item__label) {
      pointer-events: none;
      cursor: default;
    }

    .vulnerable-assessment-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .vulnerable-questions {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .vulnerable-question-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .question-label {
        font-size: 14px;
        color: #606266;
        line-height: 1.5;
        text-align: left;
      }
      
      .question-control {
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: left;
      }
    }

    .vulnerable-client-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      .vulnerable-question-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .question-label {
          font-size: 14px;
          color: #606266;
          line-height: 1.5;
          text-align: left;
        }
        
        .question-control {
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }
      }
      
      .el-form-item {
        margin-bottom: 0;
      }
    }

    // Investment Knowledge & Experience Section
    .investment-knowledge-section {
      overflow: visible !important;
      position: relative;
      
      .investment-table-wrapper {
        // 将 Type、Knowledge、Experience 三个表头及其对应数据项整体向左移动 185px (300px - 35px - 50px - 30px)
        width: 100%;
        overflow: visible !important;
        margin-left: -185px !important;
        padding-right: 185px;
      }
    }
  }

  // Investment Knowledge & Experience Table
  .investment-table {
    width: 100% !important;
    max-width: none !important;
    transform: translateX(-185px) !important;
    -webkit-transform: translateX(-185px) !important;
    margin-left: -185px !important;
    
    :deep(.el-table__header) {
      th {
        .table-header-bold {
          font-weight: 600;
          color: #303133;
        }
      }
    }
    
    :deep(.el-table__body) {
      td.type-column {
        text-align: right;
        padding-right: 20px;
        
        .type-text {
          text-align: right;
          display: block;
          width: 100%;
        }
      }
    }
    
    // 确保表头之间的间距一致
    :deep(.el-table__header-wrapper) {
      .el-table__header {
        th {
          padding-left: 20px;
          padding-right: 20px;
          
          &.type-column {
            padding-right: 20px;
          }
        }
      }
    }
    
    // 确保表体单元格的间距一致
    :deep(.el-table__body-wrapper) {
      .el-table__body {
        td {
          padding-left: 20px;
          padding-right: 20px;
        }
      }
    }
  }
}

// Fee Schedule Form
.fee-schedule-form {
  margin-left: 30px;

  .form-section {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;

    // 禁用 label 的点击聚焦行为
    :deep(.el-form-item__label) {
      pointer-events: none;
      cursor: default;
    }
  }

  .vulnerable-assessment-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  .vulnerable-questions {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .vulnerable-question-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .question-label {
      font-size: 14px;
      color: #606266;
      line-height: 1.5;
      text-align: left;
    }
    
    .question-control {
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;
    }

    .fee-form-items {
      width: 100%;
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fee-form-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .fee-form-label {
      font-size: 14px;
      color: #606266;
      line-height: 1.5;
      text-align: left;
    }

    .fee-input {
      width: auto;
      min-width: 300px;
      max-width: 600px;
      
      :deep(.el-textarea__inner) {
        resize: none;
      }
    }
  }

  .vulnerable-client-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .vulnerable-question-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .question-label {
        font-size: 14px;
        color: #606266;
        line-height: 1.5;
        text-align: left;
      }
      
      .question-control {
        display: flex;
        align-items: center;
        gap: 8px;
        text-align: left;
      }

      .fee-form-items {
        width: 100%;
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .fee-form-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .fee-form-label {
        font-size: 14px;
        color: #606266;
        line-height: 1.5;
        text-align: left;
      }

      .fee-input {
        width: auto;
        min-width: 300px;
        max-width: 600px;
        
        :deep(.el-textarea__inner) {
          resize: none;
        }
      }
    }
  }
}

// Upload Dialog
.upload-demo {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .el-icon--upload {
    font-size: 67px;
    color: #c0c4cc;
    margin-bottom: 16px;
  }

  .el-upload__text {
    color: #606266;
    font-size: 14px;
    text-align: center;

    em {
      color: #025189;
      font-style: normal;
    }
  }

  .el-upload__tip {
    color: #909399;
    font-size: 12px;
    margin-top: 7px;
    text-align: center;
  }
}

/* KYC 删除确认弹窗样式 */
:deep(.kyc-delete-confirm-dialog) {
  /* 去掉标题区域 */
  .el-message-box__header {
    display: none;
  }

  /* 去掉左侧的感叹号图标 */
  .el-message-box__status {
    display: none;
  }

  /* 按钮居中 */
  .el-message-box__btns {
    justify-content: center;
  }
}

/* Delete 按钮红底白字（无论 Element Plus 默认主题如何，都强制覆盖） */
:deep(.kyc-delete-confirm-dialog .el-button--primary),
:deep(.kyc-delete-confirm-btn) {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
  color: #fff !important;
}

:deep(.kyc-delete-confirm-dialog .el-button--primary:hover),
:deep(.kyc-delete-confirm-dialog .el-button--primary:focus),
:deep(.kyc-delete-confirm-btn:hover),
:deep(.kyc-delete-confirm-btn:focus) {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
  color: #fff !important;
}
</style>

