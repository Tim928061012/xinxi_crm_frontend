export const formatPersonName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback = ''
): string => {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  if (first && last) return `${first}, ${last}`
  if (first) return first
  if (last) return last
  return fallback
}

