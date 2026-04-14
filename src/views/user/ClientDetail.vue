<template>
  <div class="client-detail-page" v-loading="pageLoading" element-loading-text="Loading client data...">
    <!-- 顶部：左为姓名 +（流程节点），右为操作按钮 -->
    <div class="top-header">
      <div class="top-header__leading">
        <el-button :icon="ArrowLeft" circle class="top-header__back" @click="handleBack" />
        <h1 class="top-header__title">
          {{ headerClientName }}
          <span v-if="headerWorkflowStatusText" class="top-header__status">({{ headerWorkflowStatusText }})</span>
        </h1>
      </div>
      <div class="top-header__actions">
        <!-- View 模式：普通用户与管理员均显示 Edit -->
        <template v-if="isViewMode">
          <el-button
            v-if="canSubmitAction"
            type="primary"
            :loading="workflowLoading"
            @click="handleHeaderSubmit"
          >
            Submit
          </el-button>
          <el-button v-if="canShowEditButton" type="primary" @click="handleEdit">
            Edit
          </el-button>
          <el-button
            v-if="clientId"
            :class="['top-header__btn-progress', { 'top-header__btn-progress--muted': headerProgressMuted }]"
            @click="openProgressDialog"
          >
            Progress
          </el-button>
          <el-button v-if="canReviewAction" type="success" @click="enterReviewMode">
            Review
          </el-button>
        </template>
        <template v-else-if="isReviewMode">
          <el-button
            type="success"
            @click="handleReviewDecision(true)"
            :loading="workflowLoading"
            :disabled="saving"
          >
            Approve
          </el-button>
          <el-button
            type="danger"
            plain
            @click="handleReviewDecision(false)"
            :loading="workflowLoading"
            :disabled="saving"
          >
            Reject
          </el-button>
          <el-button v-if="clientId" @click="openProgressDialog">
            Progress
          </el-button>
        </template>
        <!-- Edit/New 模式：显示保存按钮（管理员可编辑不可新建，故 admin 下仅 edit 会进入此处） -->
        <template v-else-if="!isViewMode">
          <el-button
            type="primary"
            @click="() => handleSave(false)"
            :disabled="saving"
          >
            Save
          </el-button>
          <el-button
            @click="() => handleSave(true)"
            :disabled="saving"
          >
            Save & Close
          </el-button>
          <el-button v-if="clientId" @click="openProgressDialog">
            Progress
          </el-button>
        </template>
        <span v-if="currentTabLastSaved" class="last-saved">
          {{ currentTabLastSaved }}
        </span>
      </div>
    </div>

    <!-- Tab 导航 + 主内容区（General～Fee 时若有评论则显示右侧栏） -->
    <div class="client-tabs-shell">
      <div class="client-tabs-shell__main">
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
              <div class="section-title-row">
                <h3 class="section-title">Basic</h3>
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('GENERAL', 'General')"
                />
              </div>

              <!-- Individual 字段 -->
              <template v-if="clientForm.general.contactNature === 'Individual'">
                <!-- 第1行: Contact Type, RM -->
                <div class="form-row">
                  <el-form-item label="Contact Type">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.contactType) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="clientForm.general.contactType" disabled />
                    </template>
                  </el-form-item>
                  <el-form-item label="RM" prop="general.rm">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.rm) }}</span>
                    </template>
                    <template v-else>
                      <el-input
                        v-model="clientForm.general.rm"
                        placeholder="Please select RM"
                        :readonly="isViewMode"
                        :disabled="isViewMode || rmLoading"
                        @click.native.stop="!isViewMode && handleSelectRM()"
                        :style="isViewMode ? '' : 'cursor: pointer;'"
                      >
                        <template #suffix>
                          <el-icon v-if="rmLoading" class="is-loading"><Loading /></el-icon>
                          <el-icon v-else><User /></el-icon>
                        </template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第2行: Contact Nature, ARM -->
                <div class="form-row">
                  <el-form-item label="Contact Nature" prop="general.contactNature">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.contactNature) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                  <el-form-item label="ARM">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).arm) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                </div>

                <!-- 第3行: Client Id, Introducer（Client Id 自动编号，未保存时占位提示，保存后只读） -->
                <div class="form-row">
                  <el-form-item label="Client Id">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.clientId) }}</span>
                    </template>
                    <template v-else>
                      <span :class="['view-mode-text', { 'client-id-placeholder': !clientForm.general.clientId }]">
                        {{ clientForm.general.clientId || 'This field will be auto-generated after saving' }}
                      </span>
                    </template>
                  </el-form-item>
                  <el-form-item label="Introducer">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ getIntroducerName((clientForm.general as any).introducerId) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="(clientForm.general as any).introducerId"
                        placeholder="Please select"
                        style="width: 100%"
                        :disabled="isViewMode || introducerLoading"
                        :loading="introducerLoading"
                        filterable
                        clearable
                        @focus="!isViewMode && loadIntroducersIfNeeded()"
                      >
                        <el-option
                          v-for="intro in visibleIntroducers"
                          :key="intro.id"
                          :label="intro.introducer"
                          :value="intro.id"
                        />
                      </el-select>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第4行: Client Relationship Status, Gender -->
                <div class="form-row">
                  <el-form-item label="Client Relationship Status">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.clientRelationshipStatus) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="clientForm.general.clientRelationshipStatus"
                        placeholder="Please select"
                        style="width: 100%"
                        :disabled="isViewMode"
                      >
                        <el-option label="Prospecting" value="Prospecting" />
                        <el-option label="On Boarding" value="On Boarding" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Gender">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).gender) }}</span>
                    </template>
                    <template v-else>
                      <el-radio-group v-model="(clientForm.general as any).gender" :disabled="isViewMode">
                        <el-radio label="Male">Male</el-radio>
                        <el-radio label="Female">Female</el-radio>
                      </el-radio-group>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第5行: Title, Marital Status -->
                <div class="form-row">
                  <el-form-item label="Title" prop="general.title">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).title) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).title" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Mr." value="Mr." />
                        <el-option label="Mrs." value="Mrs." />
                        <el-option label="Miss" value="Miss" />
                        <el-option label="Dr." value="Dr." />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Marital Status">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).maritalStatus) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).maritalStatus" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Single" value="Single" />
                        <el-option label="Married" value="Married" />
                        <el-option label="Divorced" value="Divorced" />
                        <el-option label="Widowed" value="Widowed" />
                      </el-select>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第6行: First Name, Education Level -->
                <div class="form-row">
                  <el-form-item label="First Name" prop="general.firstName">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).firstName) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).firstName" placeholder="Please enter first name" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label="Education Level">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).educationLevel) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).educationLevel" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="High School" value="High School" />
                        <el-option label="Bachelor" value="Bachelor" />
                        <el-option label="Master" value="Master" />
                        <el-option label="PhD" value="PhD" />
                      </el-select>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第7行: Last Name, Birthday(dd/mm/yyyy) -->
                <div class="form-row">
                  <el-form-item label="Last Name" prop="general.lastName">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).lastName) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).lastName" placeholder="Please enter last name" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label="Birthday (dd/mm/yyyy)">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).birthday) }}</span>
                    </template>
                    <template v-else>
                      <el-date-picker
                        v-model="(clientForm.general as any).birthday"
                        type="date"
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                        value-format="DD/MM/YYYY"
                        style="width: 100%"
                        :disabled="isViewMode"
                      />
                    </template>
                  </el-form-item>
                </div>

                <!-- 第8行: Chinese Name, Country/Region of Birth -->
                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).chineseName) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label="Country/Region of Birth">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).countryOfBirth) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                </div>

                <!-- 第9行: Id Type, Dual Citizenship -->
                <div class="form-row">
                  <el-form-item label="Id Type">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).idType) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Passport" value="Passport" />
                        <el-option label="ID Card" value="ID Card" />
                        <el-option label="Driver License" value="Driver License" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Dual Citizenship">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).dualCitizenship) }}</span>
                    </template>
                    <template v-else>
                      <el-switch
                        v-model="(clientForm.general as any).dualCitizenship"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ (clientForm.general as any).dualCitizenship ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第10行: Id No., Nationality -->
                <div class="form-row">
                  <el-form-item label="Id No.">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).idNo) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label="Nationality">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).nationality) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="(clientForm.general as any).nationality"
                        placeholder="Please select nationality"
                        style="width: 100%"
                        :disabled="isViewMode"
                        filterable
                        clearable
                        class="nationality-select"
                      >
                        <template #prefix>
                          <el-icon class="nationality-prefix-icon"><Place /></el-icon>
                        </template>
                        <el-option
                          v-for="country in nationalityList"
                          :key="country"
                          :label="country"
                          :value="country"
                        />
                      </el-select>
                    </template>
                  </el-form-item>
                </div>

                <!-- 一行：Id Expiry（左列固定）+ Secondary Nationality（右列，仅 Dual Citizenship 打开时显示），Id No. 与 Id Expiry 之间无空行，Id Expiry 位置不变 -->
                <div class="form-row">
                  <el-form-item label="Id Expiry (dd/mm/yyyy)">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).idExpiry) }}</span>
                    </template>
                    <template v-else>
                      <el-date-picker
                        v-model="(clientForm.general as any).idExpiry"
                        type="date"
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                        value-format="DD/MM/YYYY"
                        style="width: 100%"
                        :disabled="isViewMode"
                      />
                    </template>
                  </el-form-item>
                  <el-form-item v-if="(clientForm.general as any).dualCitizenship" label="Secondary Nationality">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).secondaryNationality) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="(clientForm.general as any).secondaryNationality"
                        placeholder="Please select secondary nationality"
                        style="width: 100%"
                        :disabled="isViewMode"
                        filterable
                        clearable
                        class="nationality-select"
                      >
                        <template #prefix>
                          <el-icon class="nationality-prefix-icon"><Place /></el-icon>
                        </template>
                        <el-option
                          v-for="country in nationalityList"
                          :key="country"
                          :label="country"
                          :value="country"
                        />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item v-else label=" "></el-form-item>
                </div>
              </template>

              <!-- Corporate 字段（如图二：左列 11 项，右列 RM/ARM/Introducer/日期/地区/新增 Business Domicile、Registration Date） -->
              <template v-else>
                <!-- 第1行: Contact Type, RM -->
                <div class="form-row">
                  <el-form-item label="Contact Type">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.contactType) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="clientForm.general.contactType" disabled />
                    </template>
                  </el-form-item>
                  <el-form-item label="RM" prop="general.rm">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.rm) }}</span>
                    </template>
                    <template v-else>
                      <el-input
                        v-model="clientForm.general.rm"
                        placeholder="Please select RM"
                        :readonly="isViewMode"
                        :disabled="isViewMode || rmLoading"
                        @click.native.stop="!isViewMode && handleSelectRM()"
                        :style="isViewMode ? '' : 'cursor: pointer;'"
                      >
                        <template #suffix>
                          <el-icon v-if="rmLoading" class="is-loading"><Loading /></el-icon>
                          <el-icon v-else><User /></el-icon>
                        </template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第2行: Contact Nature, ARM -->
                <div class="form-row">
                  <el-form-item label="Contact Nature" prop="general.contactNature">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.contactNature) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                  <el-form-item label="ARM">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).arm) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                </div>

                <!-- 第3行: Client Id, Introducer -->
                <div class="form-row">
                  <el-form-item label="Client Id">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.clientId) }}</span>
                    </template>
                    <template v-else>
                      <span :class="['view-mode-text', { 'client-id-placeholder': !clientForm.general.clientId }]">
                        {{ clientForm.general.clientId || 'This field will be auto-generated after saving' }}
                      </span>
                    </template>
                  </el-form-item>
                  <el-form-item label="Introducer">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ getIntroducerName((clientForm.general as any).introducerId) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="(clientForm.general as any).introducerId"
                        placeholder="Please select"
                        style="width: 100%"
                        :disabled="isViewMode || introducerLoading"
                        :loading="introducerLoading"
                        filterable
                        clearable
                        @focus="!isViewMode && loadIntroducersIfNeeded()"
                      >
                        <el-option
                          v-for="intro in visibleIntroducers"
                          :key="intro.id"
                          :label="intro.introducer"
                          :value="intro.id"
                        />
                      </el-select>
                    </template>
                  </el-form-item>
                </div>

                <!-- 第4行: Client Relationship Status, Date of Company Search/COI Issued -->
                <div class="form-row">
                  <el-form-item label="Client Relationship Status">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(clientForm.general.clientRelationshipStatus) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="clientForm.general.clientRelationshipStatus"
                        placeholder="Please select"
                        style="width: 100%"
                        :disabled="isViewMode"
                      >
                        <el-option label="Prospecting" value="Prospecting" />
                        <el-option label="On Boarding" value="On Boarding" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Date of Company Search/COI Issued (dd/mm/yyyy)" style="align-self: flex-start;">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).dateOfCompanySearch) }}</span>
                    </template>
                    <template v-else>
                      <el-date-picker
                        v-model="(clientForm.general as any).dateOfCompanySearch"
                        type="date"
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                        value-format="DD/MM/YYYY"
                        style="width: 100%"
                        :disabled="isViewMode"
                      />
                    </template>
                  </el-form-item>
                </div>

                <!-- 第5行: Company Name, Country/Region of Registration -->
                <div class="form-row">
                  <el-form-item label="Company Name" prop="general.companyName">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).companyName) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).companyName" placeholder="Please enter company name" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label="Country/Region of Registration">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).countryOfRegistration) }}</span>
                    </template>
                    <template v-else>
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
                    </template>
                  </el-form-item>
                </div>

                <!-- 第6行: Corporate Type, Business Domicile（新增） -->
                <div class="form-row">
                  <el-form-item label="Corporate Type">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).corporateType) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).corporateType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Limited Company" value="Limited Company" />
                        <el-option label="Corporation" value="Corporation" />
                        <el-option label="Partnership" value="Partnership" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Business Domicile">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).businessDomicile) }}</span>
                    </template>
                    <template v-else>
                      <el-select
                        v-model="(clientForm.general as any).businessDomicile"
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
                    </template>
                  </el-form-item>
                </div>

                <!-- 第7行: Industry, Registration Date（新增，dd/mm/yyyy） -->
                <div class="form-row">
                  <el-form-item label="Industry">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).industry) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).industry" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Finance" value="Finance" />
                        <el-option label="Technology" value="Technology" />
                        <el-option label="Manufacturing" value="Manufacturing" />
                        <el-option label="Retail" value="Retail" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Registration Date (dd/mm/yyyy)" style="align-self: flex-start;">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).registrationDate) }}</span>
                    </template>
                    <template v-else>
                      <el-date-picker
                        v-model="(clientForm.general as any).registrationDate"
                        type="date"
                        placeholder="Select date"
                        format="DD/MM/YYYY"
                        value-format="DD/MM/YYYY"
                        style="width: 100%"
                        :disabled="isViewMode"
                      />
                    </template>
                  </el-form-item>
                </div>

                <!-- 第8行: State Owned（左），右侧留空 -->
                <div class="form-row">
                  <el-form-item label="State Owned">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).stateOwned) }}</span>
                    </template>
                    <template v-else>
                      <el-switch
                        v-model="(clientForm.general as any).stateOwned"
                        :active-value="true"
                        :inactive-value="false"
                        :disabled="isViewMode"
                      />
                      <span style="margin-left: 8px;">{{ (clientForm.general as any).stateOwned ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                  <el-form-item label=" "></el-form-item>
                </div>

                <!-- 第9行: Chinese Name（左列） -->
                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).chineseName) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label=" "></el-form-item>
                </div>

                <!-- 第10行: Id Type（左列） -->
                <div class="form-row">
                  <el-form-item label="Id Type">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).idType) }}</span>
                    </template>
                    <template v-else>
                      <el-select v-model="(clientForm.general as any).idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Business License" value="Business License" />
                        <el-option label="Registration Certificate" value="Registration Certificate" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label=" "></el-form-item>
                </div>

                <!-- 第11行: Id No.（左列） -->
                <div class="form-row">
                  <el-form-item label="Id No.">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue((clientForm.general as any).idNo) }}</span>
                    </template>
                    <template v-else>
                      <el-input v-model="(clientForm.general as any).idNo" placeholder="Please enter ID number" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item label=" "></el-form-item>
                </div>
              </template>
            </div>

            <!-- Contact Section：公司类型为双列（左 7 个联系人字段 + 右 5 个原字段），个人类型保持原布局 -->
            <div class="form-section">
              <h3 class="section-title">Contact</h3>
              <!-- 公司类型：左列 7 个联系人字段，右列 5 个原字段，全部非必填 -->
              <template v-if="clientForm.general.contactNature === 'Corporate'">
                <div class="form-row">
                  <el-form-item label="Title">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.title) }}</span></template>
                    <template v-else>
                      <el-select v-model="clientForm.contact.title" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Mr." value="Mr." /><el-option label="Ms." value="Ms." /><el-option label="Mrs." value="Mrs." /><el-option label="Dr." value="Dr." />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Mobile Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.mobilePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.mobilePhone" placeholder="Please enter mobile phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="First Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.firstName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.contact.firstName" placeholder="Please enter first name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Home Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.homePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.homePhone" placeholder="Please enter home phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Last Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.lastName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.contact.lastName" placeholder="Please enter last name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Primary Email">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.primaryEmail) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.primaryEmail" placeholder="Please enter email" :disabled="isViewMode">
                        <template #suffix><el-icon><Message /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.chineseName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.contact.chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Address" style="width: 100%;">
                    <template v-if="isViewMode"><span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(clientForm.contact.address) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.address" type="textarea" :rows="3" placeholder="Please enter address" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Id Type">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.idType) }}</span></template>
                    <template v-else>
                      <el-select v-model="clientForm.contact.idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Business License" value="Business License" /><el-option label="Registration Certificate" value="Registration Certificate" />
                        <el-option label="Passport" value="Passport" /><el-option label="ID Card" value="ID Card" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.jurisdictionDiffers) }}</span></template>
                    <template v-else>
                      <el-switch v-model="clientForm.contact.jurisdictionDiffers" :active-value="true" :inactive-value="false" :disabled="isViewMode" />
                      <span style="margin-left: 8px;">{{ clientForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Id No.">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.idNo) }}</span></template>
                    <template v-else><el-input v-model="clientForm.contact.idNo" placeholder="Please enter ID number" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
                <div class="form-row" style="margin-bottom: 20px;">
                  <el-form-item label="Id Expiry (dd/mm/yyyy)">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.idExpiry) }}</span></template>
                    <template v-else>
                      <el-date-picker v-model="clientForm.contact.idExpiry" type="date" placeholder="Select date" format="DD/MM/YYYY" value-format="DD/MM/YYYY" style="width: 100%" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
              </template>
              <!-- 个人类型：原布局，仅 5 个字段 -->
              <template v-else>
                <div class="form-row">
                  <el-form-item label="Mobile Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.mobilePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.mobilePhone" placeholder="Please enter mobile phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                  <el-form-item label="Primary Email">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.primaryEmail) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.primaryEmail" placeholder="Please enter email" :disabled="isViewMode">
                        <template #suffix><el-icon><Message /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row" style="margin-bottom: 10px;">
                  <el-form-item label="Home Phone" style="align-self: flex-start;">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.homePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.homePhone" placeholder="Please enter home phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                  <el-form-item label="Address" style="width: 100%;">
                    <template v-if="isViewMode"><span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(clientForm.contact.address) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.contact.address" type="textarea" :rows="3" placeholder="Please enter address" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row" style="margin-top: 0; margin-bottom: 20px;">
                  <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.contact.jurisdictionDiffers) }}</span></template>
                    <template v-else>
                      <el-switch v-model="clientForm.contact.jurisdictionDiffers" :active-value="true" :inactive-value="false" :disabled="isViewMode" />
                      <span style="margin-left: 8px;">{{ clientForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
              </template>
            </div>

            <!-- Secondary Contact Section：字段与 Contact 相同，公司类型双列、个人类型单列，全部非必填 -->
            <div class="form-section">
              <h3 class="section-title">Secondary Contact</h3>
              <template v-if="clientForm.general.contactNature === 'Corporate'">
                <div class="form-row">
                  <el-form-item label="Title">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.title) }}</span></template>
                    <template v-else>
                      <el-select v-model="clientForm.secondaryContact.title" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Mr." value="Mr." /><el-option label="Ms." value="Ms." /><el-option label="Mrs." value="Mrs." /><el-option label="Dr." value="Dr." />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Mobile Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.mobilePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.mobilePhone" placeholder="Please enter mobile phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="First Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.firstName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.secondaryContact.firstName" placeholder="Please enter first name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Home Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.homePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.homePhone" placeholder="Please enter home phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Last Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.lastName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.secondaryContact.lastName" placeholder="Please enter last name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Primary Email">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.primaryEmail) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.primaryEmail" placeholder="Please enter email" :disabled="isViewMode">
                        <template #suffix><el-icon><Message /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Chinese Name">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.chineseName) }}</span></template>
                    <template v-else><el-input v-model="clientForm.secondaryContact.chineseName" placeholder="Please enter Chinese name" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item label="Address" style="width: 100%;">
                    <template v-if="isViewMode"><span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(clientForm.secondaryContact.address) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.address" type="textarea" :rows="3" placeholder="Please enter address" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Id Type">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.idType) }}</span></template>
                    <template v-else>
                      <el-select v-model="clientForm.secondaryContact.idType" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                        <el-option label="Business License" value="Business License" /><el-option label="Registration Certificate" value="Registration Certificate" />
                        <el-option label="Passport" value="Passport" /><el-option label="ID Card" value="ID Card" />
                      </el-select>
                    </template>
                  </el-form-item>
                  <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.jurisdictionDiffers) }}</span></template>
                    <template v-else>
                      <el-switch v-model="clientForm.secondaryContact.jurisdictionDiffers" :active-value="true" :inactive-value="false" :disabled="isViewMode" />
                      <span style="margin-left: 8px;">{{ clientForm.secondaryContact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row">
                  <el-form-item label="Id No.">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.idNo) }}</span></template>
                    <template v-else><el-input v-model="clientForm.secondaryContact.idNo" placeholder="Please enter ID number" :disabled="isViewMode" /></template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
                <div class="form-row" style="margin-bottom: 20px;">
                  <el-form-item label="Id Expiry (dd/mm/yyyy)">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.idExpiry) }}</span></template>
                    <template v-else>
                      <el-date-picker v-model="clientForm.secondaryContact.idExpiry" type="date" placeholder="Select date" format="DD/MM/YYYY" value-format="DD/MM/YYYY" style="width: 100%" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
              </template>
              <template v-else>
                <div class="form-row">
                  <el-form-item label="Mobile Phone">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.mobilePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.mobilePhone" placeholder="Please enter mobile phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                  <el-form-item label="Primary Email">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.primaryEmail) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.primaryEmail" placeholder="Please enter email" :disabled="isViewMode">
                        <template #suffix><el-icon><Message /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row" style="margin-bottom: 10px;">
                  <el-form-item label="Home Phone" style="align-self: flex-start;">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.homePhone) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.homePhone" placeholder="Please enter home phone" :disabled="isViewMode">
                        <template #suffix><el-icon><Phone /></el-icon></template>
                      </el-input>
                    </template>
                  </el-form-item>
                  <el-form-item label="Address" style="width: 100%;">
                    <template v-if="isViewMode"><span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(clientForm.secondaryContact.address) }}</span></template>
                    <template v-else>
                      <el-input v-model="clientForm.secondaryContact.address" type="textarea" :rows="3" placeholder="Please enter address" :disabled="isViewMode" />
                    </template>
                  </el-form-item>
                </div>
                <div class="form-row" style="margin-top: 0; margin-bottom: 20px;">
                  <el-form-item label="Jurisdiction of Contact No. and Address Differs">
                    <template v-if="isViewMode"><span class="view-mode-text">{{ formatDisplayValue(clientForm.secondaryContact.jurisdictionDiffers) }}</span></template>
                    <template v-else>
                      <el-switch v-model="clientForm.secondaryContact.jurisdictionDiffers" :active-value="true" :inactive-value="false" :disabled="isViewMode" />
                      <span style="margin-left: 8px;">{{ clientForm.secondaryContact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
                    </template>
                  </el-form-item>
                  <el-form-item></el-form-item>
                </div>
              </template>
            </div>

            <!-- Portfolio Section -->
            <div class="form-section portfolio-section">
              <div class="section-header">
                <h3 class="section-title">Portfolio</h3>
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleNewPortfolio">
                  New Portfolio
                </el-button>
              </div>

              <el-table
                v-if="clientForm.portfolios && clientForm.portfolios.length > 0"
                :data="clientForm.portfolios"
                class="portfolio-table"
                border
              >
                <el-table-column prop="bank" label="Bank" />
                <el-table-column prop="bookingCentre" label="Booking Centre" />
                <el-table-column prop="portfolioNo" label="Portfolio No." />
                <el-table-column label="Upload Time">
                  <template #default="{ row }">
                    {{ formatDateTime(row.uploadTime) }}
                  </template>
                </el-table-column>
                <!-- 仅在可编辑模式下展示操作列，且去掉列头文案 -->
                <el-table-column v-if="!isViewMode" width="150">
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
        <div class="tab-content" v-loading="tabLoading.kyc" element-loading-text="Loading KYC data...">
          <!-- Information：白卡片，左列 KYC Date / Next Review Date，右列 KYC Status，与图一致 -->
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
                      <el-select
                        v-model="kycData.kycStatus"
                        placeholder="Please select"
                        class="kyc-info-input"
                        :disabled="isViewMode"
                        clearable
                      >
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
              <h3 class="kyc-upload-title">Upload Supporting Documents</h3>
              <div class="kyc-upload-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && kycData.documents.length"
                  @click="bulkDownloadKycList(kycData.documents)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('KYC', 'KYC')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadKYCDocument('SUPPORTING_DOCUMENT')">
                  Upload
                </el-button>
              </div>
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
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteKYCDocument(row, 'documents')" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="kyc-section">
            <div class="kyc-upload-header">
              <h3 class="kyc-upload-title">Upload Name Screening Documents</h3>
              <div class="kyc-upload-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && kycData.nameScreeningDocuments.length"
                  @click="bulkDownloadKycList(kycData.nameScreeningDocuments)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('KYC', 'KYC')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadKYCDocument('NAME_SCREENING')">
                  Upload
                </el-button>
              </div>
            </div>
            <el-table
              v-if="kycData.nameScreeningDocuments && kycData.nameScreeningDocuments.length > 0"
              :data="kycData.nameScreeningDocuments"
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
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteKYCDocument(row, 'nameScreeningDocuments')" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Investment Risk Profile" name="risk">
        <div class="tab-content" v-loading="tabLoading.risk" element-loading-text="Loading risk profile data...">
          <el-form :model="riskProfileData" label-width="250px" class="risk-profile-form">
            <!-- Overview Section -->
            <div class="form-section">
              <div class="section-title-row">
                <h3 class="section-title">Overview</h3>
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('RISK', 'Investment Risk Profile')"
                />
              </div>
              <div class="form-row">
                <el-form-item label="Investment Risk Rating">
                  <template v-if="isViewMode">
                    <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.investmentRiskRating) }}</span>
                  </template>
                  <template v-else>
                    <el-select v-model="riskProfileData.investmentRiskRating" placeholder="Please select" style="width: 100%" :disabled="isViewMode">
                      <el-option label="Conservative" value="Conservative" />
                      <el-option label="Moderate" value="Moderate" />
                      <el-option label="Balanced" value="Balanced" />
                      <el-option label="Growth" value="Growth" />
                      <el-option label="Aggressive" value="Aggressive" />
                    </el-select>
                  </template>
                </el-form-item>
                <el-form-item label="HongKong PI">
                  <template v-if="isViewMode">
                    <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.hongKongPI) }}</span>
                  </template>
                  <template v-else>
                    <el-switch
                      v-model="riskProfileData.hongKongPI"
                      :active-value="true"
                      :inactive-value="false"
                      :disabled="isViewMode"
                    />
                    <span style="margin-left: 8px;">{{ riskProfileData.hongKongPI ? 'Yes' : 'No' }}</span>
                  </template>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item label="Remarks" style="width: 100%;">
                  <template v-if="isViewMode">
                    <span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(riskProfileData.remarks) }}</span>
                  </template>
                  <template v-else>
                    <el-input
                      v-model="riskProfileData.remarks"
                      type="textarea"
                      :rows="4"
                      placeholder="Please enter remarks"
                      :disabled="isViewMode"
                    />
                  </template>
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
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.age65AndAbove) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="riskProfileData.vulnerableClientAssessment.age65AndAbove"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.age65AndAbove ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">2. Physical or intellectual disabilities</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.physicalOrIntellectualDisabilities) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="riskProfileData.vulnerableClientAssessment.physicalOrIntellectualDisabilities"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.physicalOrIntellectualDisabilities ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">3. Not proficient in written or spoken English</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.notProficientInEnglish) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="riskProfileData.vulnerableClientAssessment.notProficientInEnglish"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.notProficientInEnglish ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">4. Education primary or below and has no investment</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.educationPrimaryOrBelow) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="riskProfileData.vulnerableClientAssessment.educationPrimaryOrBelow"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.educationPrimaryOrBelow ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                </div>
                <div class="vulnerable-client-info">
                  <div class="vulnerable-question-item">
                    <div class="question-label">Vulnerable Client</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.vulnerableClient) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="riskProfileData.vulnerableClientAssessment.vulnerableClient"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ riskProfileData.vulnerableClientAssessment.vulnerableClient ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                  <div class="vulnerable-question-item">
                    <div class="question-label">Review Date (dd/mm/yyyy)</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(riskProfileData.vulnerableClientAssessment.reviewDate) }}</span>
                      </template>
                      <template v-else>
                        <el-date-picker
                          v-model="riskProfileData.vulnerableClientAssessment.reviewDate"
                          type="date"
                          placeholder="Select date"
                          format="DD/MM/YYYY"
                          value-format="DD/MM/YYYY"
                          style="width: 60%"
                          :disabled="isViewMode"
                        />
                      </template>
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
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(row.knowledge) }}</span>
                    </template>
                    <template v-else>
                      <el-checkbox v-model="row.knowledge" :disabled="isViewMode" />
                    </template>
                  </template>
                </el-table-column>
                <el-table-column label="Experience" width="150" align="center">
                  <template #header>
                    <span class="table-header-bold">Experience</span>
                  </template>
                  <template #default="{ row }">
                    <template v-if="isViewMode">
                      <span class="view-mode-text">{{ formatDisplayValue(row.experience) }}</span>
                    </template>
                    <template v-else>
                      <el-checkbox v-model="row.experience" :disabled="isViewMode" />
                    </template>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Documents" name="documents">
        <div class="tab-content" v-loading="tabLoading.documents" element-loading-text="Loading documents...">
          <!-- Upload Identity Proof -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Identity Proof</h3>
              <div class="section-header-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && documentsData.identity.length"
                  @click="bulkDownloadDocumentList(documentsData.identity)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('DOCUMENTS', 'Documents — Identity')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('identity')">
                  Upload
                </el-button>
              </div>
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
              <el-table-column label="Action" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <template v-if="!isViewMode">
                    <el-divider direction="vertical" />
                    <el-link type="primary" @click="handleDeleteDocument(row)" :underline="false">
                      Delete
                    </el-link>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload Address Proof -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Address Proof</h3>
              <div class="section-header-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && documentsData.address.length"
                  @click="bulkDownloadDocumentList(documentsData.address)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('DOCUMENTS', 'Documents — Address')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('address')">
                  Upload
                </el-button>
              </div>
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
              <el-table-column label="Action" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <template v-if="!isViewMode">
                    <el-divider direction="vertical" />
                    <el-link type="primary" @click="handleDeleteDocument(row)" :underline="false">
                      Delete
                    </el-link>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload Forms -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Forms</h3>
              <div class="section-header-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && documentsData.forms.length"
                  @click="bulkDownloadDocumentList(documentsData.forms)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('DOCUMENTS', 'Documents — Forms')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('forms')">
                  Upload
                </el-button>
              </div>
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
              <el-table-column label="Action" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider v-if="!isViewMode" direction="vertical" />
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
              <div class="section-header-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && documentsData.statements.length"
                  @click="bulkDownloadDocumentList(documentsData.statements)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('DOCUMENTS', 'Documents — Statements')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('statements')">
                  Upload
                </el-button>
              </div>
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
              <el-table-column label="Action" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider v-if="!isViewMode" direction="vertical" />
                  <el-link v-if="!isViewMode" type="primary" @click="handleDeleteDocument(row)" :underline="false">
                    Delete
                  </el-link>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Upload Others Documents -->
          <div class="document-section">
            <div class="section-header">
              <h3 class="section-title">Upload Others Documents</h3>
              <div class="section-header-actions">
                <BulkDownloadButton
                  v-if="canBulkDownloadModule && documentsData.others.length"
                  @click="bulkDownloadDocumentList(documentsData.others)"
                />
                <AddCommentButton
                  v-if="showModuleCommentEntry"
                  @click="openCommentFromModule('DOCUMENTS', 'Documents — Others')"
                />
                <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="handleUploadDocument('others')">
                  Upload
                </el-button>
              </div>
            </div>
            <el-table
              v-if="documentsData.others && documentsData.others.length > 0"
              :data="documentsData.others"
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
              <el-table-column label="Action" width="200">
                <template #default="{ row }">
                  <el-link type="primary" @click="handleOpenDocument(row)" :underline="false">
                    Open
                  </el-link>
                  <el-divider v-if="!isViewMode" direction="vertical" />
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
        <div class="tab-content" v-loading="tabLoading.fee" element-loading-text="Loading fee schedule data...">
          <div v-if="showModuleCommentEntry" class="fee-tab-comment-bar">
            <AddCommentButton @click="openCommentFromModule('FEE', 'Fee Schedule')" />
          </div>
          <el-form :model="feeScheduleData" label-width="250px" class="fee-schedule-form">
            <div class="form-section">
              <div class="vulnerable-assessment-container">
                <div class="vulnerable-questions">
                  <!-- Management Fee -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Management Fee</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.managementFee.enabled) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="feeScheduleData.managementFee.enabled"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ feeScheduleData.managementFee.enabled ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                    <template v-if="feeScheduleData.managementFee.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Yearly Management Fee (%)</div>
                          <template v-if="isViewMode">
                            <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.managementFee.yearlyManagementFee) }}</span>
                          </template>
                          <template v-else>
                            <el-input v-model.number="feeScheduleData.managementFee.yearlyManagementFee" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                          </template>
                        </div>
                        <div class="fee-form-item">
                          <div class="fee-form-label">Minimum Management Fee (p.a.)</div>
                          <template v-if="isViewMode">
                            <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.managementFee.minimumManagementFee) }}</span>
                          </template>
                          <template v-else>
                            <el-input v-model.number="feeScheduleData.managementFee.minimumManagementFee" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- Retrocession -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Retrocession</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.retrocession.enabled) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="feeScheduleData.retrocession.enabled"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ feeScheduleData.retrocession.enabled ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                  </div>
                </div>

                <div class="vulnerable-client-info">
                  <!-- Performance Fee -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Performance Fee</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.performanceFee.enabled) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="feeScheduleData.performanceFee.enabled"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ feeScheduleData.performanceFee.enabled ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                    <template v-if="feeScheduleData.performanceFee.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Hurdle Rate (%)</div>
                          <template v-if="isViewMode">
                            <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.performanceFee.hurdleRate) }}</span>
                          </template>
                          <template v-else>
                            <el-input v-model.number="feeScheduleData.performanceFee.hurdleRate" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                          </template>
                        </div>
                        <div class="fee-form-item">
                          <div class="fee-form-label">Profit shared to XinXi (%)</div>
                          <template v-if="isViewMode">
                            <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.performanceFee.profitSharedToXinXi) }}</span>
                          </template>
                          <template v-else>
                            <el-input v-model.number="feeScheduleData.performanceFee.profitSharedToXinXi" type="number" placeholder="Please enter" class="fee-input" :disabled="isViewMode" />
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- Others -->
                  <div class="vulnerable-question-item">
                    <div class="question-label">Others</div>
                    <div class="question-control">
                      <template v-if="isViewMode">
                        <span class="view-mode-text">{{ formatDisplayValue(feeScheduleData.others.enabled) }}</span>
                      </template>
                      <template v-else>
                        <el-switch
                          v-model="feeScheduleData.others.enabled"
                          :active-value="true"
                          :inactive-value="false"
                          :disabled="isViewMode"
                        />
                        <span style="margin-left: 8px;">{{ feeScheduleData.others.enabled ? 'Yes' : 'No' }}</span>
                      </template>
                    </div>
                    <template v-if="feeScheduleData.others.enabled">
                      <div class="fee-form-items">
                        <div class="fee-form-item">
                          <div class="fee-form-label">Details</div>
                          <template v-if="isViewMode">
                            <span class="view-mode-text" style="white-space: pre-wrap;">{{ formatDisplayValue(feeScheduleData.others.details) }}</span>
                          </template>
                          <template v-else>
                            <el-input
                              v-model="feeScheduleData.others.details"
                              type="textarea"
                              :rows="4"
                              placeholder="Please enter details"
                              class="fee-input"
                              :disabled="isViewMode"
                              :resize="'none'"
                            />
                          </template>
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

      <el-tab-pane v-if="clientId" label="Comments" name="comments">
        <div class="tab-content">
          <ClientCommentsPanel
            ref="commentsPanelRef"
            :client-id="clientId"
            :client-type="currentClientType"
            :current-user-id="authStore.user?.id"
            :default-module="commentsContextModule"
            @changed="handleCommentsChanged"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
      </div>
      <aside
        v-if="commentsSideRailVisible"
        class="client-tabs-shell__rail"
        :class="{ 'is-narrow': commentsRailCollapsed }"
      >
        <ClientCommentsSidebar
          ref="commentsSidebarRef"
          v-model:collapsed="commentsRailCollapsed"
          :client-id="clientId!"
          :client-type="currentClientType"
          @open-comments-tab="goToCommentsTab"
          @count-updated="setCommentTotalCount"
        />
      </aside>
    </div>

    <ClientProgressDialog
      v-model="progressDialogVisible"
      :client-id="clientId"
      :client-type="clientId ? currentClientType : null"
      @updated="handleProgressUpdated"
      @review="enterReviewMode"
    />

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
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-exceed="handleFileExceed"
        v-model:file-list="fileList"
        :limit="10"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          Drag & drop files here, or <em>click to upload</em>
        </div>
        <div class="el-upload__tip">
          PDF, JPEG or PNG — up to 10 files per batch (all-or-nothing on the server). Max 100MB per file.
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="documentUploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitDocumentUpload" :disabled="uploading">
          Upload
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus'
import { ArrowLeft, Plus, User, Phone, Message, Location, UploadFilled, Loading, Place } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { userClientApi, type Client, type ContactInfo, type IndividualGeneralInfo, type CorporateGeneralInfo, type CreateClientParams } from '@/api/user/client'
import { portfolioApi, type Portfolio, type CreatePortfolioParams } from '@/api/user/portfolio'
import { accountApi, type Account } from '@/api/account'
import { introducerApi, type Introducer } from '@/api/introducer'
import { bankApi, type BankCentre } from '@/api/bank'
import { kycApi, type KYCData, type KYCDocument } from '@/api/user/kyc'
import { documentsApi, type DocumentsData, type Document, type DocumentType } from '@/api/user/documents'
import { riskProfileApi, type InvestmentRiskProfile, type InvestmentType } from '@/api/user/risk-profile'
import { feeScheduleApi, type FeeSchedule } from '@/api/user/fee-schedule'
import { workflowApi, type ClientProgressData, type ClientType, type ClientComment } from '@/api/user/workflow'
import ClientProgressDialog from '@/components/client/ClientProgressDialog.vue'
import ClientCommentsPanel from '@/components/client/ClientCommentsPanel.vue'
import ClientCommentsSidebar from '@/components/client/ClientCommentsSidebar.vue'
import AddCommentButton from '@/components/common/AddCommentButton.vue'
import BulkDownloadButton from '@/components/common/BulkDownloadButton.vue'
import { formatDateTime } from '@/utils/date'
import { formatFileSizeMb } from '@/utils/file-size'
import {
  getProgressLabel,
  isClientEditable,
  isPendingSubmissionStatus,
  mapTabToCommentModule,
  type WorkflowModule
} from '@/utils/client-progress'
import { getClientBasePath, getClientListPath, isAdminClientRoute, isStandaloneClientRoute } from '@/utils/client-routes'
import { isAdminRole } from '@/utils/roles'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const clientId = computed(() => {
  // 如果是新建模式（路由名称为 UserClientNew 或路径包含 /new），返回 null
  if (route.name === 'UserClientNew' || route.name === 'StandaloneUserClientNew' || route.path.includes('/new')) {
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
  // v2 独立标签页：预览（无 /edit）
  if (routeName === 'StandaloneUserClientView' || routeName === 'StandaloneAdminClientView') {
    return true
  }
  if (/^\/standalone\/user\/client\/\d+$/.test(path)) return true
  if (/^\/standalone\/client\/\d+$/.test(path)) return true
  return false
})

const activeTab = ref('general')
const saving = ref(false)
const pageLoading = ref(false)
const rmLoading = ref(false)
const introducerLoading = ref(false)
const progressDialogVisible = ref(false)
const workflowLoading = ref(false)
const progressData = ref<ClientProgressData | null>(null)
const tabLoading: Record<string, boolean> = reactive({
  kyc: false,
  risk: false,
  documents: false,
  fee: false
})
// 各 Tab 的最后保存时间文案（进入编辑页时从后端获取，保存成功后更新）
const tabLastSaved: Record<string, string> = reactive({
  general: '',
  kyc: '',
  risk: '',
  documents: '',
  fee: ''
})
const currentTabLastSaved = computed(() => tabLastSaved[activeTab.value] || '')
const currentClientType = computed(() => ((route.query.clientType as ClientType) || (clientForm.contactNature as ClientType) || 'Individual'))
const isReviewMode = computed(() => route.query.mode === 'review' && !isViewMode.value)
/** v1.0 遗留：预览/审批视图下可按模块批量下载已上传文件 */
const canBulkDownloadModule = computed(() => !!clientId.value && (isViewMode.value || isReviewMode.value))
const canReviewAction = computed(() => progressData.value?.availableActions?.includes('REVIEW') ?? false)
/** 预览视图：RM 等在 Pending Submission 时后端下发 SUBMIT */
const canSubmitAction = computed(() => progressData.value?.availableActions?.includes('SUBMIT') ?? false)
/** Pending Submission 预览稿：Progress 为浅灰次要按钮 */
const headerProgressMuted = computed(
  () =>
    isViewMode.value &&
    !!clientId.value &&
    isPendingSubmissionStatus(progressData.value?.progressStatus, progressData.value?.inactive)
)
const canShowEditButton = computed(() => {
  if (!clientId.value || !isViewMode.value) return false
  if (isAdminRole(authStore.user?.role)) return true
  if (canReviewAction.value) return true
  return isClientEditable(progressData.value?.progressStatus, progressData.value?.inactive)
})

/** 顶栏标题：个人为客户姓名，机构为公司名 */
const headerClientName = computed(() => {
  const g = clientForm.general as { contactNature?: string; companyName?: string; firstName?: string; lastName?: string }
  if (g.contactNature === 'Corporate') {
    const n = (g.companyName || '').trim()
    return n || 'Client'
  }
  const fn = (g.firstName || '').trim()
  const ln = (g.lastName || '').trim()
  const parts = [fn, ln].filter(Boolean)
  return parts.length ? parts.join(' ') : 'Client'
})

/** 顶栏括号内：当前流程状态节点 */
const headerWorkflowStatusText = computed(() => {
  const p = progressData.value
  if (!p) return ''
  return (p.progressLabel || getProgressLabel(p.progressStatus, p.inactive) || '').trim()
})

/** 非 Comments 标签时记录当前模块，便于 Comments 面板默认模块与「从模块发评论」一致 */
const lastMainTab = ref('general')
watch(
  () => activeTab.value,
  v => {
    if (v !== 'comments') lastMainTab.value = v
  },
  { immediate: true }
)

const commentsContextModule = computed(() =>
  mapTabToCommentModule(activeTab.value === 'comments' ? lastMainTab.value : activeTab.value)
)

/** 文档：预览/审批视图下各模块可有 Add comment；编辑视图仅能通过 Comments 标签内添加 */
const showModuleCommentEntry = computed(() => !!clientId.value && (isViewMode.value || isReviewMode.value))

const commentsPanelRef = ref<{ openAddComment: (opts?: Record<string, unknown>) => void } | null>(null)
const commentsSidebarRef = ref<InstanceType<typeof ClientCommentsSidebar> | null>(null)

/** 含回复的总条数，用于是否显示右侧评论栏（与侧栏内计数一致） */
const commentTotalCount = ref(0)
const commentsRailCollapsed = ref(false)

const MAIN_TABS_WITH_COMMENTS_RAIL = ['general', 'kyc', 'risk', 'documents', 'fee'] as const

function countCommentTree(list: ClientComment[]): number {
  let n = 0
  for (const c of list) {
    n += 1
    if (c.replies?.length) n += c.replies.length
  }
  return n
}

const commentsSideRailVisible = computed(() => {
  if (!clientId.value || commentTotalCount.value < 1) return false
  return (MAIN_TABS_WITH_COMMENTS_RAIL as readonly string[]).includes(activeTab.value)
})

const loadCommentCount = async () => {
  if (!clientId.value) {
    commentTotalCount.value = 0
    return
  }
  try {
    const response = await workflowApi.getComments(clientId.value, currentClientType.value)
    const raw = (response as { data?: ClientComment[] }).data
    const list = Array.isArray(raw) ? raw : []
    commentTotalCount.value = countCommentTree(list)
  } catch {
    commentTotalCount.value = 0
  }
}

const setCommentTotalCount = (n: number) => {
  commentTotalCount.value = n
}

const handleCommentsChanged = () => {
  void loadCommentCount()
  commentsSidebarRef.value?.reload()
}

const goToCommentsTab = () => {
  activeTab.value = 'comments'
}

const openCommentFromModule = (module: WorkflowModule, presetTitle: string) => {
  activeTab.value = 'comments'
  nextTick(() => {
    commentsPanelRef.value?.openAddComment({ moduleName: module, presetTitle })
  })
}

watch(clientId, id => {
  if (!id && activeTab.value === 'comments') {
    activeTab.value = 'general'
  }
  if (!id) {
    commentTotalCount.value = 0
  }
})

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

// 表单数据（secondaryContact 在表单中始终存在，便于模板绑定）
const clientForm = reactive<Omit<CreateClientParams, 'secondaryContact'> & { secondaryContact: ContactInfo; portfolios: Portfolio[] }>({
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
  },
  secondaryContact: {
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
  },
  portfolios: []
})

const emptyContact = (): ContactInfo => ({
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
  kycDate: '',
  kycStatus: '',
  nextReviewDate: '',
  documents: [],
  nameScreeningDocuments: []
})

// Documents 数据
const documentsData = reactive<DocumentsData>({
  identity: [],
  address: [],
  forms: [],
  statements: [],
  others: []
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
const kycUploadDocumentType = ref<'SUPPORTING_DOCUMENT' | 'NAME_SCREENING'>('SUPPORTING_DOCUMENT')
const documentUploadTitle = computed(() => {
  if (documentUploadType.value === 'kyc') {
    return kycUploadDocumentType.value === 'NAME_SCREENING' ? 'Upload Name Screening Documents' : 'Upload Supporting Documents'
  }
  const titles: Record<DocumentType, string> = {
    identity: 'Upload Identity Proof',
    address: 'Upload Address Proof',
    forms: 'Upload Forms',
    statements: 'Upload XinXi Statements',
    others: 'Upload Others Documents'
  }
  return titles[documentUploadType.value]
})
const uploadRef = ref()
const fileList = ref<UploadFile[]>([])
const uploading = ref(false)

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

  pageLoading.value = true
  try {
    // 从路由查询参数中获取 clientType，确保后端能正确识别客户类型
    const clientTypeFromQuery = route.query.clientType as 'Individual' | 'Corporate' | undefined
    const response = await userClientApi.getClientById(clientId.value, clientTypeFromQuery)
    const data = response.data || response

    // 填充表单数据
    // 优先使用后端返回的 contactNature，如果没有则使用 general.contactNature，最后才默认 Individual
    const backendContactNature = data.contactNature || data.contact_nature
    const generalContactNature = data.general?.contactNature
    // 确保 contactNature 正确设置，优先使用后端返回的值
    const finalContactNature = backendContactNature || generalContactNature || 'Individual'
    clientForm.contactNature = finalContactNature
    
    // 处理 General 信息
    if (data.general) {
      const general = data.general
      // 确保general对象有contactNature，优先使用外层的 contactNature（更可靠）
      if (!general.contactNature || general.contactNature !== finalContactNature) {
        general.contactNature = finalContactNature
      }
      // 确保general对象有contactType
      if (!general.contactType) {
        general.contactType = 'Client'
      }
      // 确保 introducerId 为 0 时转换为 undefined（空值）
      if (general.introducerId === 0 || general.introducerId === '0') {
        general.introducerId = undefined
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
          arm: '',
          introducerId: undefined
        } as IndividualGeneralInfo
      } else {
        clientForm.general = {
          contactType: 'Client',
          contactNature: 'Corporate',
          companyName: '',
          rm: '',
          arm: '',
          introducerId: undefined
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
    clientForm.contact = data.contact ? { ...emptyContact(), ...data.contact } : emptyContact()
    // 处理 Secondary Contact 信息（全部非必填）
    clientForm.secondaryContact = data.secondaryContact ? { ...emptyContact(), ...data.secondaryContact } : emptyContact()
    
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
      rmLoading.value = true
      try {
        await loadAccounts()
        const account = accountList.value.find(a => a.userId === clientForm.general.rmUserId)
        if (account) {
          clientForm.general.rm = account.name || account.account || ''
        }
      } catch (error) {
        console.warn('Failed to load RM name:', error)
      } finally {
        rmLoading.value = false
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
      introducerLoading.value = true
      try {
        await loadIntroducers()
        const introducer = introducerList.value.find(i => i.id === (clientForm.general as any).introducerId)
        if (introducer) {
          (clientForm.general as any).introducer = introducer.introducer || ''
        }
      } catch (error) {
        console.warn('Failed to load Introducer name:', error)
      } finally {
        introducerLoading.value = false
      }
    }

    // 加载 KYC 数据
    tabLoading.kyc = true
    try {
      const kyc = await kycApi.getKYC(clientId.value, clientForm.contactNature as any)
      kycData.kycDate = kyc.kycDate ?? ''
      kycData.kycStatus = kyc.kycStatus ?? ''
      kycData.nextReviewDate = kyc.nextReviewDate ?? ''
      kycData.documents = kyc.documents || []
      kycData.nameScreeningDocuments = kyc.nameScreeningDocuments || []

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
    } finally {
      tabLoading.kyc = false
    }

    // 加载 Documents 数据
    tabLoading.documents = true
    try {
      const documents = await documentsApi.getDocuments(clientId.value, clientForm.contactNature as any)
      documentsData.identity = documents.identity || []
      documentsData.address = documents.address || []
      documentsData.forms = documents.forms || []
      documentsData.statements = documents.statements || []
      documentsData.others = documents.others || []

      // Documents Tab 的 Last saved：取所有文档中最新的上传时间
      const allDocs = [
        ...documentsData.identity,
        ...documentsData.address,
        ...documentsData.forms,
        ...documentsData.statements,
        ...documentsData.others
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
    } finally {
      tabLoading.documents = false
    }

    // 加载 Investment Risk Profile 数据
    tabLoading.risk = true
    try {
      const risk = await riskProfileApi.getRiskProfile(clientId.value, clientForm.contactNature as any)
      // 合并到已有 reactive 嵌套对象，避免浅拷贝导致脆弱客户等子对象未更新或丢失响应式
      riskProfileData.investmentRiskRating = risk.investmentRiskRating
      riskProfileData.remarks = risk.remarks ?? ''
      riskProfileData.hongKongPI = risk.hongKongPI === true
      if (risk.vulnerableClientAssessment) {
        Object.assign(riskProfileData.vulnerableClientAssessment, risk.vulnerableClientAssessment)
      }
      const srcTypes = risk.investmentKnowledgeExperience?.types || []
      srcTypes.forEach(st => {
        const t = riskProfileData.investmentKnowledgeExperience.types.find(x => x.type === st.type)
        if (t) {
          t.knowledge = st.knowledge === true
          t.experience = st.experience === true
        }
      })
      ;(riskProfileData as any).__hasExisting = (risk as any).__hasExisting === true
      ;(riskProfileData as any).__lastUpdatedAt = (risk as any).__lastUpdatedAt ?? null

      // Risk Tab 的 Last saved：用后端 riskProfile 的 updatedAt/createdAt
      const riskLast = (risk as any).__lastUpdatedAt
      if (riskLast) {
        tabLastSaved.risk = `Last saved: ${formatDateTime(riskLast)}`
      }
    } catch (error) {
      console.warn('Failed to load risk profile:', error)
    } finally {
      tabLoading.risk = false
    }

    // 加载 Fee Schedule 数据
    tabLoading.fee = true
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
    } finally {
      tabLoading.fee = false
    }

    // 在 View 模式下，清除所有表单验证错误
    if (isViewMode.value) {
      nextTick(() => {
        clientFormRef.value?.clearValidate()
        portfolioFormRef.value?.clearValidate()
      })
    }

    await loadCommentCount()
    await loadProgress()
  } catch (error: any) {
    console.error('Failed to load client:', error)
    // 登录态失效（401）时，全局拦截器已经提示并跳转，这里不再额外提示
    if (!(error as any)?.isAuthError && (error as any)?.response?.status !== 401) {
      ElMessage.error('Failed to load client details')
    }
  } finally {
    // 添加最小延迟，避免闪烁
    await new Promise(resolve => setTimeout(resolve, 300))
    pageLoading.value = false
  }
}

const loadProgress = async () => {
  if (!clientId.value) {
    progressData.value = null
    return
  }

  try {
    const response = await workflowApi.getProgress(clientId.value, currentClientType.value)
    progressData.value = response.data || response
  } catch (error) {
    console.warn('Failed to load workflow progress:', error)
    progressData.value = null
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
        .filter((item: any) => !isAdminRole(item.role))
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
  const listPath = getClientListPath(route.path)
  if (isStandaloneClientRoute(route.path)) {
    window.close()
    void router.push(listPath)
    return
  }
  router.push(listPath)
}

const openProgressDialog = () => {
  if (!clientId.value) {
    ElMessage.warning('Please save the client first')
    return
  }
  progressDialogVisible.value = true
}

// 处理 Edit 按钮点击，跳转到编辑页面（仅普通用户）
const handleEdit = () => {
  if (!clientId.value) return
  const clientType = route.query.clientType || clientForm.contactNature || 'Individual'
  const base = getClientBasePath(route.path)
  router.push({ path: `${base}/${clientId.value}/edit`, query: { clientType } })
}

const enterReviewMode = () => {
  if (!clientId.value) return
  const basePath = getClientBasePath(route.path)
  router.push({
    path: `${basePath}/${clientId.value}/edit`,
    query: {
      clientType: currentClientType.value,
      mode: 'review'
    }
  })
}

const handleContactNatureChange = () => {
  // 根据 general.contactNature 同步外层 contactNature，确保后端能正确区分 Individual / Corporate
  clientForm.contactNature = clientForm.general.contactNature as 'Individual' | 'Corporate'

  // 切换 Contact Nature 时重置 General 信息
  if (clientForm.general.contactNature === 'Individual') {
    const prev = clientForm.general as any
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Individual',
      firstName: '',
      lastName: '',
      rm: prev.rm || '',
      rmUserId: prev.rmUserId, // 保留已选择的 RM ID
      arm: prev.arm || '',
      armUserId: prev.armUserId, // 保留已选择的 ARM ID
      introducerId: undefined
    } as IndividualGeneralInfo
  } else {
    const prev = clientForm.general as any
    clientForm.general = {
      contactType: 'Client',
      contactNature: 'Corporate',
      companyName: '',
      rm: prev.rm || '',
      rmUserId: prev.rmUserId, // 保留已选择的 RM ID
      arm: prev.arm || '',
      armUserId: prev.armUserId, // 保留已选择的 ARM ID
      introducerId: undefined
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
            await kycApi.updateKYC(currentClientId, clientForm.contactNature as 'Individual' | 'Corporate', kycData)
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
            await router.push(getClientListPath(route.path))
          }
        } else {
          // 创建新 Client
          let response
          const contactNature = clientForm.contactNature || (clientForm.general as any).contactNature

          if ((clientForm.general as any).contactNature !== contactNature) {
            clientForm.general = {
              ...(clientForm.general as any),
              contactNature
            } as IndividualGeneralInfo | CorporateGeneralInfo
          }

          const normalizedGeneral = {
            ...(clientForm.general as any),
            contactType: (clientForm.general as any).contactType || 'Client',
            contactNature,
            armUserId: (clientForm.general as any).armUserId || undefined,
            introducerId: (clientForm.general as any).introducerId || undefined
          }

          const payload: CreateClientParams = {
            contactNature,
            general: normalizedGeneral,
            contact: { ...clientForm.contact },
            secondaryContact: { ...clientForm.secondaryContact }
          }

          response = await userClientApi.createClient(payload)

          const responseData = response.data || response
          // 尝试多种可能的字段名获取 ID（兼容 Individual 和 Corporate 创建接口）
          const newId = responseData.id ||
                       responseData.clientId ||
                       responseData.corporateId ||
                       responseData.data?.id ||
                       responseData.data?.clientId ||
                       responseData.data?.corporateId ||
                       (typeof responseData === 'number' ? responseData : null)
          
          if (!newId) {
            console.error('Response data:', responseData)
            throw new Error('Failed to get client ID from response')
          }
          
          currentClientId = newId
          
          // 如果返回的数据包含完整的客户信息，直接使用返回的数据更新表单
          // 这样可以确保 contactNature 等字段正确设置
          if (responseData.contactNature || responseData.general) {
            const data = responseData
            // 优先使用后端返回的 contactNature
            const backendContactNature = data.contactNature || data.contact_nature
            const generalContactNature = data.general?.contactNature
            clientForm.contactNature = backendContactNature || generalContactNature || clientForm.contactNature || 'Individual'
            
            // 更新 general 信息
            if (data.general) {
              const general = data.general
              if (!general.contactNature || general.contactNature !== clientForm.contactNature) {
                general.contactNature = clientForm.contactNature
              }
              // 合并返回的 general 数据到表单
              Object.assign(clientForm.general, general)
            }
          }
          
          ElMessage.success('Client created successfully')
          
          // 如果有未保存的 Portfolio，现在保存它们
          const unsavedPortfolios = clientForm.portfolios.filter(p => !p.id)
          if (unsavedPortfolios.length > 0 && currentClientId) {
            for (const portfolio of unsavedPortfolios) {
              try {
                const portfolioResponse = await portfolioApi.createPortfolio({
                  clientId: currentClientId,
                  clientType: clientForm.contactNature,
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
            await kycApi.updateKYC(currentClientId, clientForm.contactNature as 'Individual' | 'Corporate', kycData)
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
            const base = getClientBasePath(route.path)
            const listPath = getClientListPath(route.path)
            if (closeAfter) {
              await router.push(listPath)
            } else {
              if (isAdminClientRoute(route.path)) {
                await router.push(`${base}/${currentClientId}`)
              } else {
                await router.push(`${base}/${currentClientId}/edit`)
              }
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

const buildWorkflowClientDetailPayload = () => ({
  contactNature: currentClientType.value,
  general: { ...(clientForm.general as any) },
  contact: { ...clientForm.contact },
  secondaryContact: { ...clientForm.secondaryContact },
  portfolios: clientForm.portfolios.map(item => ({ ...item }))
})

const validateClientForm = async () => {
  if (!clientFormRef.value) return true
  try {
    await clientFormRef.value.validate()
    return true
  } catch {
    return false
  }
}

const handleReviewDecision = async (approve: boolean) => {
  if (!clientId.value) return
  if (approve) {
    const valid = await validateClientForm()
    if (!valid) {
      ElMessage.warning('Please complete the required fields before approval')
      return
    }
  }

  workflowLoading.value = true
  try {
    const response = approve
      ? await workflowApi.approve(clientId.value, currentClientType.value, { clientDetail: buildWorkflowClientDetailPayload() })
      : await workflowApi.reject(clientId.value, currentClientType.value, { clientDetail: buildWorkflowClientDetailPayload() })

    progressData.value = response.data || response
    ElMessage.success(approve ? 'Review approved successfully' : 'Review rejected successfully')

    const basePath = getClientBasePath(route.path)
    await router.push({
      path: `${basePath}/${clientId.value}`,
      query: { clientType: currentClientType.value }
    })
  } catch (error: any) {
    ElMessage.error(error.message || error.response?.data?.message || 'Review action failed')
  } finally {
    workflowLoading.value = false
  }
}

const handleProgressUpdated = (progress: ClientProgressData) => {
  progressData.value = progress
}

/** 预览顶栏 Submit（Pending Submission + 后端 availableActions 含 SUBMIT） */
const handleHeaderSubmit = async () => {
  if (!clientId.value) return
  workflowLoading.value = true
  try {
    await workflowApi.submit(clientId.value, currentClientType.value)
    await loadProgress()
    ElMessage.success('Submitted successfully')
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || err.message || 'Submit failed')
  } finally {
    workflowLoading.value = false
  }
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

const handleEditPortfolio = async (portfolio: Portfolio, index: number) => {
  editingPortfolioIndex.value = index
  portfolioForm.clientId = clientId.value || 0

  // 每次编辑前先重置，避免上一次残留状态干扰
  portfolioForm.bank = ''
  portfolioForm.bookingCentre = ''
  portfolioForm.portfolioNo = ''

  // 确保 Bank 列表已加载，availableBookingCentres 中有对应选项
  if (bankList.value.length === 0) {
    await loadBanks()
  }

  // 先设置 Bank，让 availableBookingCentres 计算出对应的 Booking Centres
  portfolioForm.bank = portfolio.bank
  await nextTick()

  // 再设置 Booking Centre，确保在选项列表中能够正确匹配显示
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

// KYC 文档处理（type: Supporting 或 Name Screening）
const handleUploadKYCDocument = (type: 'SUPPORTING_DOCUMENT' | 'NAME_SCREENING' = 'SUPPORTING_DOCUMENT') => {
  if (!clientId.value) {
    ElMessage.warning('Please save the client first')
    return
  }
  documentUploadType.value = 'kyc'
  kycUploadDocumentType.value = type
  fileList.value = []
  documentUploadDialogVisible.value = true
}

const handleOpenKYCDocument = async (document: KYCDocument) => {
  if (!clientId.value) {
    ElMessage.warning('Client ID is missing')
    return
  }
  if (!document.id) {
    ElMessage.warning('Document ID is missing. Please refresh the page and try again.')
    return
  }
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

const handleDeleteKYCDocument = async (document: KYCDocument, listKey: 'documents' | 'nameScreeningDocuments' = 'documents') => {
  if (!clientId.value) {
    ElMessage.warning('Client ID is missing')
    return
  }
  if (!document.id) {
    ElMessage.warning('Document ID is missing. Please refresh the page and try again.')
    return
  }
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
    const list = kycData[listKey]
    const index = list.findIndex((d: KYCDocument) => d.id === document.id)
    if (index > -1) {
      list.splice(index, 1)
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
  documentUploadDialogVisible.value = true
}

const handleOpenDocument = async (document: Document) => {
  if (!clientId.value) {
    ElMessage.warning('Client ID is missing')
    return
  }
  if (!document.id) {
    ElMessage.warning('Document ID is missing. Please refresh the page and try again.')
    return
  }
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

const safeFileBaseName = (name: string, fallback: string) => {
  const n = String(name || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()
  return n || fallback
}

const bulkDownloadDocumentList = async (list: Document[]) => {
  if (!clientId.value || !list.length) return
  let ok = 0
  for (let i = 0; i < list.length; i++) {
    const doc = list[i]
    if (!doc.id) continue
    try {
      const response = await documentsApi.getDocument(clientId.value, doc.id)
      const blobData = (response as any).data || response
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = safeFileBaseName(doc.document, `document-${i + 1}.pdf`)
      a.click()
      URL.revokeObjectURL(url)
      ok++
      await new Promise<void>(r => setTimeout(r, 400))
    } catch (error) {
      console.error(error)
      ElMessage.error(`Failed to download ${doc.document || 'file'}`)
    }
  }
  if (ok) ElMessage.success(`Downloaded ${ok} file(s)`)
}

const bulkDownloadKycList = async (list: KYCDocument[]) => {
  if (!clientId.value || !list.length) return
  let ok = 0
  for (let i = 0; i < list.length; i++) {
    const doc = list[i]
    if (!doc.id) continue
    try {
      const response = await kycApi.getKYCDocument(clientId.value, doc.id)
      const blobData = (response as any).data || response
      const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = safeFileBaseName(doc.document, `document-${i + 1}.pdf`)
      a.click()
      URL.revokeObjectURL(url)
      ok++
      await new Promise<void>(r => setTimeout(r, 400))
    } catch (error) {
      console.error(error)
      ElMessage.error(`Failed to download ${doc.document || 'file'}`)
    }
  }
  if (ok) ElMessage.success(`Downloaded ${ok} file(s)`)
}

const handleDeleteDocument = async (document: Document) => {
  if (!clientId.value) {
    ElMessage.warning('Client ID is missing')
    return
  }
  if (!document.id) {
    ElMessage.warning('Document ID is missing. Please refresh the page and try again.')
    return
  }
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

const validateUploadFile = (file: File): string | null => {
  const name = file.name.toLowerCase()
  const extOk =
    name.endsWith('.pdf') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png')
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

/** Resolve File objects from Element Plus upload list (v-model:file-list keeps `raw` in sync). */
const collectUploadFiles = (): File[] => {
  const list = fileList.value
  const fromRaw = list.map(f => f.raw).filter((f): f is File => f instanceof File)
  if (fromRaw.length) return fromRaw
  return list
    .map(f => (f as UploadFile & { file?: File }).file)
    .filter((f): f is File => f instanceof File)
}

const handleSubmitDocumentUpload = async () => {
  const files = collectUploadFiles()
  if (!files.length || !clientId.value) {
    ElMessage.warning('Please select at least one file')
    return
  }

  uploading.value = true
  try {
    if (documentUploadType.value === 'kyc') {
      const docType = kycUploadDocumentType.value
      const targetList = docType === 'NAME_SCREENING' ? kycData.nameScreeningDocuments : kycData.documents

      const appendKycDocs = (saved: any[]) => {
        saved.forEach((data: any, i: number) => {
          const file = files[i]
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
        const response = await kycApi.uploadKYCDocument(
          clientId.value,
          clientForm.contactNature as any,
          files[0],
          docType
        )
        const raw = (response as any).data ?? response
        const saved = Array.isArray(raw) ? raw : [raw]
        appendKycDocs(saved)
      } else {
        const response = await kycApi.uploadKYCDocumentsBatch(
          clientId.value,
          clientForm.contactNature as any,
          files,
          docType
        )
        const saved = (response as any).data
        if (!Array.isArray(saved)) {
          ElMessage.error('Unexpected server response for batch upload')
          return
        }
        appendKycDocs(saved)
      }
      ElMessage.success(
        files.length > 1 ? `${files.length} documents uploaded successfully` : 'Document uploaded successfully'
      )
    } else {
      const docTypeKey = documentUploadType.value as DocumentType
      const targetList = documentsData[docTypeKey]

      const appendDocs = (saved: any[]) => {
        saved.forEach((data: any, i: number) => {
          const file = files[i]
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
        const response = await documentsApi.uploadDocument(
          clientId.value,
          clientForm.contactNature as any,
          docTypeKey,
          files[0]
        )
        const raw = (response as any).data ?? response
        const saved = Array.isArray(raw) ? raw : [raw]
        appendDocs(saved)
      } else {
        const response = await documentsApi.uploadDocumentsBatch(
          clientId.value,
          clientForm.contactNature as any,
          docTypeKey,
          files
        )
        const saved = (response as any).data
        if (!Array.isArray(saved)) {
          ElMessage.error('Unexpected server response for batch upload')
          return
        }
        appendDocs(saved)
      }
      ElMessage.success(
        files.length > 1 ? `${files.length} documents uploaded successfully` : 'Document uploaded successfully'
      )
    }
    documentUploadDialogVisible.value = false
    fileList.value = []
  } catch (error: any) {
    console.error('Failed to upload document:', error)
    const errorMessage = error.message || error.response?.data?.message || 'Failed to upload document'
    ElMessage.error(errorMessage)
  } finally {
    uploading.value = false
  }
}

// 格式化显示值（用于view模式）
const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

// 获取Introducer名称（用于view模式显示）
const getIntroducerName = (introducerId: number | null | undefined): string => {
  if (!introducerId) return '-'
  const introducer = visibleIntroducers.value.find(i => i.id === introducerId)
  return introducer?.introducer || '-'
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

watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath === oldPath) return
    if (clientId.value) {
      await loadClient()
    } else {
      progressData.value = null
    }
  }
)

onMounted(async () => {
  try {
    // 管理员不能新建客户，若访问新建页则重定向到 admin 客户列表
    if (
      isAdminRole(authStore.user?.role) &&
      (route.path === '/user/client/new' || route.path === '/standalone/user/client/new')
    ) {
      router.replace('/client')
      return
    }
    // 新建模式下，完全不加载任何数据，页面立即渲染
    // 编辑模式下，只加载必要的 client 数据
    if (isEditMode.value) {
      await loadClient()
    } else {
      progressData.value = null
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
  min-height: 100%;
  background-color: var(--crm-surface-page);
  display: flex;
  flex-direction: column;

  /* 顶栏：左标题 + 右操作 */
  .top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 14px 24px 12px;
    background-color: var(--crm-surface-page);
    border-bottom: none;

    .top-header__leading {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }

    .top-header__back {
      flex-shrink: 0;
    }

    .top-header__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--crm-text-primary, #0f172a);
      line-height: 1.35;
      word-break: break-word;
    }

    .top-header__status {
      font-weight: 500;
      color: var(--crm-text-secondary, #475569);
    }

    .top-header__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    .last-saved {
      color: #909399;
      font-size: 13px;
      margin-left: 4px;
    }

    /* Pending Submission 预览：Progress 浅灰底深字，与主色 Submit/Edit 区分 */
    .top-header__btn-progress--muted {
      background-color: #eceff1;
      border-color: #dcdfe6;
      color: #606266;

      &:hover {
        background-color: #e4e7ed;
        border-color: #c0c4cc;
        color: #303133;
      }
    }
  }

  /* General / Risk 等：标题行 + 模块内 Add comment */
  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;

    .section-title {
      margin-bottom: 0;
    }
  }

  .fee-tab-comment-bar {
    margin-bottom: 8px;
  }

  /* 主内容 + 可选右侧评论栏
   * 勿对 shell 使用 flex:1 + min-height:0，否则在 UserLayout 的定高 main 内会把中间区锁在视口高度内，
   * 长表单无法撑开页面，外层 .main-content 也无法滚动。由内容自然撑高，整页滚动交给 layout。 */
  .client-tabs-shell {
    flex: 0 1 auto;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    margin: 4px 24px 12px;
    gap: 0;
  }

  .client-tabs-shell__main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .client-tabs-shell__rail {
    flex-shrink: 0;
    width: 300px;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    background-color: #fff;
    border-radius: var(--crm-radius-md);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    margin-left: 10px;
    overflow: hidden;

    &.is-narrow {
      width: 44px;
    }
  }

  /* 顶部 Tab 与内容区域：无内边距（不 flex:1 撑满视口，避免长页被裁切无法滚动） */
  .client-tabs {
    flex: 0 1 auto;
    width: 100%;
    background-color: var(--crm-surface-page);
    border-radius: var(--crm-radius-md);
    padding: 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

    :deep(.el-tabs__header) {
      margin-bottom: 0 !important;
      background-color: #fff;
      padding: 12px 16px 14px;
      border-radius: 6px 6px 0 0;
      border: none;
      border-bottom: none !important;
      box-shadow: none;
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none !important;
      }
    }

    /* Element Plus 默认 el-tabs__content 为 overflow:hidden + flex-grow:1，在定高 flex 链下会裁切表单；
     * 改为随内容增高，由外层 layout 的 main 区域滚动。 */
    :deep(.el-tabs__content) {
      flex-grow: 0;
      overflow: visible !important;
      padding-top: 12px;
      background-color: var(--crm-surface-page);
      border: none;
      border-top: none !important;
    }

    :deep(.el-tabs__item) {
      font-size: 15px;
      padding: 0 18px;
    }
  }

  /* 与 tab 标头同宽；上下间距收紧，小模块自适应 */
  .tab-content {
    min-height: 280px;
    overflow: visible !important;
    position: relative;
    background-color: var(--crm-surface-page);
    padding: 12px 0;
    border-radius: 0 0 4px 4px;
  }

  // Loading 图标旋转动画
  .is-loading {
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* 与 KYC 统一：白底卡片、无边框、紧凑间距 */
  .client-form {
    .form-section {
      margin-top: 0;
      margin-bottom: 16px;
      padding: 16px 20px;
      background-color: #fff;
      border: none;
      border-radius: 4px;
      box-sizing: border-box;

      &:first-child {
        margin-top: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;
        padding: 0;
      }

      .section-header .section-title {
        margin-bottom: 0;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
        align-items: start;

        &:last-child {
          margin-bottom: 0;
        }

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
            pointer-events: none;
            cursor: default;
          }
        }
      }

      // View 模式文本样式
      .view-mode-text {
        display: block;
        color: #303133;
        font-size: 14px;
        line-height: 32px;
        min-height: 32px;
      }

      // Client Id 未保存时的占位文案样式（浅灰、略淡）
      .client-id-placeholder {
        color: #909399;
        font-style: italic;
      }

      .nationality-prefix-icon {
        color: #909399;
        font-size: 14px;
        margin-right: 4px;
      }

      .form-row-single {
        grid-template-columns: 1fr 1fr;
        
        .el-form-item:first-child {
          grid-column: 1;
          max-width: 100%;
        }
      }

      &.portfolio-section {
        margin-bottom: 16px;
        .portfolio-table {
          margin-left: 0;
          width: 100%;
        }
      }

      // Portfolio 表格样式，参照示例图
      .portfolio-table {
        margin-top: 8px;

        :deep(.el-table__header-wrapper) {
          background-color: #f5f7fa;

          th {
            background-color: #f5f7fa !important;
            color: #606266;
            font-weight: 600;
            text-align: left;
            border-bottom: 1px solid #ebeef5;
          }
        }

        :deep(.el-table__body-wrapper) {
          td {
            border-bottom: 1px solid #ebeef5;
            color: #303133;
          }
        }

        // 去掉 hover / 选中高亮效果
        :deep(.el-table__body tr:hover > td),
        :deep(.el-table__body tr.current-row > td) {
          background-color: #ffffff !important;
        }
      }
    }

    .empty-portfolio {
      text-align: center;
      padding: 24px;
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

// KYC Information 卡片（小模块白底，与 tab 标头左右对齐）
.kyc-information-card {
  margin-bottom: 16px;
  padding: 16px 20px;
  background-color: #fff;
  border: none;
  border-radius: 4px;
  box-sizing: border-box;
  min-width: 0;
}

.kyc-information-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding: 0;
}

.kyc-information-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
    min-width: 0;
    align-items: flex-start; /* view 下多行 label 时 value 与首行顶部对齐 */
  }
  :deep(.el-form-item__label) {
    color: #606266;
    line-height: 1.4;
    white-space: normal;
    word-break: break-word;
    height: auto;
    padding-right: 12px;
    width: 200px !important; /* 固定 label 宽度，保证所有 value 起始位置一致 */
    flex-shrink: 0;
  }
  :deep(.el-form-item__content) {
    line-height: 32px;
    min-width: 0;
    flex: 1;
  }
  .view-mode-text {
    display: block;
    min-height: 32px;
    line-height: 32px;
    color: #303133;
    font-size: 14px;
    vertical-align: top;
  }
}

.kyc-info-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.kyc-info-row {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(180px, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 20px;
  min-width: 0;

  &:last-child {
    margin-bottom: 0;
  }

  .el-form-item {
    margin-bottom: 0;
    min-width: 0;
  }
}

.kyc-info-input {
  width: 100%;
  :deep(.el-input__wrapper) {
    min-height: 32px;
    background-color: #f5f7fa;
  }
}
.kyc-information-form .el-date-editor.kyc-info-input {
  width: 100%;
}

// KYC Section（Upload Supporting / Name Screening：小模块白底，与 tab 标头左右对齐）
.kyc-section {
  .kyc-upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding: 12px 16px;
    background-color: #fff;
    border: none;
    border-radius: 4px;
  }

  .kyc-upload-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .kyc-upload-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

// Document Section（与 KYC Upload 统一：白底标题条 + 紧凑间距）
.document-section {
  margin-bottom: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding: 12px 16px;
    background-color: #fff;
    border: none;
    border-radius: 4px;
  }

  .section-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    padding: 0;
  }
}

// Risk Profile Form（与 KYC 统一：白底卡片、无边框、紧凑间距）
.risk-profile-form {
  position: relative;

  .form-section {
    margin-bottom: 16px;
    padding: 16px 20px;
    background-color: #fff;
    border: none;
    border-radius: 4px;
    box-sizing: border-box;

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 16px 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      pointer-events: none;
      cursor: default;
    }

    .vulnerable-assessment-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }

    .vulnerable-questions {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      gap: 16px;
      
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

// Fee Schedule Form（与 KYC 统一：白底卡片、无边框、紧凑间距）
.fee-schedule-form {
  .form-section {
    margin-bottom: 16px;
    padding: 16px 20px;
    background-color: #fff;
    border: none;
    border-radius: 4px;
    box-sizing: border-box;

    :deep(.el-form-item__label) {
      pointer-events: none;
      cursor: default;
    }
  }

  .vulnerable-assessment-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
  }

  .vulnerable-questions {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    gap: 16px;

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
    margin-bottom: 8px;

    em {
      color: #025189;
      font-style: normal;
    }
  }

  .el-upload__tip {
    color: #909399;
    font-size: 12px;
    text-align: center;
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
