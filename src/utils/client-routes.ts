/**
 * 客户详情路由前缀（含 v2 独立标签页 /standalone/*，无侧栏）
 */
export function getClientBasePath(path: string): string {
  if (path.startsWith('/standalone/user/client')) return '/standalone/user/client'
  if (path.startsWith('/standalone/client')) return '/standalone/client'
  if (path.startsWith('/user/client')) return '/user/client'
  if (path.startsWith('/client')) return '/client'
  return '/user/client'
}

/** 管理端客户相关路径（含 standalone 管理端） */
export function isAdminClientRoute(path: string): boolean {
  return path.startsWith('/standalone/client') || (path.startsWith('/client') && !path.startsWith('/user'))
}

export function getClientListPath(path: string): '/client' | '/user/client' {
  return isAdminClientRoute(path) ? '/client' : '/user/client'
}

/** 是否在无侧栏的独立标签页中打开客户详情 */
export function isStandaloneClientRoute(path: string): boolean {
  return path.startsWith('/standalone/')
}
