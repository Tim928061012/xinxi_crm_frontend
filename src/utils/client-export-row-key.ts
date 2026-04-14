import type { ClientType } from '@/api/user/workflow'

/** 导出弹窗表格行唯一键：避免仅按 id 时 Individual/Corporate 或重复 id 导致多行联动 */
export function clientExportRowKey(row: {
  id: number
  contactNature: ClientType
  clientBusinessId?: number | string
  clientId?: number | string
}): string {
  let idPart: string
  if (Number.isFinite(row.id) && !Number.isNaN(row.id)) {
    idPart = String(row.id)
  } else {
    const biz = row.clientBusinessId ?? row.clientId
    idPart = biz != null && String(biz) !== '' ? `biz:${String(biz)}` : 'unknown'
  }
  return `${idPart}__${row.contactNature}`
}
