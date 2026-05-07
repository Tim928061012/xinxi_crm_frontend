import type { ClientType } from '@/api/user/workflow'

/**
 * 从列表接口返回的原始对象解析 Individual | Corporate。
 * 优先使用后端 UNION 中的 client_type / clientType，避免仅用 contact_nature 与「自然人/法人」语义混淆或缺省。
 */
export function normalizeClientListClientType(item: Record<string, unknown> | null | undefined): ClientType {
  if (!item || typeof item !== 'object') return 'Individual'

  const asType = (v: unknown): ClientType | null => {
    if (v == null || v === '') return null
    const s = String(v).trim().toLowerCase()
    if (s === 'corporate' || s === 'company') return 'Corporate'
    if (s === 'individual' || s === 'person') return 'Individual'
    return null
  }

  const ordered: unknown[] = [
    item.clientType,
    item.client_type,
    item.contactNature,
    item.contact_nature,
    item.type
  ]
  for (const v of ordered) {
    const t = asType(v)
    if (t) return t
  }
  return 'Individual'
}
