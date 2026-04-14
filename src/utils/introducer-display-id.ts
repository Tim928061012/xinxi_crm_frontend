/** 介绍人展示编号：个人 INI、企业 INC + 6 位数字（与数据库 introducerId 对齐） */
export function formatIntroducerDisplayId(
  contactNature: string | undefined,
  introducerId: number | null | undefined
): string {
  if (introducerId == null || Number.isNaN(Number(introducerId))) {
    return '—'
  }
  const n = String(Math.floor(Number(introducerId))).padStart(6, '0')
  const prefix = contactNature === 'Corporate' ? 'INC' : 'INI'
  return `${prefix}${n}`
}
