# Client Options and Pending Signature Design

## Scope

This change adds two options to existing client fields and fixes staged Forms behavior in Pending Signature without changing the deferred-submit interaction model.

## Client options

- Add `Investment holding` to the Corporate Industry options immediately after `Venture Capital & Private Equity` and before `Financial Leasing & Asset Financing`.
- Add `Doctorate` to the Individual Education Level options immediately after `Master` and before the existing `PhD` option.
- These are option-list changes only. Existing backend string fields and database columns require no schema change.

## Pending Signature Forms

Forms uploads and deletions remain staged in the browser until the signature package is submitted.

- Existing persisted documents continue to open through the backend download endpoint.
- A newly staged document opens directly from its in-memory `File` using a temporary object URL.
- The object URL is revoked after the new browser tab has received it to avoid leaking browser memory.
- Deleting a staged upload removes it from the staged upload list.
- Deleting a persisted document records its positive document ID for deletion on submit.
- Every UI path that submits a Pending Signature package must commit staged deletions and uploads before invoking the workflow transition.
- If committing staged document changes fails, the workflow transition must not run and the staged state must remain available for retry.

## Error handling

- Opening a staged row whose `File` can no longer be found shows a refresh/reselect warning and does not call the backend with a negative ID.
- Backend download errors for persisted documents keep the existing error message.
- Submit failures surface the backend error and do not report a successful workflow transition.

## Tests

- Verify the Corporate Industry option order around `Investment holding`.
- Verify the Education Level order around `Doctorate`.
- Verify a staged Forms row resolves to its local `File` and does not use the backend download API.
- Verify persisted Forms rows continue to use their document IDs.
- Verify each Pending Signature submission entry point commits staged deletions/uploads before the workflow request.
