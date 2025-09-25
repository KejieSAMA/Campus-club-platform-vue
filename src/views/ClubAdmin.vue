<template>
	<div class="club-admin-page">
		<div class="admin-header">
			<div class="header-content">
				<h1>{{ clubInfo?.name || '社团管理' }}</h1>
				<p class="subtitle">社团后台管理</p>
			</div>
			<div class="header-actions">
				<button class="back-btn" @click="goBack">
					← 返回论坛
				</button>
			</div>
		</div>

		<div class="admin-content">
			<!-- 统计信息 -->
			<div class="stats-section">
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-icon">👥</div>
						<div class="stat-content">
							<div class="stat-number">{{ stats.memberCount || 0 }}</div>
							<div class="stat-label">成员数量</div>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">📝</div>
						<div class="stat-content">
							<div class="stat-number">{{ stats.postCount || 0 }}</div>
							<div class="stat-label">主题帖</div>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">💬</div>
						<div class="stat-content">
							<div class="stat-number">{{ stats.replyCount || 0 }}</div>
							<div class="stat-label">回复数</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 管理功能 -->
			<div class="admin-tabs">
				<div class="tab-nav">
					<button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]"
						@click="activeTab = tab.key">
						{{ tab.label }}
					</button>
				</div>

				<div class="tab-content">
					<!-- 社团信息管理 -->
					<div v-if="activeTab === 'info'" class="tab-panel">
						<div class="panel-header">
							<h3>社团信息管理</h3>
						</div>
						<div class="form-section">
							<div class="form-group">
								<label>社团名称</label>
								<input v-model="clubForm.name" type="text" class="form-input" />
							</div>
							<div class="form-group">
								<label>社团简介</label>
								<textarea v-model="clubForm.description" class="form-textarea" rows="4"></textarea>
							</div>
							<div class="form-group">
								<label>封面图片URL</label>
								<input v-model="clubForm.cover" type="text" class="form-input" />
							</div>
							<div class="form-actions">
								<button class="btn-save" @click="updateClubInfo">
									保存修改
								</button>
							</div>
						</div>
					</div>

					<!-- 成员管理 -->
					<div v-if="activeTab === 'members'" class="tab-panel">
						<div class="panel-header">
							<h3>成员管理</h3>
							<button class="invite-btn" @click="openInviteModal">
								➕ 邀请成员
							</button>
						</div>
						<div class="members-list">
							<div v-for="member in members" :key="member.id" class="member-card">
								<div class="member-info">
									<div class="member-avatar">
										{{ (member.user?.nickname || member.user?.username ||
											'U').slice(0, 1).toUpperCase() }}
									</div>
									<div class="member-details">
										<div class="member-name">{{ member.user?.nickname || member.user?.username }}
										</div>
										<div class="member-role">{{ getRoleText(member.role) }}</div>
										<div class="member-joined">加入时间：{{ formatDate(member.joined_at) }}</div>
									</div>
								</div>
								<div class="member-actions" v-if="member.role !== 'owner'">
									<select v-model="member.newRole" class="role-select">
										<option value="member">普通成员</option>
										<option value="admin">管理员</option>
									</select>
									<button class="btn-update" @click="updateMemberRole(member)"
										:disabled="member.role === member.newRole">
										更新角色
									</button>
									<button class="btn-remove" @click="removeMember(member)">
										移除
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- 主题帖管理 -->
					<div v-if="activeTab === 'posts'" class="tab-panel">
						<div class="panel-header">
							<h3>主题帖管理</h3>
						</div>
						<div class="posts-list">
							<div v-for="post in posts" :key="post.id" class="post-card">
								<div class="post-header">
									<div class="post-title">{{ post.title }}</div>
									<div class="post-status">
										<span v-if="post.is_pinned" class="status-badge pinned">置顶</span>
										<span v-if="post.is_banned" class="status-badge banned">已封禁</span>
										<span v-if="post.status === 'deleted'" class="status-badge deleted">已删除</span>
									</div>
								</div>
								<div class="post-meta">
									<span>作者：{{ post.author?.nickname || post.author?.username }}</span>
									<span>时间：{{ formatDate(post.created_at) }}</span>
									<span>回复：{{ post.reply_count || 0 }}</span>
									<span>点赞：{{ post.like_count || 0 }}</span>
								</div>
								<div class="post-actions">
									<button v-if="post.status !== 'deleted'" class="btn-delete"
										@click="updatePostStatus(post, 'delete')">
										删除
									</button>
									<button v-if="!post.is_banned" class="btn-ban"
										@click="updatePostStatus(post, 'ban')">
										封禁
									</button>
									<button v-if="post.is_banned" class="btn-unban"
										@click="updatePostStatus(post, 'unban')">
										解封
									</button>
									<button v-if="!post.is_pinned" class="btn-pin"
										@click="updatePostStatus(post, 'pin')">
										置顶
									</button>
									<button v-if="post.is_pinned" class="btn-unpin"
										@click="updatePostStatus(post, 'unpin')">
										取消置顶
									</button>
									<button v-if="post.status === 'deleted'" class="btn-restore"
										@click="updatePostStatus(post, 'restore')">
										恢复
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- 活动管理 -->
					<div v-if="activeTab === 'activities'" class="tab-panel">
						<div class="panel-header">
							<h3>活动管理</h3>
							<button class="create-activity-btn" @click="openActivityModal">
								创建活动
							</button>
						</div>
						<div class="activities-list">
							<div v-for="activity in activities" :key="activity.id" class="activity-card">
								<div class="activity-header">
									<div class="activity-title">{{ activity.title }}</div>
									<div class="activity-status">
										<span :class="['status-badge', getActivityStatus(activity)]">
											{{ getActivityStatusText(getActivityStatus(activity)) }}
										</span>
									</div>
								</div>
								<div class="activity-content">
									<div class="activity-description">{{ activity.content }}</div>
									<div class="activity-meta">
										<div class="meta-item">
											<span class="meta-label">开始时间：</span>
											<span class="meta-value">{{ formatDateTime(activity.start_time) }}</span>
										</div>
										<div class="meta-item">
											<span class="meta-label">结束时间：</span>
											<span class="meta-value">{{ formatDateTime(activity.end_time) }}</span>
										</div>
										<div class="meta-item">
											<span class="meta-label">地点：</span>
											<span class="meta-value">{{ activity.location }}</span>
										</div>
										<div class="meta-item">
											<span class="meta-label">报名人数：</span>
											<span class="meta-value">{{ activity.signup_count || 0 }} 人</span>
										</div>
									</div>
									<div class="activity-actions">
										<button class="btn-edit" @click="editActivity(activity)">
											编辑
										</button>
										<button class="btn-delete" @click="deleteActivity(activity.id)">
											删除
										</button>
									</div>
								</div>
							</div>
							<div v-if="activities.length === 0" class="empty-activities">
								<div class="empty-icon">📅</div>
								<div class="empty-text">暂无活动</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 邀请成员模态框 -->
		<div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
			<div class="modal-content" @click.stop>
				<div class="modal-header">
					<h3>邀请成员加入社团</h3>
					<button class="close-btn" @click="closeInviteModal">×</button>
				</div>
				<div class="modal-body">
					<div class="search-section">
						<div class="search-input-wrapper">
							<input v-model="searchQuery" @input="searchUsers" placeholder="搜索用户名或昵称..."
								class="search-input" />
							<div class="search-icon">🔍</div>
						</div>
					</div>
					<div class="search-results">
						<div v-if="searching" class="loading">搜索中...</div>
						<div v-else-if="searchResults.length === 0 && searchQuery" class="no-results">
							未找到匹配的用户
						</div>
						<div v-else-if="searchResults.length > 0" class="users-list">
							<div v-for="user in searchResults" :key="user.id" class="user-item">
								<div class="user-info">
									<div class="user-avatar">
										{{ (user.nickname || user.username || 'U').slice(0, 1).toUpperCase() }}
									</div>
									<div class="user-details">
										<div class="user-name">{{ user.nickname || user.username }}</div>
										<div class="user-id">ID: {{ user.id }}</div>
									</div>
								</div>
								<button class="invite-user-btn" @click="sendInvitation(user)"
									:disabled="invitingUsers.has(user.id)">
									{{ invitingUsers.has(user.id) ? '邀请中...' : '邀请' }}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 创建活动模态框 -->
		<div v-if="showActivityModal" class="modal-overlay" @click="closeActivityModal">
			<div class="modal-content" @click.stop>
				<div class="modal-header">
					<h3>创建新活动</h3>
					<button class="close-btn" @click="closeActivityModal">×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>活动标题</label>
						<input v-model="activityForm.title" type="text" placeholder="请输入活动标题" />
					</div>
					<div class="form-group">
						<label>活动描述</label>
						<textarea v-model="activityForm.content" placeholder="请输入活动描述"></textarea>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>开始时间</label>
							<input v-model="activityForm.start_time" type="datetime-local" />
						</div>
						<div class="form-group">
							<label>结束时间</label>
							<input v-model="activityForm.end_time" type="datetime-local" />
						</div>
					</div>
					<div class="form-group">
						<label>活动地点</label>
						<input v-model="activityForm.location" type="text" placeholder="请输入活动地点" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-primary" @click="createActivity">创建活动</button>
				</div>
			</div>
		</div>

		<!-- 编辑活动模态框 -->
		<div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
			<div class="modal-content" @click.stop>
				<div class="modal-header">
					<h3>编辑活动</h3>
					<button class="close-btn" @click="closeEditModal">×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>活动标题</label>
						<input v-model="editForm.title" type="text" placeholder="请输入活动标题" />
					</div>
					<div class="form-group">
						<label>活动描述</label>
						<textarea v-model="editForm.content" placeholder="请输入活动描述"></textarea>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>开始时间</label>
							<input v-model="editForm.start_time" type="datetime-local" />
						</div>
						<div class="form-group">
							<label>结束时间</label>
							<input v-model="editForm.end_time" type="datetime-local" />
						</div>
					</div>
					<div class="form-group">
						<label>活动地点</label>
						<input v-model="editForm.location" type="text" placeholder="请输入活动地点" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-primary" @click="updateActivity">保存修改</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'

const route = useRoute()
const router = useRouter()
const clubId = route.params.id

const clubInfo = ref(null)
const stats = ref({})
const members = ref([])
const posts = ref([])
const activeTab = ref('info')

const clubForm = ref({
	name: '',
	description: '',
	cover: ''
})

// 邀请相关状态
const showInviteModal = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const invitingUsers = ref(new Set())
let searchTimeout = null

// 活动管理相关
const activities = ref([])
const showActivityModal = ref(false)
const activityForm = ref({
	title: '',
	content: '',
	start_time: '',
	end_time: '',
	location: ''
})

// 编辑活动相关
const showEditModal = ref(false)
const editForm = ref({
	id: null,
	title: '',
	content: '',
	start_time: '',
	end_time: '',
	location: ''
})

const tabs = [
	{ key: 'info', label: '社团信息' },
	{ key: 'members', label: '成员管理' },
	{ key: 'posts', label: '主题帖管理' },
	{ key: 'activities', label: '活动管理' }
]

async function loadClubInfo() {
	try {
		const { data } = await http.get(`/club-admin/${clubId}/info`)
		clubInfo.value = data.club
		clubForm.value = {
			name: data.club.name,
			description: data.club.description,
			cover: data.club.cover
		}
	} catch (error) {
		console.error('Failed to load club info:', error)
		alert('加载社团信息失败：' + (error.response?.data?.message || error.message))
	}
}

// 活动管理函数
async function loadActivities() {
	try {
		const { data } = await http.get(`/club-admin/${clubId}/activities`)
		activities.value = data.activities || []
	} catch (error) {
		console.error('Failed to load activities:', error)
	}
}

function openActivityModal() {
	showActivityModal.value = true
}

function closeActivityModal() {
	showActivityModal.value = false
	activityForm.value = {
		title: '',
		content: '',
		start_time: '',
		end_time: '',
		location: ''
	}
}

async function createActivity() {
	try {
		await http.post(`/club-admin/${clubId}/activities`, activityForm.value)
		closeActivityModal()
		await loadActivities()
		alert('活动创建成功')
	} catch (error) {
		console.error('Failed to create activity:', error)
		alert('活动创建失败：' + (error.response?.data?.message || error.message))
	}
}

async function deleteActivity(activityId) {
	try {
		await http.delete(`/club-admin/${clubId}/activities/${activityId}`)
		await loadActivities()
		alert('活动删除成功')
	} catch (error) {
		console.error('Failed to delete activity:', error)
		alert('活动删除失败：' + (error.response?.data?.message || error.message))
	}
}

// 编辑活动相关函数
function editActivity(activity) {
	editForm.value = {
		id: activity.id,
		title: activity.title,
		content: activity.content || '',
		start_time: formatDateTimeForInput(activity.start_time),
		end_time: formatDateTimeForInput(activity.end_time),
		location: activity.location || ''
	}
	showEditModal.value = true
}

function closeEditModal() {
	showEditModal.value = false
	editForm.value = {
		id: null,
		title: '',
		content: '',
		start_time: '',
		end_time: '',
		location: ''
	}
}

async function updateActivity() {
	try {
		await http.put(`/club-admin/${clubId}/activities/${editForm.value.id}`, {
			title: editForm.value.title,
			content: editForm.value.content,
			start_time: editForm.value.start_time,
			end_time: editForm.value.end_time,
			location: editForm.value.location
		})
		closeEditModal()
		await loadActivities()
		alert('活动更新成功')
	} catch (error) {
		console.error('Failed to update activity:', error)
		alert('活动更新失败：' + (error.response?.data?.message || error.message))
	}
}

function formatDateTimeForInput(dateTime) {
	const date = new Date(dateTime)
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getActivityStatus(activity) {
	const now = new Date()
	const startTime = new Date(activity.start_time)
	const endTime = new Date(activity.end_time)

	if (now < startTime) return 'upcoming'
	if (now >= startTime && now <= endTime) return 'ongoing'
	return 'ended'
}

function getActivityStatusText(status) {
	const statusMap = {
		upcoming: '即将开始',
		ongoing: '进行中',
		ended: '已结束'
	}
	return statusMap[status] || '未知'
}

function formatDateTime(dateTime) {
	return new Date(dateTime).toLocaleString('zh-CN')
}

async function loadStats() {
	try {
		const { data } = await http.get(`/club-admin/${clubId}/stats`)
		stats.value = data.stats
	} catch (error) {
		console.error('Failed to load stats:', error)
	}
}

async function loadMembers() {
	try {
		const { data } = await http.get(`/club-admin/${clubId}/members`)
		members.value = data.members.map(member => ({
			...member,
			newRole: member.role
		}))
	} catch (error) {
		console.error('Failed to load members:', error)
	}
}

async function loadPosts() {
	try {
		const { data } = await http.get(`/club-admin/${clubId}/posts`)
		posts.value = data.posts
	} catch (error) {
		console.error('Failed to load posts:', error)
	}
}

async function updateClubInfo() {
	try {
		await http.put(`/club-admin/${clubId}/info`, clubForm.value)
		alert('社团信息更新成功！')
		await loadClubInfo()
	} catch (error) {
		console.error('Failed to update club info:', error)
		alert('更新失败：' + (error.response?.data?.message || error.message))
	}
}

async function updateMemberRole(member) {
	try {
		await http.put(`/club-admin/${clubId}/members/${member.user.id}/role`, {
			role: member.newRole
		})
		alert('成员角色更新成功！')
		await loadMembers()
	} catch (error) {
		console.error('Failed to update member role:', error)
		alert('更新失败：' + (error.response?.data?.message || error.message))
	}
}

async function removeMember(member) {
	if (!confirm(`确定要移除成员 ${member.user?.nickname || member.user?.username} 吗？`)) {
		return
	}

	try {
		await http.delete(`/club-admin/${clubId}/members/${member.user.id}`)
		alert('成员移除成功！')
		await loadMembers()
		await loadStats()
	} catch (error) {
		console.error('Failed to remove member:', error)
		alert('移除失败：' + (error.response?.data?.message || error.message))
	}
}

async function updatePostStatus(post, action) {
	try {
		await http.put(`/club-admin/${clubId}/posts/${post.id}/status`, { action })
		alert('帖子状态更新成功！')
		await loadPosts()
	} catch (error) {
		console.error('Failed to update post status:', error)
		alert('更新失败：' + (error.response?.data?.message || error.message))
	}
}

function getRoleText(role) {
	const roleMap = {
		owner: '团长',
		admin: '管理员',
		member: '成员'
	}
	return roleMap[role] || role
}

function getStatusText(status) {
	const statusMap = {
		active: '正常',
		deleted: '已删除',
		banned: '已封禁',
		pinned: '已置顶'
	}
	return statusMap[status] || status
}

function formatDate(dateString) {
	if (!dateString) return '未知'
	return new Date(dateString).toLocaleString('zh-CN')
}

function goBack() {
	router.push(`/club/${clubId}/forum`)
}

// 邀请相关方法
function openInviteModal() {
	showInviteModal.value = true
	searchQuery.value = ''
	searchResults.value = []
}

function closeInviteModal() {
	showInviteModal.value = false
	searchQuery.value = ''
	searchResults.value = []
	invitingUsers.value.clear()
	// 清理搜索定时器
	if (searchTimeout) {
		clearTimeout(searchTimeout)
		searchTimeout = null
	}
}

async function searchUsers() {
	// 清除之前的定时器
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}

	// 如果搜索框为空，立即清空结果
	if (!searchQuery.value.trim()) {
		searchResults.value = []
		return
	}

	// 设置防抖延迟
	searchTimeout = setTimeout(async () => {
		searching.value = true
		try {
			const { data } = await http.get('/invitation/search', {
				params: { q: searchQuery.value, clubId }
			})
			searchResults.value = data.users || []
		} catch (error) {
			console.error('搜索用户失败:', error)
			searchResults.value = []
		} finally {
			searching.value = false
		}
	}, 300) // 300ms防抖延迟
}

async function sendInvitation(user) {
	invitingUsers.value.add(user.id)
	try {
		await http.post('/invitation/send', {
			clubId,
			inviteeId: user.id,
			message: `邀请您加入社团 "${clubInfo.value?.name}"`
		})
		alert('邀请发送成功！')
		// 从搜索结果中移除已邀请的用户
		searchResults.value = searchResults.value.filter(u => u.id !== user.id)
	} catch (error) {
		console.error('发送邀请失败:', error)
		alert('邀请发送失败：' + (error.response?.data?.message || error.message))
	} finally {
		invitingUsers.value.delete(user.id)
	}
}

onMounted(async () => {
	await Promise.all([
		loadClubInfo(),
		loadStats(),
		loadMembers(),
		loadPosts(),
		loadActivities()
	])
})
</script>

<style scoped>
.club-admin-page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	background: #f8fafc;
	min-height: 100vh;
}

.admin-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16px;
	color: white;
}

.header-content h1 {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
}

.subtitle {
	margin: 8px 0 0;
	opacity: 0.9;
	font-size: 16px;
}

.back-btn {
	padding: 12px 24px;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s;
}

.back-btn:hover {
	background: rgba(255, 255, 255, 0.3);
}

.admin-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stats-section {
	margin-bottom: 32px;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.stat-card {
	display: flex;
	align-items: center;
	padding: 20px;
	background: #f8fafc;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
}

.stat-icon {
	font-size: 32px;
	margin-right: 16px;
}

.stat-number {
	font-size: 24px;
	font-weight: 700;
	color: #1e293b;
}

.stat-label {
	font-size: 14px;
	color: #64748b;
}

.admin-tabs {
	margin-top: 24px;
}

.tab-nav {
	display: flex;
	border-bottom: 1px solid #e2e8f0;
	margin-bottom: 24px;
}

.tab-btn {
	padding: 12px 24px;
	background: none;
	border: none;
	border-bottom: 2px solid transparent;
	cursor: pointer;
	font-weight: 500;
	color: #64748b;
	transition: all 0.2s;
}

.tab-btn.active {
	color: #3b82f6;
	border-bottom-color: #3b82f6;
}

.tab-panel {
	min-height: 400px;
}

.panel-header {
	margin-bottom: 24px;
}

.panel-header h3 {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	color: #1e293b;
}

.form-section {
	max-width: 600px;
}

.form-group {
	margin-bottom: 20px;
}

.form-group label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	color: #374151;
}

.form-input,
.form-textarea {
	width: 100%;
	padding: 12px 16px;
	border: 2px solid #e5e7eb;
	border-radius: 8px;
	font-size: 14px;
	transition: all 0.2s;
	box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
	resize: vertical;
	min-height: 100px;
}

.form-actions {
	margin-top: 24px;
}

.btn-save {
	padding: 12px 24px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.2s;
}

.btn-save:hover {
	background: #2563eb;
}

.members-list,
.posts-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.member-card,
.post-card {
	padding: 20px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
}

.member-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.member-info {
	display: flex;
	align-items: center;
	gap: 16px;
}

.member-avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 18px;
}

.member-name {
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 4px;
}

.member-role {
	font-size: 14px;
	color: #3b82f6;
	margin-bottom: 4px;
}

.member-joined {
	font-size: 12px;
	color: #64748b;
}

.member-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.role-select {
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
}

.btn-update,
.btn-remove {
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s;
}

.btn-update {
	background: #3b82f6;
	color: white;
}

.btn-update:hover:not(:disabled) {
	background: #2563eb;
}

.btn-update:disabled {
	background: #9ca3af;
	cursor: not-allowed;
}

.btn-remove {
	background: #ef4444;
	color: white;
}

.btn-remove:hover {
	background: #dc2626;
}

.post-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.post-title {
	font-size: 18px;
	font-weight: 600;
	color: #1e293b;
}

.status-badge {
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.active {
	background: #dcfce7;
	color: #166534;
}

.status-badge.deleted {
	background: #fee2e2;
	color: #dc2626;
}

.status-badge.banned {
	background: #fef3c7;
	color: #d97706;
}

.status-badge.pinned {
	background: #dbeafe;
	color: #2563eb;
}

.post-meta {
	display: flex;
	gap: 16px;
	margin-bottom: 16px;
	font-size: 14px;
	color: #64748b;
}

.post-actions {
	display: flex;
	gap: 8px;
}

.btn-delete,
.btn-edit,
.btn-ban,
.btn-pin,
.btn-restore,
.btn-unban,
.btn-unpin {
	padding: 8px 16px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	transition: all 0.2s;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-delete {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
}

.btn-edit {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
}

.btn-ban {
	background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
	color: white;
}

.btn-pin {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
}

.btn-unban {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
}

.btn-unpin {
	background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
	color: white;
}

.btn-restore {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
}

.btn-delete:hover,
.btn-edit:hover,
.btn-ban:hover,
.btn-unban:hover,
.btn-pin:hover,
.btn-unpin:hover,
.btn-restore:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 邀请模态框样式 */
.invite-btn {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.invite-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	border-radius: 12px;
	width: 90%;
	max-width: 500px;
	max-height: 80vh;
	overflow: hidden;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
}

.close-btn {
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #6b7280;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	transition: all 0.2s;
}

.close-btn:hover {
	background: #f3f4f6;
	color: #374151;
}

.modal-body {
	padding: 20px;
}

.search-section {
	margin-bottom: 20px;
}

.search-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}

.search-input {
	width: 100%;
	padding: 12px 40px 12px 16px;
	border: 2px solid #e5e7eb;
	border-radius: 8px;
	font-size: 14px;
	transition: all 0.2s ease;
	background: #ffffff;
	box-sizing: border-box;
}

.search-input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	background: #fafbff;
}

.search-input:hover {
	border-color: #9ca3af;
}

.search-input::placeholder {
	color: #9ca3af;
	font-size: 14px;
}

.search-icon {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	font-size: 16px;
	color: #9ca3af;
	pointer-events: none;
	transition: color 0.2s ease;
}

.search-input:focus+.search-icon {
	color: #3b82f6;
}

.search-results {
	max-height: 300px;
	overflow-y: auto;
}

.loading,
.no-results {
	text-align: center;
	padding: 20px;
	color: #6b7280;
	font-size: 14px;
}

.users-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.user-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e5e7eb;
}

.user-info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 16px;
}

.user-details {
	display: flex;
	flex-direction: column;
}

.user-name {
	font-weight: 600;
	color: #1f2937;
	font-size: 14px;
}

.user-id {
	font-size: 12px;
	color: #6b7280;
}

.invite-user-btn {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	transition: all 0.2s;
}

.invite-user-btn:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.invite-user-btn:disabled {
	background: #d1d5db;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

/* 活动管理样式 */
.create-activity-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	padding: 12px 24px;
	border-radius: 10px;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s ease;
	box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.create-activity-btn:hover {
	transform: translateY(-3px);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.activities-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.activity-card {
	background: white;
	border-radius: 12px;
	padding: 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	transition: all 0.2s;
}

.activity-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.activity-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.activity-title {
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
}

.activity-status {
	display: flex;
	align-items: center;
}

.status-badge {
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.upcoming {
	background: #dbeafe;
	color: #1d4ed8;
}

.status-badge.ongoing {
	background: #dcfce7;
	color: #16a34a;
}

.status-badge.ended {
	background: #f3f4f6;
	color: #6b7280;
}

.activity-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.activity-description {
	color: #4b5563;
	line-height: 1.5;
}

.activity-meta {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 8px;
}

.meta-label {
	font-weight: 500;
	color: #6b7280;
	font-size: 14px;
	min-width: 80px;
}

.meta-value {
	color: #1f2937;
	font-size: 14px;
}

.activity-actions {
	display: flex;
	gap: 8px;
	margin-top: 12px;
}

.empty-activities {
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
}

.empty-text {
	font-size: 16px;
	font-weight: 500;
}

.form-row {
	display: flex;
	gap: 12px;
	margin-bottom: 0;
}

.form-row .form-group {
	flex: 1;
	margin-bottom: 0;
}

.form-row .form-group input {
	width: 100%;
}

/* 创建活动模态框美化 */
.modal-overlay {
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4px);
}

.modal-content {
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.2);
	max-width: 520px;
	width: 90%;
	max-height: 90vh;
	overflow-y: auto;
	animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
	from {
		opacity: 0;
		transform: translateY(-20px) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.modal-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 20px 24px;
	border-radius: 16px 16px 0 0;
	position: relative;
}

.modal-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
}

.close-btn {
	position: absolute;
	top: 16px;
	right: 20px;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	cursor: pointer;
	font-size: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.close-btn:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: scale(1.1);
}

.modal-body {
	padding: 24px 20px;
}

.form-group {
	margin-bottom: 20px;
}

.form-group label {
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	color: #374151;
	font-size: 14px;
}

.form-group input,
.form-group textarea {
	width: 100%;
	padding: 12px 16px;
	border: 2px solid #e5e7eb;
	border-radius: 10px;
	font-size: 14px;
	transition: all 0.2s;
	background: #fafafa;
	box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
	outline: none;
	border-color: #667eea;
	background: white;
	box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
	resize: vertical;
	min-height: 80px;
	font-family: inherit;
}

.modal-footer {
	padding: 20px;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
	border-radius: 0 0 16px 16px;
	display: flex;
	justify-content: center;
}

.btn-primary {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	padding: 12px 32px;
	border-radius: 10px;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s ease;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	min-width: 120px;
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.btn-primary:active {
	transform: translateY(0);
	box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
</style>
