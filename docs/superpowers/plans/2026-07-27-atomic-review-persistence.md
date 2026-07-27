# Atomic Review Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every editable client section atomically when Operation or Compliance approves or rejects a review.

**Architecture:** The frontend builds one typed workflow payload from the four review form sections and sends it through the existing Approve/Reject endpoint. The backend validates the workflow owner and stage, then a focused persistence service overwrites browser-supplied identity with the path identity and saves Client Detail, KYC, Risk/Knowledge, and Fee Schedule inside the workflow transaction before status and log updates.

**Tech Stack:** Vue 3, TypeScript, Vitest, Spring Boot 3, Java 17, MyBatis, JUnit 5, Mockito

---

### Task 1: Frontend review payload builder

**Files:**
- Create: `src/utils/client-review-payload.ts`
- Create: `src/utils/client-review-payload.test.ts`
- Modify: `src/api/user/risk-profile.ts`
- Modify: `src/api/user/fee-schedule.ts`
- Modify: `src/api/user/workflow.ts`

- [ ] **Step 1: Write failing payload tests**

Add Vitest cases that call `buildClientReviewPayload(clientId, clientType, clientDetail, kycData, riskProfileData, feeScheduleData)` and assert exact `clientDetail`, `kycInfo`, `riskAssessment`, and `feeSchedule` sections. Include Knowledge rows where `knowledge` and `experience` are both `false`, and assert `hasKnowledge: false` and `hasExperience: false` remain own properties.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/utils/client-review-payload.test.ts`

Expected: FAIL because `client-review-payload.ts` and the builder do not exist.

- [ ] **Step 3: Implement typed pure builders**

Export `buildRiskAssessmentPayload` from `risk-profile.ts` and `buildFeeSchedulePayload` from `fee-schedule.ts`, reusing them in the existing direct-save APIs. Create `buildClientReviewPayload` to strip KYC document arrays, compose all four sections, and preserve explicit boolean values. Extend `WorkflowActionPayload` with `kycInfo`, `riskAssessment`, and `feeSchedule` using imported API model types.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/utils/client-review-payload.test.ts`

Expected: PASS, including explicit false Knowledge/Experience assertions.

- [ ] **Step 5: Commit**

Run: `git add src/utils/client-review-payload.ts src/utils/client-review-payload.test.ts src/api/user/risk-profile.ts src/api/user/fee-schedule.ts src/api/user/workflow.ts && git commit -m "test: define complete review payload"`

### Task 2: Fee Schedule client-based upsert

**Files:**
- Modify: `src/main/java/com/example/crm/service/ClientFeeScheduleService.java`
- Modify: `src/main/java/com/example/crm/service/impl/ClientFeeScheduleServiceImpl.java`
- Create: `src/test/java/com/example/crm/service/impl/ClientFeeScheduleServiceImplTest.java`

- [ ] **Step 1: Write failing service tests**

Add Mockito tests for `saveByClient(clientId, clientType, incoming)`: when no row exists it must force trusted `clientId/clientType`, clear any incoming ID, and insert; when a row exists it must keep the existing ID and timestamps, copy every editable fee field, and update.

- [ ] **Step 2: Verify RED**

Run: `./mvnw -Dtest=ClientFeeScheduleServiceImplTest test`

Expected: FAIL because `saveByClient` is not declared.

- [ ] **Step 3: Implement minimal upsert**

Add `ClientFeeSchedule saveByClient(Long clientId, String clientType, ClientFeeSchedule feeSchedule)` to the interface and implementation. Query by trusted identity, insert a new normalized entity when absent, otherwise copy only editable fee fields onto the existing entity and update it.

- [ ] **Step 4: Verify GREEN**

Run: `./mvnw -Dtest=ClientFeeScheduleServiceImplTest test`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/main/java/com/example/crm/service/ClientFeeScheduleService.java src/main/java/com/example/crm/service/impl/ClientFeeScheduleServiceImpl.java src/test/java/com/example/crm/service/impl/ClientFeeScheduleServiceImplTest.java && git commit -m "feat: upsert fee schedule by client"`

### Task 3: Complete backend review persistence boundary

**Files:**
- Modify: `src/main/java/com/example/crm/dto/ClientWorkflowActionRequest.java`
- Create: `src/main/java/com/example/crm/service/ClientReviewPersistenceService.java`
- Create: `src/main/java/com/example/crm/service/impl/ClientReviewPersistenceServiceImpl.java`
- Create: `src/test/java/com/example/crm/service/impl/ClientReviewPersistenceServiceImplTest.java`

- [ ] **Step 1: Write failing persistence tests**

Construct complete requests and verify `persist(clientId, clientType, request)` calls `ClientService.updateClient`, `ClientKycInfoService.save`, `ClientRiskProfileService.createRiskAssessment`, and `ClientFeeScheduleService.saveByClient`. Assert the service forces `contactNature`, KYC identity, risk-profile identity, every investment-experience identity, and fee identity from method arguments. Add one parameterized missing-section test for each of `clientDetail`, `kycInfo`, `riskAssessment`, and `feeSchedule`, expecting `BusinessException` before any persistence call.

- [ ] **Step 2: Verify RED**

Run: `./mvnw -Dtest=ClientReviewPersistenceServiceImplTest test`

Expected: FAIL because the request fields and persistence service do not exist.

- [ ] **Step 3: Implement DTO and service**

Add fields `ClientKycInfo kycInfo`, `RiskAssessmentDTO riskAssessment`, and `ClientFeeSchedule feeSchedule` to the request. Implement `persist` with complete-payload validation, normalize `Individual/Corporate`, overwrite all nested IDs/types, and call the four existing/upsert services in order.

- [ ] **Step 4: Verify GREEN**

Run: `./mvnw -Dtest=ClientReviewPersistenceServiceImplTest test`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/main/java/com/example/crm/dto/ClientWorkflowActionRequest.java src/main/java/com/example/crm/service/ClientReviewPersistenceService.java src/main/java/com/example/crm/service/impl/ClientReviewPersistenceServiceImpl.java src/test/java/com/example/crm/service/impl/ClientReviewPersistenceServiceImplTest.java && git commit -m "feat: persist complete review edits"`

### Task 4: Gate persistence by validated workflow stage

**Files:**
- Modify: `src/main/java/com/example/crm/service/impl/ClientWorkflowServiceImpl.java`
- Create: `src/test/java/com/example/crm/service/impl/ClientWorkflowServiceImplTest.java`

- [ ] **Step 1: Write failing workflow tests**

Add parameterized Mockito tests covering Individual and Corporate for OPERATION at `OPERATIONAL_REVIEW` and COMPLIANCE at `COMPLIANCE_REVIEW`, with both approve and reject. Verify `ClientReviewPersistenceService.persist` runs after role/status validation and before entity update/log creation. Add a persistence-failure test verifying neither client update nor log write occurs, and an RO `SIGNATURE_UNDER_REVIEW` test verifying the persistence service is never called.

- [ ] **Step 2: Verify RED**

Run: `./mvnw -Dtest=ClientWorkflowServiceImplTest test`

Expected: FAIL because workflow does not depend on the persistence service and currently persists detail before validating status.

- [ ] **Step 3: Wire validated atomic persistence**

Inject `ClientReviewPersistenceService`. In each Individual/Corporate branch, load current status, call `resolveReviewTarget` first to validate owner/stage, invoke complete persistence only when the validated stage is Operational or Compliance Review and role is OPERATION or COMPLIANCE, then apply flags, update status, and write the log. Remove the pre-validation partial `clientDetail` save.

- [ ] **Step 4: Verify GREEN and transaction annotation**

Run: `./mvnw -Dtest=ClientWorkflowServiceImplTest test`

Expected: PASS. Confirm public `approve` and `reject` remain annotated `@Transactional`, so a persistence exception rolls back all module writes.

- [ ] **Step 5: Commit without overwriting existing user edits**

Review `git diff` carefully, stage only the intended workflow hunks and new test, then commit: `git commit -m "fix: save review edits before workflow transition"`.

### Task 5: Send the complete payload for Approve and Reject

**Files:**
- Modify: `src/views/user/ClientDetail.vue`
- Modify: `src/utils/client-review-payload.test.ts`

- [ ] **Step 1: Add a failing decision-payload assertion**

Extend the builder test to use the same reactive-shape values as `ClientDetail.vue` and assert the object is valid for both approve and reject calls without mutation or omission.

- [ ] **Step 2: Verify RED where applicable**

Run: `npx vitest run src/utils/client-review-payload.test.ts`

Expected: PASS for the pure builder; use the code change in the next step to replace the known incomplete call site.

- [ ] **Step 3: Update the review action call site**

Import `buildClientReviewPayload`. When the validated view stage is Operational or Compliance Review, build one payload from `buildWorkflowClientDetailPayload()`, `kycData`, `riskProfileData`, and `feeScheduleData`; pass that same payload shape to both `workflowApi.approve` and `workflowApi.reject`. Keep RO requests empty and preserve existing validation, messages, and navigation.

- [ ] **Step 4: Verify frontend**

Run: `npx vitest run && npm run build`

Expected: all Vitest files pass and Vite production build succeeds.

- [ ] **Step 5: Commit**

Run: `git add src/views/user/ClientDetail.vue src/utils/client-review-payload.test.ts && git commit -m "fix: submit all reviewer edits atomically"`

### Task 6: Full regression and manual workflow verification

**Files:**
- No production files expected

- [ ] **Step 1: Run backend suite**

Run: `./mvnw test`

Expected: BUILD SUCCESS with all tests passing.

- [ ] **Step 2: Run frontend suite and type/build check**

Run: `npx vitest run && npm run build`

Expected: all tests pass and production assets build successfully.

- [ ] **Step 3: Inspect changes and identity safety**

Run `git diff --check`, inspect both repositories' `git status --short`, and confirm `vite.local-8081.config.ts` remains untracked. Verify no request-provided ID can select another client's KYC, risk, experience, or fee records.

- [ ] **Step 4: Verify local workflow**

Using the running local frontend/backend, edit one Knowledge value to Yes and another to No plus one KYC/Fee value during Operational Review, Reject, reload, and verify values persist. Repeat an edit during Compliance Review and Approve. Confirm RO Signature Review remains read-only.

- [ ] **Step 5: Request code review and finish branch**

Use `superpowers:requesting-code-review`, address findings, rerun affected tests, then use `superpowers:verification-before-completion` and `superpowers:finishing-a-development-branch` before proposing push/merge/deployment actions.
