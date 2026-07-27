# Atomic Review Persistence Design

## Problem

Operation and Compliance reviewers can edit multiple client tabs while reviewing, but the workflow action currently submits only `clientDetail`. KYC, Investment Risk Profile, Investment Knowledge & Experience, and Fee Schedule changes remain only in browser state. Approve or Reject still advances the workflow, so those edits disappear when the next stage reloads the client.

## Affected roles and stages

| Stage | Reviewing role | Editable | Required behavior |
| --- | --- | --- | --- |
| Operational Review | OPERATION | Yes | Save all edits on Approve and Reject before transition |
| Compliance Review | COMPLIANCE | Yes | Save all edits on Approve and Reject before transition |
| Signature Under Review | RO | No | Keep the existing read-only review behavior |

Relationship-role submission, Pending Signature document staging, Admin withdrawal, Documents, and Comments are outside this change.

## Request contract

`ClientWorkflowActionRequest` will contain:

- `clientDetail`: existing General, Contact, Secondary Contact, and Portfolio data.
- `kycInfo`: KYC date, status, and next review date.
- `riskAssessment`: risk-profile fields plus every Investment Knowledge & Experience row.
- `feeSchedule`: all fee-schedule fields.

The frontend will build this payload from the same reactive objects rendered in review mode. Knowledge and Experience booleans must always be sent explicitly as `hasKnowledge` and `hasExperience`, including `false` values.

Document metadata and binary uploads remain on their existing immediate endpoints. Comments also remain immediate.

## Backend transaction

The public Approve and Reject service methods remain transactional. Review processing will:

1. Normalize client type and verify client access.
2. Load the current workflow status and verify that the current role owns that review stage.
3. For editable Operation or Compliance review stages, require and persist the complete review payload.
4. Upsert KYC, Risk Assessment, Investment Knowledge & Experience, and Fee Schedule records using the request client ID and normalized client type, not client-controlled identifiers.
5. Update workflow flags and status.
6. Write the progress log.
7. Return the refreshed progress DTO.

Any validation or persistence exception aborts the workflow action. Spring rolls back all database writes, including the progress status and log. The frontend remains on the review page and displays the failure.

## Upsert rules

- KYC uses the existing client/type-based save behavior.
- Risk Assessment uses client/type identity and replaces the full Knowledge & Experience row set in the same transaction.
- Fee Schedule gains a client/type-based save operation that inserts when absent and updates the existing row when present.
- Existing records keep their database identifiers; identifiers supplied by the browser cannot redirect writes to another client.

## Frontend behavior

Approve and Reject use one shared payload builder and one workflow request. The UI must not call independent KYC, Risk, or Fee endpoints before the workflow request because that would allow partial saves.

On success, the current success message and navigation remain unchanged. On failure, no success message or navigation occurs, and the reviewer can correct the data and retry.

## Tests

Frontend tests will verify:

- The review payload contains all four data sections.
- KYC fields are preserved.
- Risk booleans map correctly, including explicit `false` values.
- Every Knowledge & Experience row maps to the backend field names.
- Fee Schedule fields are included.

Backend tests will verify:

- OPERATION can save and Approve or Reject Operational Review for Individual and Corporate clients.
- COMPLIANCE can save and Approve or Reject Compliance Review for Individual and Corporate clients.
- Every editable module is invoked before workflow state persistence.
- Missing KYC, Risk, or Fee records are created; existing records are updated.
- A module persistence exception prevents status update and progress-log creation.
- RO Signature Review remains read-only; the backend does not persist editable review sections for RO and keeps the existing signature decision behavior.
