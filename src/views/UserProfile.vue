<template>
  <div class="user-profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">← 返回</button>
        <h1>个人主页</h1>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <div class="user-info-card" v-if="userInfo">
      <div class="user-avatar-large">
        {{ (userInfo.nickname || userInfo.username || 'U').slice(0, 1).toUpperCase() }}
      </div>
      <div class="user-details">
        <div class="user-name">{{ userInfo.nickname || userInfo.username }}</div>
        <div class="user-role">{{ getRoleText(userInfo.role) }}</div>
        <div class="user-signature" v-if="userInfo.signature">{{ userInfo.signature }}</div>
        <div class="user-meta">
          <span v-if="userInfo.gender" class="meta-item">
            <span class="meta-icon">👤</span>
            {{ getGenderText(userInfo.gender) }}
          </span>
          <span v-if="userInfo.birthdate" class="meta-item">
            <span class="meta-icon">🎂</span>
            {{ formatDate(userInfo.birthdate) }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">📅</span>
            {{ formatDate(userInfo.created_at) }} 加入
          </span>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section" v-if="userInfo">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.clubCount || 0 }}</div>
            <div class="stat-label">加入社团</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.postCount || 0 }}</div>
            <div class="stat-label">发布帖子</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.replyCount || 0 }}</div>
            <div class="stat-label">回复数量</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 社团信息 -->
    <div class="clubs-section" v-if="userClubs && userClubs.length > 0">
      <div class="section-header">
        <h3>加入的社团</h3>
      </div>
      <div class="clubs-grid">
        <div v-for="club in userClubs" :key="club.id" class="club-card">
          <div class="club-cover" v-if="club.cover">
            <img :src="club.cover" :alt="club.name" />
          </div>
          <div class="club-info">
            <div class="club-name">{{ club.name }}</div>
            <div class="club-description">{{ club.description }}</div>
            <div class="club-role">{{ getClubRoleText(club.role) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近帖子 -->
    <div class="posts-section" v-if="userPosts && userPosts.length > 0">
      <div class="section-header">
        <h3>最近发布的帖子</h3>
      </div>
      <div class="posts-list">
        <div v-for="post in userPosts" :key="post.id" class="post-card" @click="goToPost(post.club_id, post.id)">
          <div class="post-header">
            <div class="post-title">{{ post.title }}</div>
            <div class="post-club">来自：{{ post.club?.name }}</div>
          </div>
          <div class="post-content">{{ post.content }}</div>
          <div class="post-meta">
            <span class="post-time">{{ formatDateTime(post.created_at || post.createdAt) }}</span>
            <span class="post-stats">
              <span>👁 {{ post.view_count || 0 }}</span>
              <span>💬 {{ post.reply_count || 0 }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!userInfo" class="empty-state">
      <div class="empty-icon">👤</div>
      <p>用户信息加载中...</p>
    </div>

    <div v-if="userInfo && (!userClubs || userClubs.length === 0) && (!userPosts || userPosts.length === 0)"
      class="empty-state">
      <div class="empty-icon">📝</div>
      <p>该用户还没有发布任何内容</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'

const route = useRoute()
const router = useRouter()
const userId = route.params.id

const userInfo = ref(null)
const userStats = ref({})
const userClubs = ref([])
const userPosts = ref([])

// 加载用户信息
async function loadUserInfo() {
  try {
    console.log('Loading user info for ID:', userId)
    const { data } = await http.get(`/user/${userId}`)
    console.log('User info response:', data)
    userInfo.value = data.user
    userStats.value = data.stats || {}
    userClubs.value = data.clubs || []
    userPosts.value = data.posts || []
  } catch (error) {
    console.error('Failed to load user info:', error)
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    alert('加载用户信息失败：' + (error.response?.data?.message || error.message))
  }
}

// 加载用户社团信息
async function loadUserClubs() {
  try {
    const { data } = await http.get(`/user/${userId}/clubs`)
    userClubs.value = data.clubs || []
  } catch (error) {
    console.error('Failed to load user clubs:', error)
  }
}

// 加载用户帖子
async function loadUserPosts() {
  try {
    const { data } = await http.get(`/user/${userId}/posts`)
    userPosts.value = data.posts || []
  } catch (error) {
    console.error('Failed to load user posts:', error)
  }
}

// 获取角色文本
function getRoleText(role) {
  const roleMap = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  }
  return roleMap[role] || '未知'
}

// 获取性别文本
function getGenderText(gender) {
  const genderMap = {
    'male': '男',
    'female': '女',
    'other': '其他'
  }
  return genderMap[gender] || '未知'
}

// 获取社团角色文本
function getClubRoleText(role) {
  const roleMap = {
    'owner': '团长',
    'manager': '管理员',
    'member': '成员'
  }
  return roleMap[role] || '成员'
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化日期时间
function formatDateTime(dateString) {
  if (!dateString) {
    return '未知'
  }

  try {
    const date = new Date(dateString)

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期'
    }

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('formatDateTime error:', error, '输入:', dateString)
    return '格式错误'
  }
}

// 跳转到帖子详情页
function goToPost(clubId, postId) {
  if (clubId && postId) {
    router.push(`/club/${clubId}/post/${postId}`)
  }
}

// 返回上一页
function goBack() {
  router.go(-1)
}

onMounted(async () => {
  await loadUserInfo()
})
</script>

<style scoped>
.user-profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.user-info-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 32px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.user-role {
  font-size: 16px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 12px;
}

.user-signature {
  font-size: 16px;
  color: #64748b;
  font-style: italic;
  margin-bottom: 16px;
  line-height: 1.5;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.meta-icon {
  font-size: 16px;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.clubs-section,
.posts-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.club-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.club-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.club-cover {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.club-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.club-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.club-role {
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  cursor: pointer;
}

.post-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.post-club {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 12px;
}

.post-content {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #94a3b8;
}

.post-stats {
  display: flex;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .user-profile-page {
    padding: 16px;
  }

  .user-info-card {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .clubs-grid {
    grid-template-columns: 1fr;
  }

  .post-header {
    flex-direction: column;
    gap: 8px;
  }

  .post-club {
    margin-left: 0;
  }
}
</style>
