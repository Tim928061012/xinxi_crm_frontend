export const formatPersonName = (
  firstName?: string | null,
  lastName?: string | null,
  fallback = ''
): string => {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  if (last && first) return `${last}, ${first}`
  if (last) return last
  if (first) return first
  return fallback
}

