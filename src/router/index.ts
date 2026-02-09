import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 配置NProgress
NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  // 管理员布局
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/account',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'account',
        name: 'Account',
        component: () => import('@/views/admin/Account.vue'),
        meta: { 
          requiresAuth: true,
          title: '账户管理',
          roles: ['admin']
        }
      },
      {
        path: 'client',
        name: 'Client',
        component: () => import('@/views/admin/Client.vue'),
        meta: { 
          requiresAuth: true,
          title: '客户管理',
          roles: ['admin']
        }
      },
      {
        path: 'client/:id',
        name: 'AdminClientView',
        component: () => import('@/views/user/ClientDetail.vue'),
        meta: { 
          requiresAuth: true,
          title: '客户详情',
          roles: ['admin']
        }
      },
      {
        path: 'introducer',
        name: 'Introducer',
        component: () => import('@/views/admin/Introducer.vue'),
        meta: { 
          requiresAuth: true,
          title: '介绍人管理',
          roles: ['admin']
        }
      },
      {
        path: 'bank-centre',
        name: 'BankCentre',
        component: () => import('@/views/admin/BankCentre.vue'),
        meta: { 
          requiresAuth: true,
          title: '银行与中心',
          roles: ['admin']
        }
      },
      // 普通用户路由（在管理员布局中，但通常不会被访问）
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/user/Tasks.vue'),
        meta: { 
          requiresAuth: true,
          title: '任务管理',
          roles: ['user', 'admin']
        }
      },
      {
        path: 'data',
        name: 'Data',
        component: () => import('@/views/user/Data.vue'),
        meta: { 
          requiresAuth: true,
          title: '数据管理',
          roles: ['user', 'admin']
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { 
          requiresAuth: true,
          title: '个人中心',
          roles: ['user', 'admin']
        }
      },
      // 超级管理员路由
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { 
          requiresAuth: true,
          title: '用户管理',
          roles: ['admin']
        }
      },
      {
        path: 'admin/system',
        name: 'AdminSystem',
        component: () => import('@/views/admin/System.vue'),
        meta: { 
          requiresAuth: true,
          title: '系统设置',
          roles: ['admin']
        }
      },
      {
        path: 'admin/logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/Logs.vue'),
        meta: { 
          requiresAuth: true,
          title: '操作日志',
          roles: ['admin']
        }
      }
    ]
  },
  // 普通用户布局
  {
    path: '/user',
    component: () => import('@/layouts/UserLayout.vue'),
    redirect: '/user/client',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'client',
        name: 'UserClient',
        component: () => import('@/views/user/ClientList.vue'),
        meta: {
          requiresAuth: true,
          title: '客户管理',
          roles: ['user']
        }
      },
      {
        path: 'client/new',
        name: 'UserClientNew',
        component: () => import('@/views/user/ClientDetail.vue'),
        meta: {
          requiresAuth: true,
          title: '新建客户',
          roles: ['user']
        }
      },
      {
        path: 'client/:id',
        name: 'UserClientView',
        component: () => import('@/views/user/ClientDetail.vue'),
        meta: {
          requiresAuth: true,
          title: '客户详情',
          roles: ['user']
        }
      },
      {
        path: 'client/:id/edit',
        name: 'UserClientEdit',
        component: () => import('@/views/user/ClientDetail.vue'),
        meta: {
          requiresAuth: true,
          title: '编辑客户',
          roles: ['user']
        }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/Profile.vue'),
        meta: {
          requiresAuth: true,
          title: '个人中心',
          roles: ['user']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  NProgress.start()
  
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.user?.role

  // 如果路由需要认证但用户未登录
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    NProgress.done()
    return
  }

  // 如果已登录用户访问登录页，重定向到对应页面
  if (to.name === 'Login' && isAuthenticated) {
    if (userRole === 'admin') {
      next({ name: 'Account' })
    } else {
      next({ name: 'UserClient' })
    }
    NProgress.done()
    return
  }

  // 优先处理 /user 下的路由
  if (to.path.startsWith('/user')) {
    // 未登录，统一跳转到登录页
    if (!isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      NProgress.done()
      return
    }

    // admin 超级管理员不允许访问 /user 下的任何页面，强制回到 admin 首页
    if (userRole === 'admin') {
      next({ name: 'Account' })
      NProgress.done()
      return
    }

    // 普通用户可以在 /user 下自由跳转
    next()
    return
  }

  // 如果普通用户已登录，检查是否访问管理员路由，如果是则立即重定向
  // 这必须在所有其他检查之前，避免加载 MainLayout
  if (isAuthenticated && userRole === 'user') {
    // 管理员专用路由路径（只检查根路径，不包括 /user 下的路径）
    const adminPaths = ['/account', '/introducer', '/bank-centre', '/admin']
    // 检查是否是管理员路径（排除 /user 开头的路径）
    const isAdminPath = !to.path.startsWith('/user') && adminPaths.some(path => to.path === path || to.path.startsWith(path + '/'))
    // 检查是否是管理员布局下的 /client 路径（不是 /user/client）
    const isAdminClientPath = to.path === '/client' || (to.path.startsWith('/client/') && !to.path.startsWith('/user/client'))
    
    // 如果访问根路径或管理员路由，重定向到用户页面
    if (to.path === '/' || isAdminPath || isAdminClientPath) {
      next({ name: 'UserClient' })
      NProgress.done()
      return
    }
  }

  // 如果访问根路径，根据角色重定向（普通用户已经在上面处理了）
  if (to.path === '/' && isAuthenticated && userRole === 'admin') {
    next({ name: 'Account' })
    NProgress.done()
    return
  }

  // 检查角色权限（非 /user 路由）
  // 对于管理员布局下的路由，如果用户是管理员，允许自由跳转
  // 权限检查主要用于阻止普通用户访问管理员路由
  if (requiresAuth && to.meta.roles) {
    const allowedRoles = to.meta.roles as string[]
    
    // 如果用户有权限，直接通过，允许自由跳转
    if (userRole && allowedRoles.includes(userRole)) {
      next()
      return
    }
    
    // 没有权限，根据角色重定向
    // 但要避免循环重定向：如果目标路由就是重定向目标，直接允许通过
    if (userRole === 'admin') {
      // 如果目标已经是 Account，避免循环
      if (to.name === 'Account' || to.path === '/account') {
        next()
        return
      }
      next({ name: 'Account' })
    } else {
      // 普通用户重定向到 UserClient
      // 如果目标已经是 UserClient，避免循环
      if (to.name === 'UserClient' || to.path === '/user/client') {
        next()
        return
      }
      next({ name: 'UserClient' })
    }
    NProgress.done()
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
