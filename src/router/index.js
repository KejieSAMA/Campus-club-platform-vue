import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// 路由配置
const routes = [
  // 公开路由
  { path: '/', component: () => import('../views/Home.vue') },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  
  // 需要认证的路由
  { path: '/clubs', component: () => import('../views/Clubs.vue'), meta: { requiresAuth: true } },
  { path: '/events', component: () => import('../views/Events.vue'), meta: { requiresAuth: true } },
  { path: '/messages', component: () => import('../views/Messages.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/user/:id', component: () => import('../views/UserProfile.vue'), meta: { requiresAuth: true } },
  
  // 社团相关路由
  { path: '/club/:id/forum', component: () => import('../views/ClubForum.vue'), meta: { requiresAuth: true } },
  { path: '/club/:id/post/:postId', component: () => import('../views/PostDetail.vue'), meta: { requiresAuth: true } },
  { path: '/club/:id/admin', component: () => import('../views/ClubAdmin.vue'), meta: { requiresAuth: true, clubOwnerOnly: true } },
  
  // 管理员路由
  {
    path: '/admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('../views/admin/Dashboard.vue') },
      { path: 'users', component: () => import('../views/admin/Users.vue') },
      { path: 'clubs', component: () => import('../views/admin/Clubs.vue') },
      { path: 'operations', component: () => import('../views/admin/Operations.vue') },
      { path: 'settings', component: () => import('../views/admin/Settings.vue') }
    ]
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const isAuthed = !!auth.token
  
  // 如果已登录但用户信息未加载，先获取用户信息
  if (isAuthed && !auth.user) {
    try {
      await auth.fetchProfile()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      auth.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
  
  const isAdmin = auth.user && auth.user.role === 'admin'
  
  // 检查是否需要认证
  if (!isAuthed && to.meta && to.meta.requiresAuth) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  
  // 已登录用户访问登录/注册页面，重定向到首页
  if (isAuthed && (to.path === '/login' || to.path === '/register')) {
    return { path: '/' }
  }
  
  // 检查管理员权限
  if (to.meta && to.meta.adminOnly && !isAdmin) {
    return { path: '/' }
  }
  
  // 检查社团团长权限
  if (to.meta && to.meta.clubOwnerOnly) {
    const clubId = to.params.id
    if (clubId) {
      try {
        const response = await fetch(`/api/clubs/${clubId}/membership`, {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        })
        const data = await response.json()
        if (!data.isMember || data.role !== 'owner') {
          return { path: `/club/${clubId}/forum` }
        }
      } catch (error) {
        console.error('检查社团权限失败:', error)
        return { path: `/club/${clubId}/forum` }
      }
    }
  }
})

export default router
