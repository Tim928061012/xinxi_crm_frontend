export type PendingFormsUpload = { tempId: number; file: File }

export function findPendingFormsFile(
  documentId: number,
  pendingUploads: readonly PendingFormsUpload[]
): File | undefined {
  if (documentId >= 0) return undefined
  return pendingUploads.find(item => item.tempId === documentId)?.file
}
