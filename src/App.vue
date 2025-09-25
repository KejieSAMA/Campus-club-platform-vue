<template>
  <div>
    <header class="topbar">
      <div class="brand">
        <div class="logo">CC</div>
        <span class="title">校园社团平台</span>
      </div>
      
      <nav class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link to="/clubs">社团</router-link>
        <router-link to="/events">活动</router-link>
        <router-link to="/messages" class="nav-link-with-badge">
          消息
          <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
        </router-link>
        <router-link v-if="authed" to="/profile">个人主页</router-link>
        <router-link v-if="isAdmin" to="/admin">管理后台</router-link>
      </nav>
      
      <div class="auth-actions">
        <template v-if="authed">
          <span class="hello">你好，{{ userName }}</span>
          <button class="btn-outline" @click="logout">退出</button>
        </template>
        <template v-else>
          <router-link class="btn-text" to="/login">登录</router-link>
          <router-link class="btn-primary" to="/register">注册</router-link>
        </template>
      </div>
    </header>
    
    <main class="page">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from './store/auth'
import { useRouter } from 'vue-router'
import http from './api/http'

// 状态管理
const auth = useAuthStore()
const router = useRouter()

// 计算属性
const authed = computed(() => !!auth.token)
const userName = computed(() => auth.user?.nickname || auth.user?.username || '用户')
const isAdmin = computed(() => auth.user?.role === 'admin')

// 未读消息数量
const unreadCount = ref(0)

/**
 * 获取未读消息数量
 * 包括邀请消息、主题消息和系统消息
 */
async function fetchUnreadCount() {
  if (!auth.token) return
  
  try {
    // 获取邀请消息未读数量
    const invitationResponse = await http.get('/invitation/received')
    const unreadInvitations = invitationResponse.data.invitations?.filter(inv => inv.status === 'pending').length || 0
    
    // 获取主题消息未读数量
    const topicResponse = await http.get('/topic-message/unread-count')
    const unreadTopics = topicResponse.data.count || 0
    
    // 获取系统消息未读数量
    const systemResponse = await http.get('/messages/list', {
      params: { type: 'system' }
    })
    const unreadSystem = systemResponse.data.messages?.filter(msg => !msg.is_read).length || 0
    
    unreadCount.value = unreadInvitations + unreadTopics + unreadSystem
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
    unreadCount.value = 0
  }
}

/**
 * 用户退出登录
 */
function logout() {
  auth.logout()
  router.push('/login')
}

// 组件挂载时的初始化
onMounted(async () => {
  // 如果已登录但用户信息未加载，获取用户信息
  if (auth.token && !auth.user) {
    await auth.fetchProfile().catch(() => {})
  }
  
  // 获取未读消息数量
  await fetchUnreadCount()
  
  // 每30秒刷新一次未读消息数量
  setInterval(fetchUnreadCount, 30000)
})
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 顶部导航栏 */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid #eef2f7;
}

/* 品牌标识 */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.title {
  font-weight: 600;
  color: #111827;
}

/* 导航链接 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
}

.nav-links a {
  color: #374151;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}

.nav-links a:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-links .router-link-active {
  background: #eef2ff;
  color: #4f46e5;
}

.nav-link-with-badge {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

/* 用户操作区域 */
.auth-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hello {
  color: #4b5563;
  font-size: 14px;
}

/* 按钮样式 */
.btn-outline {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  color: #374151;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.btn-outline:hover {
  border-color: #c7cad1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.btn-text {
  color: #374151;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
}

.btn-primary {
  text-decoration: none;
  padding: 8px 14px;
  background: #4f46e5;
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.18);
}

.btn-primary:hover {
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
}

/* 页面内容 */
.page {
  padding: 12px;
}
</style>
