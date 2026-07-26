# Client Options and Pending Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the requested Corporate Industry and Individual Education Level options, and allow a staged Pending Signature Forms upload to open locally before submit.

**Architecture:** Keep option data in focused constants modules and render Education Level from its exported list. Extract staged-file lookup into a pure utility so `ClientDetail.vue` can route negative temporary IDs to the browser `File` while persisted positive IDs continue through the backend API. The existing deferred upload/delete commit on the header Submit remains unchanged.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Element Plus

---

### Task 1: Client option lists

**Files:**
- Modify: `src/constants/corporate-industry-options.ts`
- Create: `src/constants/education-level-options.ts`
- Modify: `src/views/user/ClientDetail.vue`
- Create: `src/constants/client-form-options.test.ts`

- [ ] **Step 1: Write failing option-order tests**

Create `src/constants/client-form-options.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CORPORATE_INDUSTRY_OPTIONS } from './corporate-industry-options'
import { EDUCATION_LEVEL_OPTIONS } from './education-level-options'

describe('client form options', () => {
  it('places Investment holding with investment and asset-finance industries', () => {
    const index = CORPORATE_INDUSTRY_OPTIONS.indexOf('Investment holding' as never)
    expect(CORPORATE_INDUSTRY_OPTIONS[index - 1]).toBe('Venture Capital & Private Equity')
    expect(CORPORATE_INDUSTRY_OPTIONS[index + 1]).toBe('Financial Leasing & Asset Financing')
  })

  it('places Doctorate after Master and before PhD', () => {
    const index = EDUCATION_LEVEL_OPTIONS.indexOf('Doctorate')
    expect(EDUCATION_LEVEL_OPTIONS[index - 1]).toBe('Master')
    expect(EDUCATION_LEVEL_OPTIONS[index + 1]).toBe('PhD')
  })
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/constants/client-form-options.test.ts`

Expected: FAIL because `education-level-options.ts` does not exist and `Investment holding` is absent.

- [ ] **Step 3: Implement the option constants and render Education Level from the list**

Insert `Investment holding` after `Venture Capital & Private Equity` in `CORPORATE_INDUSTRY_OPTIONS`.

Create `src/constants/education-level-options.ts`:

```ts
export const EDUCATION_LEVEL_OPTIONS = [
  'High School',
  'Bachelor',
  'Master',
  'Doctorate',
  'PhD'
] as const satisfies readonly string[]
```

Import `EDUCATION_LEVEL_OPTIONS` in `ClientDetail.vue` and replace the four hard-coded `<el-option>` elements with:

```vue
<el-option
  v-for="option in EDUCATION_LEVEL_OPTIONS"
  :key="option"
  :label="option"
  :value="option"
/>
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx vitest run src/constants/client-form-options.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the option changes**

```bash
git add src/constants/corporate-industry-options.ts src/constants/education-level-options.ts src/constants/client-form-options.test.ts src/views/user/ClientDetail.vue
git commit -m "feat: add client industry and education options"
```

### Task 2: Open staged Pending Signature Forms locally

**Files:**
- Create: `src/utils/pending-forms.ts`
- Create: `src/utils/pending-forms.test.ts`
- Modify: `src/views/user/ClientDetail.vue`

- [ ] **Step 1: Write failing staged-file lookup tests**

Create `src/utils/pending-forms.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findPendingFormsFile } from './pending-forms'

describe('findPendingFormsFile', () => {
  it('returns the File matching a staged temporary document ID', () => {
    const file = new File(['pdf'], 'signed.pdf', { type: 'application/pdf' })
    expect(findPendingFormsFile(-2, [{ tempId: -2, file }])).toBe(file)
  })

  it('returns undefined for a persisted document ID', () => {
    const file = new File(['pdf'], 'signed.pdf', { type: 'application/pdf' })
    expect(findPendingFormsFile(42, [{ tempId: -2, file }])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/utils/pending-forms.test.ts`

Expected: FAIL because `pending-forms.ts` does not exist.

- [ ] **Step 3: Implement the pure lookup utility**

Create `src/utils/pending-forms.ts`:

```ts
export type PendingFormsUpload = { tempId: number; file: File }

export function findPendingFormsFile(
  documentId: number,
  pendingUploads: readonly PendingFormsUpload[]
): File | undefined {
  if (documentId >= 0) return undefined
  return pendingUploads.find(item => item.tempId === documentId)?.file
}
```

- [ ] **Step 4: Run utility tests and verify GREEN**

Run: `npx vitest run src/utils/pending-forms.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: Route staged documents to a local object URL**

In `ClientDetail.vue`, import `findPendingFormsFile` and its `PendingFormsUpload` type. Remove the duplicate local type. At the start of `handleOpenDocument`, after validating `document.id`, resolve the staged file:

```ts
const stagedFile = findPendingFormsFile(document.id, pendingFormsUploads.value)
if (document.id < 0) {
  if (!stagedFile) {
    ElMessage.warning('This staged file is no longer available. Please select it again.')
    return
  }
  const localUrl = window.URL.createObjectURL(stagedFile)
  window.open(localUrl, '_blank')
  window.setTimeout(() => window.URL.revokeObjectURL(localUrl), 60_000)
  return
}
```

Persisted positive document IDs continue into the existing `documentsApi.getDocument` branch.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npx vitest run src/utils/pending-forms.test.ts src/constants/client-form-options.test.ts`

Expected: 4 tests pass.

- [ ] **Step 7: Commit the staged preview fix**

```bash
git add src/utils/pending-forms.ts src/utils/pending-forms.test.ts src/views/user/ClientDetail.vue
git commit -m "fix: open staged signature forms locally"
```

### Task 3: Full verification

**Files:**
- Verify: all modified frontend files

- [ ] **Step 1: Run all unit tests**

Run: `npm test -- --run` if a test script exists; otherwise run `npx vitest run`.

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run type checking**

Run: `npx vue-tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Vite exits successfully and writes `dist`.

- [ ] **Step 4: Verify the working tree**

Run: `git status --short` and `git diff --check`.

Expected: only the local Vite proxy config and the implementation-plan document remain uncommitted; no whitespace errors.
