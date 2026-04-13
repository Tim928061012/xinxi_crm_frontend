/** 将字节数格式化为 MB 展示（所有文件大小统一用 MB） */
export function formatFileSizeMb(bytes: number): string {
  if (bytes === 0 || !Number.isFinite(bytes)) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 0.01) {
    return `${Number(mb.toFixed(4))} MB`
  }
  return `${Math.round(mb * 100) / 100} MB`
}
