<template>
  <el-form
    ref="formRef"
    :model="fullForm"
    :rules="formRules"
    label-width="240px"
    class="introducer-form introducer-general-form"
    :disabled="isViewMode"
  >
    <!-- Basic -->
    <div class="form-section">
      <h3 class="section-title">Basic</h3>

      <template v-if="fullForm.contactNature === 'Individual'">
        <div class="form-row">
          <el-form-item label="Contact Type">
            <template v-if="isViewMode">
              <span class="view-mode-text">Introducer</span>
            </template>
            <template v-else>
              <el-input model-value="Introducer" disabled class="crm-input-grey" style="width: 100%" />
            </template>
          </el-form-item>
          <el-form-item label="RM" prop="general.rm" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.rm) }}</span>
            </template>
            <template v-else>
              <el-input
                v-model="fullForm.general.rm"
                placeholder="Please select RM"
                readonly
                :disabled="isViewMode"
                class="crm-input-grey"
                style="cursor: pointer"
                @click="emit('open-rm')"
              >
                <template #suffix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Contact Nature" prop="contactNature">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.contactNature) }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.contactNature"
                placeholder="Please select"
                style="width: 100%"
                :disabled="isViewMode || lockContactNature"
                @change="emit('change-nature')"
              >
                <el-option label="Individual" value="Individual" />
                <el-option label="Corporate" value="Corporate" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="ARM">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.arm) }}</span>
            </template>
            <template v-else>
              <el-input
                v-model="fullForm.general.arm"
                placeholder="Please select ARM"
                readonly
                :disabled="isViewMode"
                style="cursor: pointer"
                @click="emit('open-arm')"
              >
                <template #suffix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Introducer Id">
            <template v-if="introducerNumericId">
              <span class="view-mode-text">{{ formatIntroducerDisplayId(fullForm.contactNature, introducerNumericId) }}</span>
            </template>
            <template v-else>
              <span class="id-placeholder">This field will be auto-generated after saving</span>
            </template>
          </el-form-item>
          <el-form-item label="Introducer">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ linkedIntroducerLabel }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.general.linkedIntroducerId"
                placeholder="Please select"
                style="width: 100%"
                filterable
                clearable
                :loading="introducerSelectLoading"
                @focus="emit('load-introducers')"
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
        <div class="form-row">
          <el-form-item label="Client Relationship Status">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.clientRelationshipStatus) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.clientRelationshipStatus" placeholder="Please select" style="width: 100%">
                <el-option label="Prospecting" value="Prospecting" />
                <el-option label="On Boarding" value="On Boarding" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Gender">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.gender) }}</span>
            </template>
            <template v-else>
              <el-radio-group v-model="fullForm.general.gender">
                <el-radio label="Male">Male</el-radio>
                <el-radio label="Female">Female</el-radio>
              </el-radio-group>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Title" prop="general.title" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.title) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.title" placeholder="Please select" style="width: 100%" class="crm-input-grey">
                <el-option label="Mr." value="Mr." />
                <el-option label="Mrs." value="Mrs." />
                <el-option label="Miss" value="Miss" />
                <el-option label="Dr." value="Dr." />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Marital Status">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.maritalStatus) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.maritalStatus" placeholder="Please select" style="width: 100%">
                <el-option label="Single" value="Single" />
                <el-option label="Married" value="Married" />
                <el-option label="Divorced" value="Divorced" />
                <el-option label="Widowed" value="Widowed" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="First Name" prop="general.firstName" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.firstName) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.firstName" placeholder="Please enter first name" class="crm-input-grey" />
            </template>
          </el-form-item>
          <el-form-item label="Education Level">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.educationLevel) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.educationLevel" placeholder="Please select" style="width: 100%">
                <el-option label="High School" value="High School" />
                <el-option label="Bachelor" value="Bachelor" />
                <el-option label="Master" value="Master" />
                <el-option label="PhD" value="PhD" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Last Name" prop="general.lastName" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.lastName) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.lastName" placeholder="Please enter last name" class="crm-input-grey" />
            </template>
          </el-form-item>
          <el-form-item label="Birthday (dd/mm/yyyy)">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.birthday) }}</span>
            </template>
            <template v-else>
              <el-date-picker
                v-model="fullForm.general.birthday"
                type="date"
                placeholder="Select date"
                format="DD/MM/YYYY"
                value-format="DD/MM/YYYY"
                style="width: 100%"
                class="crm-input-grey"
                :prefix-icon="Calendar"
              />
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Chinese Name">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.chineseName) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.chineseName" placeholder="Please enter Chinese name" />
            </template>
          </el-form-item>
          <el-form-item label="Country/Region of Birth">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.countryOfBirth) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.countryOfBirth" placeholder="Please select" style="width: 100%" filterable>
                <el-option v-for="c in nationalityList" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id Type">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.idType) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.idType" placeholder="Please select" style="width: 100%">
                <el-option label="Passport" value="Passport" />
                <el-option label="ID Card" value="ID Card" />
                <el-option label="Driver License" value="Driver License" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Dual Citizenship">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.dualCitizenship) }}</span>
            </template>
            <template v-else>
              <el-switch v-model="fullForm.general.dualCitizenship" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.general.dualCitizenship ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id No.">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.idNo) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.idNo" placeholder="Please enter ID number" />
            </template>
          </el-form-item>
          <el-form-item label="Nationality">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.nationality) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.nationality" placeholder="Please select" style="width: 100%" filterable>
                <el-option v-for="c in nationalityList" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id Expiry (dd/mm/yyyy)">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.indIdExpiry) }}</span>
            </template>
            <template v-else>
              <el-date-picker
                v-model="fullForm.general.indIdExpiry"
                type="date"
                placeholder="Select date"
                format="DD/MM/YYYY"
                value-format="DD/MM/YYYY"
                style="width: 100%"
                class="crm-input-grey"
                :prefix-icon="Calendar"
              />
            </template>
          </el-form-item>
          <el-form-item v-if="fullForm.general.dualCitizenship" label="Secondary Nationality">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.secondaryNationality) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.secondaryNationality" placeholder="Please select" style="width: 100%" filterable clearable>
                <el-option v-for="c in nationalityList" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item v-else label=" " />
        </div>
      </template>

      <template v-else>
        <!-- Corporate Basic（与 Client Corporate 对齐） -->
        <div class="form-row">
          <el-form-item label="Contact Type">
            <template v-if="isViewMode">
              <span class="view-mode-text">Introducer</span>
            </template>
            <template v-else>
              <el-input model-value="Introducer" disabled class="crm-input-grey" style="width: 100%" />
            </template>
          </el-form-item>
          <el-form-item label="RM" prop="general.rm" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.rm) }}</span>
            </template>
            <template v-else>
              <el-input
                v-model="fullForm.general.rm"
                placeholder="Please select RM"
                readonly
                class="crm-input-grey"
                style="cursor: pointer"
                @click="emit('open-rm')"
              >
                <template #suffix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Contact Nature" prop="contactNature">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.contactNature) }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.contactNature"
                class="crm-input-grey"
                style="width: 100%"
                :disabled="isViewMode || lockContactNature"
                @change="emit('change-nature')"
              >
                <el-option label="Individual" value="Individual" />
                <el-option label="Corporate" value="Corporate" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="ARM">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.arm) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.arm" placeholder="Please select ARM" readonly style="cursor: pointer" @click="emit('open-arm')">
                <template #suffix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Introducer Id">
            <template v-if="introducerNumericId">
              <span class="view-mode-text">{{ formatIntroducerDisplayId(fullForm.contactNature, introducerNumericId) }}</span>
            </template>
            <template v-else>
              <span class="id-placeholder">This field will be auto-generated after saving</span>
            </template>
          </el-form-item>
          <el-form-item label="Introducer">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ linkedIntroducerLabel }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.general.linkedIntroducerId"
                placeholder="Please select"
                style="width: 100%"
                filterable
                clearable
                :loading="introducerSelectLoading"
                @focus="emit('load-introducers')"
              >
                <el-option v-for="intro in visibleIntroducers" :key="intro.id" :label="intro.introducer" :value="intro.id" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Client Relationship Status">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.clientRelationshipStatus) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.clientRelationshipStatus" placeholder="Please select" style="width: 100%">
                <el-option label="Prospecting" value="Prospecting" />
                <el-option label="On Boarding" value="On Boarding" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Date of Company Search/COI Issued (dd/mm/yyyy)">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.dateOfCompanySearch) }}</span>
            </template>
            <template v-else>
              <el-date-picker
                v-model="fullForm.general.dateOfCompanySearch"
                type="date"
                placeholder="Select date"
                format="DD/MM/YYYY"
                value-format="DD/MM/YYYY"
                style="width: 100%"
                class="crm-input-grey"
                :prefix-icon="Calendar"
              />
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Company Name" prop="general.companyName" required>
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.companyName) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.companyName" placeholder="Please enter company name" class="crm-input-grey" />
            </template>
          </el-form-item>
          <el-form-item label="Country/Region of Registration">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.countryOfRegistration) }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.general.countryOfRegistration"
                placeholder="Please select country/region"
                style="width: 100%"
                filterable
                class="crm-input-grey"
              >
                <template #prefix>
                  <el-icon class="field-globe-icon"><Place /></el-icon>
                </template>
                <el-option v-for="c in nationalityList" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Corporate Type">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.corporateType) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.corporateType" placeholder="Please select" style="width: 100%" class="crm-input-grey">
                <el-option label="Limited Company" value="Limited Company" />
                <el-option label="Corporation" value="Corporation" />
                <el-option label="Partnership" value="Partnership" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Business Domicile">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.businessDomicile) }}</span>
            </template>
            <template v-else>
              <el-select
                v-model="fullForm.general.businessDomicile"
                placeholder="Please select country/region"
                style="width: 100%"
                filterable
                class="crm-input-grey"
              >
                <template #prefix>
                  <el-icon class="field-globe-icon"><Place /></el-icon>
                </template>
                <el-option v-for="c in nationalityList" :key="c" :label="c" :value="c" />
              </el-select>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Industry">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.industry) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.industry" placeholder="Please select" style="width: 100%" class="crm-input-grey">
                <el-option label="Finance" value="Finance" />
                <el-option label="Technology" value="Technology" />
                <el-option label="Manufacturing" value="Manufacturing" />
                <el-option label="Retail" value="Retail" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label="Registration Date (dd/mm/yyyy)">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.registrationDate) }}</span>
            </template>
            <template v-else>
              <el-date-picker
                v-model="fullForm.general.registrationDate"
                type="date"
                placeholder="Select date"
                format="DD/MM/YYYY"
                value-format="DD/MM/YYYY"
                style="width: 100%"
                class="crm-input-grey"
                :prefix-icon="Calendar"
              />
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="State Owned">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.stateOwned) }}</span>
            </template>
            <template v-else>
              <el-switch v-model="fullForm.general.stateOwned" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.general.stateOwned ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
          <el-form-item label=" " />
        </div>
        <div class="form-row">
          <el-form-item label="Chinese Name">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.chineseName) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.chineseName" placeholder="Please enter Chinese name" class="crm-input-grey" />
            </template>
          </el-form-item>
          <el-form-item label=" " />
        </div>
        <div class="form-row">
          <el-form-item label="Id Type">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.idType) }}</span>
            </template>
            <template v-else>
              <el-select v-model="fullForm.general.idType" placeholder="Please select" style="width: 100%" class="crm-input-grey">
                <el-option label="Business License" value="Business License" />
                <el-option label="Registration Certificate" value="Registration Certificate" />
              </el-select>
            </template>
          </el-form-item>
          <el-form-item label=" " />
        </div>
        <div class="form-row">
          <el-form-item label="Id No.">
            <template v-if="isViewMode">
              <span class="view-mode-text">{{ formatDisplayValue(fullForm.general.idNo) }}</span>
            </template>
            <template v-else>
              <el-input v-model="fullForm.general.idNo" placeholder="Please enter ID number" class="crm-input-grey" />
            </template>
          </el-form-item>
          <el-form-item label=" " />
        </div>
      </template>
    </div>

    <!-- Contact -->
    <div class="form-section">
      <h3 class="section-title">Contact</h3>
      <template v-if="fullForm.contactNature === 'Corporate'">
        <div class="form-row">
          <el-form-item label="Title">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.title) }}</span>
            <el-select v-else v-model="fullForm.contact.title" placeholder="Please select" style="width: 100%">
              <el-option label="Mr." value="Mr." />
              <el-option label="Ms." value="Ms." />
              <el-option label="Mrs." value="Mrs." />
              <el-option label="Dr." value="Dr." />
            </el-select>
          </el-form-item>
          <el-form-item label="Mobile Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.mobilePhone) }}</span>
            <el-input v-else v-model="fullForm.contact.mobilePhone" placeholder="Please enter mobile phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="First Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.firstName) }}</span>
            <el-input v-else v-model="fullForm.contact.firstName" placeholder="Please enter first name" />
          </el-form-item>
          <el-form-item label="Home Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.homePhone) }}</span>
            <el-input v-else v-model="fullForm.contact.homePhone" placeholder="Please enter home phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Last Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.lastName) }}</span>
            <el-input v-else v-model="fullForm.contact.lastName" placeholder="Please enter last name" />
          </el-form-item>
          <el-form-item label="Primary Email">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.primaryEmail) }}</span>
            <el-input v-else v-model="fullForm.contact.primaryEmail" placeholder="Please enter email">
              <template #suffix><el-icon><Message /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Chinese Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.chineseName) }}</span>
            <el-input v-else v-model="fullForm.contact.chineseName" placeholder="Please enter Chinese name" />
          </el-form-item>
          <el-form-item label="Address" style="width: 100%;">
            <span v-if="isViewMode" class="view-mode-text" style="white-space: pre-wrap">{{ formatDisplayValue(fullForm.contact.address) }}</span>
            <el-input v-else v-model="fullForm.contact.address" type="textarea" :rows="3" placeholder="Please enter address" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id Type">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.idType) }}</span>
            <el-select v-else v-model="fullForm.contact.idType" placeholder="Please select" style="width: 100%">
              <el-option label="Business License" value="Business License" />
              <el-option label="Registration Certificate" value="Registration Certificate" />
              <el-option label="Passport" value="Passport" />
              <el-option label="ID Card" value="ID Card" />
            </el-select>
          </el-form-item>
          <el-form-item label="Jurisdiction of Contact No. and Address Differs">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.jurisdictionDiffers) }}</span>
            <template v-else>
              <el-switch v-model="fullForm.contact.jurisdictionDiffers" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id No.">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.idNo) }}</span>
            <el-input v-else v-model="fullForm.contact.idNo" placeholder="Please enter ID number" />
          </el-form-item>
          <el-form-item />
        </div>
        <div class="form-row" style="margin-bottom: 20px">
          <el-form-item label="Id Expiry (dd/mm/yyyy)">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.idExpiry) }}</span>
            <el-date-picker
              v-else
              v-model="fullForm.contact.idExpiry"
              type="date"
              placeholder="Select date"
              format="DD/MM/YYYY"
              value-format="DD/MM/YYYY"
              style="width: 100%"
              class="crm-input-grey"
              :prefix-icon="Calendar"
            />
          </el-form-item>
          <el-form-item />
        </div>
      </template>
      <template v-else>
        <div class="form-row">
          <el-form-item label="Mobile Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.mobilePhone) }}</span>
            <el-input v-else v-model="fullForm.contact.mobilePhone" placeholder="Please enter mobile phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="Primary Email">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.primaryEmail) }}</span>
            <el-input v-else v-model="fullForm.contact.primaryEmail" placeholder="Please enter email">
              <template #suffix><el-icon><Message /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row" style="margin-bottom: 10px">
          <el-form-item label="Home Phone" style="align-self: flex-start">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.homePhone) }}</span>
            <el-input v-else v-model="fullForm.contact.homePhone" placeholder="Please enter home phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="Address" style="width: 100%">
            <span v-if="isViewMode" class="view-mode-text" style="white-space: pre-wrap">{{ formatDisplayValue(fullForm.contact.address) }}</span>
            <el-input v-else v-model="fullForm.contact.address" type="textarea" :rows="3" placeholder="Please enter address" />
          </el-form-item>
        </div>
        <div class="form-row" style="margin-top: 0; margin-bottom: 20px">
          <el-form-item label="Jurisdiction of Contact No. and Address Differs">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.contact.jurisdictionDiffers) }}</span>
            <template v-else>
              <el-switch v-model="fullForm.contact.jurisdictionDiffers" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.contact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
          <el-form-item />
        </div>
      </template>
    </div>

    <!-- Secondary Contact -->
    <div class="form-section">
      <h3 class="section-title">Secondary Contact</h3>
      <template v-if="fullForm.contactNature === 'Corporate'">
        <div class="form-row">
          <el-form-item label="Title">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.title) }}</span>
            <el-select v-else v-model="fullForm.secondaryContact.title" placeholder="Please select" style="width: 100%">
              <el-option label="Mr." value="Mr." />
              <el-option label="Ms." value="Ms." />
              <el-option label="Mrs." value="Mrs." />
              <el-option label="Dr." value="Dr." />
            </el-select>
          </el-form-item>
          <el-form-item label="Mobile Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.mobilePhone) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.mobilePhone" placeholder="Please enter mobile phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="First Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.firstName) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.firstName" placeholder="Please enter first name" />
          </el-form-item>
          <el-form-item label="Home Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.homePhone) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.homePhone" placeholder="Please enter home phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Last Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.lastName) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.lastName" placeholder="Please enter last name" />
          </el-form-item>
          <el-form-item label="Primary Email">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.primaryEmail) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.primaryEmail" placeholder="Please enter email">
              <template #suffix><el-icon><Message /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Chinese Name">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.chineseName) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.chineseName" placeholder="Please enter Chinese name" />
          </el-form-item>
          <el-form-item label="Address" style="width: 100%;">
            <span v-if="isViewMode" class="view-mode-text" style="white-space: pre-wrap">{{ formatDisplayValue(fullForm.secondaryContact.address) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.address" type="textarea" :rows="3" placeholder="Please enter address" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id Type">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.idType) }}</span>
            <el-select v-else v-model="fullForm.secondaryContact.idType" placeholder="Please select" style="width: 100%">
              <el-option label="Business License" value="Business License" />
              <el-option label="Registration Certificate" value="Registration Certificate" />
              <el-option label="Passport" value="Passport" />
              <el-option label="ID Card" value="ID Card" />
            </el-select>
          </el-form-item>
          <el-form-item label="Jurisdiction of Contact No. and Address Differs">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.jurisdictionDiffers) }}</span>
            <template v-else>
              <el-switch v-model="fullForm.secondaryContact.jurisdictionDiffers" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.secondaryContact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="Id No.">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.idNo) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.idNo" placeholder="Please enter ID number" />
          </el-form-item>
          <el-form-item />
        </div>
        <div class="form-row" style="margin-bottom: 20px">
          <el-form-item label="Id Expiry (dd/mm/yyyy)">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.idExpiry) }}</span>
            <el-date-picker
              v-else
              v-model="fullForm.secondaryContact.idExpiry"
              type="date"
              placeholder="Select date"
              format="DD/MM/YYYY"
              value-format="DD/MM/YYYY"
              style="width: 100%"
              class="crm-input-grey"
              :prefix-icon="Calendar"
            />
          </el-form-item>
          <el-form-item />
        </div>
      </template>
      <template v-else>
        <div class="form-row">
          <el-form-item label="Mobile Phone">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.mobilePhone) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.mobilePhone" placeholder="Please enter mobile phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="Primary Email">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.primaryEmail) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.primaryEmail" placeholder="Please enter email">
              <template #suffix><el-icon><Message /></el-icon></template>
            </el-input>
          </el-form-item>
        </div>
        <div class="form-row" style="margin-bottom: 10px">
          <el-form-item label="Home Phone" style="align-self: flex-start">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.homePhone) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.homePhone" placeholder="Please enter home phone">
              <template #suffix><el-icon><Phone /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="Address" style="width: 100%">
            <span v-if="isViewMode" class="view-mode-text" style="white-space: pre-wrap">{{ formatDisplayValue(fullForm.secondaryContact.address) }}</span>
            <el-input v-else v-model="fullForm.secondaryContact.address" type="textarea" :rows="3" placeholder="Please enter address" />
          </el-form-item>
        </div>
        <div class="form-row" style="margin-top: 0; margin-bottom: 20px">
          <el-form-item label="Jurisdiction of Contact No. and Address Differs">
            <span v-if="isViewMode" class="view-mode-text">{{ formatDisplayValue(fullForm.secondaryContact.jurisdictionDiffers) }}</span>
            <template v-else>
              <el-switch v-model="fullForm.secondaryContact.jurisdictionDiffers" :active-value="true" :inactive-value="false" />
              <span style="margin-left: 8px">{{ fullForm.secondaryContact.jurisdictionDiffers ? 'Yes' : 'No' }}</span>
            </template>
          </el-form-item>
          <el-form-item />
        </div>
      </template>
    </div>

    <!-- Portfolio -->
    <div class="form-section portfolio-section">
      <div class="section-header">
        <h3 class="section-title">Portfolio</h3>
        <el-button v-if="!isViewMode" type="primary" :icon="Plus" @click="emit('new-portfolio')">
          New Portfolio
        </el-button>
      </div>
      <el-table v-if="fullForm.portfolios.length > 0" :data="fullForm.portfolios" class="portfolio-table" border>
        <el-table-column prop="bank" label="Bank" />
        <el-table-column prop="bookingCentre" label="Booking Centre" />
        <el-table-column prop="portfolioNo" label="Portfolio No." />
        <el-table-column label="Upload Time">
          <template #default="{ row }">
            {{ formatDateTime(row.uploadTime) }}
          </template>
        </el-table-column>
        <el-table-column v-if="!isViewMode" width="150">
          <template #default="{ row, $index }">
            <el-link type="primary" :underline="false" @click="emit('edit-portfolio', row, $index)">Edit</el-link>
            <el-divider direction="vertical" />
            <el-link type="primary" :underline="false" @click="emit('delete-portfolio', $index)">Delete</el-link>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty-portfolio">
        <p>No portfolios yet. Click "New Portfolio" to add one.</p>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'
import { User, Message, Phone, Plus, Calendar, Place } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { formatIntroducerDisplayId } from '@/utils/introducer-display-id'
import { nationalityList } from '@/constants/nationalityList'
import { formatDateTime } from '@/utils/date'
import type { Introducer, IntroducerFullPayload } from '@/api/introducer'

const props = defineProps({
  fullForm: { type: Object as PropType<IntroducerFullPayload>, required: true },
  isViewMode: { type: Boolean, default: false },
  introducerNumericId: { type: Number as PropType<number | null>, default: null },
  lockContactNature: { type: Boolean, default: false },
  introducerList: { type: Array as PropType<Introducer[]>, default: () => [] },
  introducerSelectLoading: { type: Boolean, default: false },
  formRules: { type: Object as PropType<FormRules>, required: true }
})

const emit = defineEmits<{
  (e: 'open-rm'): void
  (e: 'open-arm'): void
  (e: 'load-introducers'): void
  (e: 'change-nature'): void
  (e: 'new-portfolio'): void
  (e: 'edit-portfolio', row: Record<string, unknown>, index: number): void
  (e: 'delete-portfolio', index: number): void
}>()

const formRef = ref<FormInstance>()

defineExpose({ formRef })

const visibleIntroducers = computed(() => {
  const selfId = props.introducerNumericId
  return (props.introducerList || []).filter((intro: Introducer) => {
    if (selfId != null && intro.id === selfId) return false
    return intro.isActive !== false
  })
})

const linkedIntroducerLabel = computed(() => {
  const id = props.fullForm.general?.linkedIntroducerId
  if (id == null) return '-'
  const found = props.introducerList.find(i => i.id === id)
  return found?.introducer ?? String(id)
})

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
</script>

<style lang="scss" scoped>
.introducer-general-form {
  max-width: 1200px;

  /* 标签与控件垂直居中对齐（与 Element Plus 默认行高 32px 一致） */
  :deep(.el-form-item) {
    display: flex;
    align-items: center;
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    color: #606266;
    font-weight: 500;
    line-height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    height: auto;
    padding-top: 0;
    padding-bottom: 0;
  }

  /* 多行输入：标签与内容顶部对齐，避免与 textarea 错位 */
  :deep(.el-form-item:has(.el-textarea)) {
    align-items: flex-start;

    .el-form-item__label {
      padding-top: 6px;
    }
  }

  :deep(.el-radio-group) {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    min-height: 32px;
  }

  .crm-input-grey {
    width: 100%;
    :deep(.el-input__wrapper) {
      background-color: #f5f7fa;
      box-shadow: none !important;
    }
    :deep(.el-input__wrapper:hover),
    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #dcdfe6 inset !important;
    }
    :deep(.el-select__wrapper) {
      background-color: #f5f7fa;
      box-shadow: none !important;
    }
    :deep(.el-select__wrapper:hover),
    :deep(.el-select__wrapper.is-focused) {
      box-shadow: 0 0 0 1px #dcdfe6 inset !important;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: #f5f7fa;
    box-shadow: none;
    border: none;
  }

  .field-globe-icon {
    color: #909399;
    font-size: 16px;
  }

  .form-section {
    background: #fff;
    padding: 20px 24px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
  }

  .section-header .section-title {
    margin-bottom: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 24px;
    margin-bottom: 16px;
    align-items: start;

    .el-form-item {
      margin-bottom: 0;
    }
  }

  /* 只读文本与单行输入、选择器视觉高度一致 */
  .view-mode-text {
    display: inline-flex;
    align-items: center;
    width: 100%;
    min-height: 32px;
    padding: 0;
    box-sizing: border-box;
    color: #303133;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
  }

  .id-placeholder {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: #909399;
    font-size: 14px;
    line-height: 1.5;
  }

  .empty-portfolio {
    text-align: center;
    padding: 24px;
    color: #909399;
    font-size: 14px;
  }

  .portfolio-section {
    margin-bottom: 16px;

    .portfolio-table {
      margin-left: 0;
      margin-top: 8px;
      width: 100%;

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

      :deep(.el-table__body-wrapper) td {
        border-bottom: 1px solid #ebeef5;
        color: #303133;
      }

      :deep(.el-table__body tr:hover > td),
      :deep(.el-table__body tr.current-row > td) {
        background-color: #ffffff !important;
      }
    }
  }
}
</style>
