/**
 * 格式化日期时间为 yyyy-mm-dd hh:mm 格式
 * @param dateTime 日期时间字符串或 Date 对象
 * @returns 格式化后的日期时间字符串，格式：yyyy-mm-dd hh:mm
 */
export function formatDateTime(dateTime: string | Date | null | undefined): string {
  if (!dateTime) {
    return '-'
  }

  try {
    // 如果是字符串，优先按“原样时区”解析，避免浏览器自动按本地时区偏移（导致快/慢几小时）
    if (typeof dateTime === 'string') {
      // 支持形如 "2026-01-29 19:41:00" 或 "2026-01-29T19:41:00Z" / "2026-01-29T19:41:00+08:00"
      const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
      if (match) {
        const [, datePart, timePart] = match
        return `${datePart} ${timePart}`
      }
      // 其他不规则格式，再退回原来的 Date 解析逻辑
    }

    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-'
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

