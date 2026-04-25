export const ROLE_ADMIN = 'ADMIN'

export const normalizeRole = (role?: string | null): string => {
  if (!role) return ''
  let normalized = role.trim().toUpperCase().replace(/[-/\s]+/g, '_')
  // 兼容后端常见的 ROLE_ 前缀，避免权限判断偏差（如 ROLE_COMPLIANCE）
  normalized = normalized.replace(/^ROLE_/, '')
  if (['USER', 'RM', 'ARM', 'RMARM', 'RM_ARM'].includes(normalized)) {
    return 'RM/ARM'
  }
  return normalized
}

export const isAdminRole = (role?: string | null): boolean => normalizeRole(role) === ROLE_ADMIN

export const isEmployeeRole = (role?: string | null): boolean => {
  const normalized = normalizeRole(role)
  return !!normalized && normalized !== ROLE_ADMIN
}

export const roleDisplayName = (role?: string | null): string => {
  switch (normalizeRole(role)) {
    case 'ADMIN':
      return 'Admin'
    case 'RM/ARM':
      return 'RM/ARM'
    case 'OPERATION':
      return 'Operation'
    case 'COMPLIANCE':
      return 'Compliance'
    case 'RO':
      return 'RO'
    default:
      return role || '-'
  }
}

export const matchesRouteRole = (userRole: string | undefined, requiredRole: string): boolean => {
  if (requiredRole === 'admin') {
    return isAdminRole(userRole)
  }
  if (requiredRole === 'user' || requiredRole === 'employee') {
    return isEmployeeRole(userRole)
  }
  return normalizeRole(userRole) === normalizeRole(requiredRole)
}

/** Operation / Compliance / RO：客户资料仅在 Review 流程（mode=review）中编辑，不使用预览页「Edit」进入普通编辑 */
export const isReviewerOnlyEditInReviewRole = (role?: string | null): boolean => {
  const n = normalizeRole(role)
  return n === 'OPERATION' || n === 'COMPLIANCE' || n === 'RO'
}

export const isOperationRole = (role?: string | null): boolean => normalizeRole(role) === 'OPERATION'
