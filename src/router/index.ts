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
        path: 'introducer',
        name: 'Introducer',
        component: () => import('@/views/admin/Account.vue'), // TODO: 创建 Introducer 页面
        meta: { 
          requiresAuth: true,
          title: '介绍人管理',
          roles: ['admin']
        }
      },
      {
        path: 'bank-centre',
        name: 'BankCentre',
        component: () => import('@/views/admin/Account.vue'), // TODO: 创建 Bank & Centre 页面
        meta: { 
          requiresAuth: true,
          title: '银行与中心',
          roles: ['admin']
        }
      },
      // 普通用户路由
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

  // 如果路由需要认证但用户未登录
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    NProgress.done()
    return
  }

  // 如果已登录用户访问登录页，重定向到账户列表页
  if (to.name === 'Login' && isAuthenticated) {
    const userRole = authStore.user?.role
    if (userRole === 'admin') {
      next({ name: 'Account' })
    } else {
      next({ name: 'Tasks' })
    }
    NProgress.done()
    return
  }

  // 检查角色权限
  if (requiresAuth && to.meta.roles) {
    const userRole = authStore.user?.role
    const allowedRoles = to.meta.roles as string[]
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // 没有权限，根据角色重定向
      if (userRole === 'admin') {
        next({ name: 'Account' })
      } else {
        next({ name: 'Tasks' })
      }
      NProgress.done()
      return
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
