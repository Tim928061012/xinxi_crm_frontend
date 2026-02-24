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
    // 如果是字符串，**严格按后端返回的字符串展示本地时间**：
    // - 不做任何时区换算
    // - 只截取到分钟，保持与接口中时间一致，避免快/慢 8 小时的问题
    if (typeof dateTime === 'string') {
      // 兼容格式：
      // - "2026-01-29 19:41:00"
      // - "2026-01-29T19:41:00"
      // - "2026-01-29T19:41:00.000+00:00" / 带时区后缀
      const match = dateTime.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
      if (match) {
        const [, datePart, timePart] = match
        return `${datePart} ${timePart}`
      }
      // 其他不规则格式，再退回原来的 Date 解析逻辑
    }

    // 兜底：只有在字符串无法匹配预期格式时，才退回 Date 解析
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

