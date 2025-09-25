<template>
	<div class="forum-page">
		<div class="forum-header">
			<div class="header-content">
				<h1>{{ clubInfo?.name || '社团论坛' }}</h1>
				<p class="subtitle">{{ clubInfo?.description || '社团成员交流讨论区' }}</p>
			</div>
			<div class="header-actions" v-if="isClubOwner">
				<button class="admin-btn" @click="goToAdmin">
					⚙️ 社团管理
				</button>
			</div>
		</div>

		<div class="forum-content">
			<!-- 活动分区 -->
			<div class="activities-section">
				<div class="section-header">
					<h2>🎯 社团活动</h2>
					<span class="section-count">{{ activities.length }} 个活动</span>
				</div>
				<div class="activities-list">
					<div v-for="activity in activities" :key="activity.id" class="activity-card">
						<div class="activity-header">
							<div class="activity-title">{{ activity.title }}</div>
							<div class="activity-status">
								<span :class="['status-badge', getActivityStatus(activity)]">
									{{ getActivityStatusText(activity) }}
								</span>
							</div>
						</div>
						<div class="activity-content">
							<div class="activity-description">{{ activity.description || '暂无描述' }}</div>
							<div class="activity-meta">
								<div class="meta-item">
									<span class="meta-label">开始时间</span>
									<span class="meta-value">{{ formatDateTime(activity.start_time) }}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">结束时间</span>
									<span class="meta-value">{{ formatDateTime(activity.end_time) }}</span>
								</div>
								<div class="meta-item" v-if="activity.location">
									<span class="meta-label">地点</span>
									<span class="meta-value">{{ activity.location }}</span>
								</div>
								<div class="meta-item" v-if="activity.max_participants">
									<span class="meta-label">最大参与人数</span>
									<span class="meta-value">{{ activity.max_participants }}人</span>
								</div>
							</div>
						</div>
						<div class="activity-actions">
							<button class="join-btn" @click="joinActivity(activity.id)">
								参与活动
							</button>
						</div>
					</div>
					<div v-if="activities.length === 0" class="empty-activities">
						<div class="empty-icon">🎯</div>
						<p>暂无活动</p>
					</div>
				</div>
			</div>

			<!-- 主题帖分区 -->
			<div class="posts-section">
				<div class="section-header">
					<h2>💬 主题讨论</h2>
					<span class="section-count">{{ posts.length }} 个主题</span>
				</div>
				<div class="posts-list">
					<div v-for="post in posts" :key="post.id" class="post-card">
						<div class="post-header">
							<div class="post-author">
								<div class="author-avatar">
									{{ (post.author?.nickname || post.author?.username || 'U').slice(0, 1).toUpperCase()
									}}
								</div>
								<div class="author-info">
									<div class="author-name">{{ post.author?.nickname || post.author?.username }}</div>
									<div class="post-time">{{ formatDate(post.created_at) }}</div>
								</div>
							</div>
							<div class="post-stats">
								<span class="view-count">👁 {{ post.view_count || 0 }} 浏览</span>
								<span class="reply-count">{{ post.reply_count || 0 }} 回复</span>
								<span class="like-count">👍 {{ post.like_count || 0 }} 点赞</span>
							</div>
						</div>
						<div class="post-content">
							<div class="post-title-row">
								<h3 class="post-title">{{ post.title }}</h3>
								<span v-if="isNewPost(post)" class="status-badge new">New</span>
								<span v-if="post.is_pinned" class="status-badge pinned">置顶</span>
								<span v-if="post.is_banned" class="status-badge banned">🚫 已封禁</span>
							</div>
							<p class="post-preview">{{ post.content }}</p>
						</div>
						<div class="post-actions">
							<button class="reply-btn" @click="viewPost(post.id)">
								查看详情
							</button>
						</div>
					</div>
					<div v-if="posts.length === 0" class="empty-state">
						<div class="empty-icon">💬</div>
						<h3>暂无主题帖</h3>
						<p v-if="isMember">快来发布第一个主题帖吧！</p>
						<p v-else>该社团还没有任何主题帖</p>
					</div>
				</div>
			</div>

			<!-- 底部发布区域 -->
			<div v-if="isMember" class="publish-section">
				<div class="publish-container">
					<div class="publish-header">
						<h3>发布新主题</h3>
						<p class="publish-tips">请遵守社区规范，发布有价值的内容</p>
					</div>
					<div class="publish-form">
						<div class="form-group">
							<input v-model="createForm.title" class="form-input" placeholder="请输入主题标题" />
						</div>
						<div class="form-group">
							<textarea v-model="createForm.content" class="form-textarea" rows="4"
								placeholder="请输入主题内容"></textarea>
						</div>
						<div class="form-actions">
							<button class="publish-btn" @click="submitPost">
								发布主题
							</button>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const clubId = route.params.id
const clubInfo = ref(null)
const posts = ref([])
const activities = ref([])
const createForm = ref({ title: '', content: '' })
const isMember = ref(false)
const isClubOwner = ref(false)

async function loadClubInfo() {
	try {
		const { data } = await http.get(`/clubs/${clubId}`)
		clubInfo.value = data.club
	} catch (error) {
		console.error('Failed to load club info:', error)
	}
}

async function loadPosts() {
	try {
		const { data } = await http.get(`/clubs/${clubId}/posts`)
		posts.value = data.posts || []
	} catch (error) {
		console.error('Failed to load posts:', error)
	}
}

async function loadActivities() {
	try {
		const { data } = await http.get(`/clubs/${clubId}/activities`)
		activities.value = data.activities || []
	} catch (error) {
		console.error('Failed to load activities:', error)
	}
}

async function checkMembership() {
	try {
		const { data } = await http.get(`/clubs/${clubId}/membership`)
		console.log('Membership check response:', data)

		// 社团团长（申请者）即使状态是pending也应该有管理权限
		if (data.role === 'owner') {
			isMember.value = true
			isClubOwner.value = true
		} else {
			// 普通成员需要已审批才能访问
			isMember.value = data.isMember && data.status === 'approved'
			isClubOwner.value = false
		}

		console.log('Is member:', isMember.value, 'Is club owner:', isClubOwner.value)
	} catch (error) {
		console.error('Failed to check membership:', error)
		isMember.value = false
		isClubOwner.value = false
	}
}

async function submitPost() {
	if (!createForm.value.title || !createForm.value.content) {
		alert('请填写标题和内容')
		return
	}

	try {
		await http.post(`/clubs/${clubId}/posts`, {
			title: createForm.value.title,
			content: createForm.value.content
		})
		alert('主题发布成功！')
		createForm.value = { title: '', content: '' }
		await loadPosts()
	} catch (error) {
		alert('发布失败：' + (error.response?.data?.message || error.message))
	}
}

function viewPost(postId) {
	// 跳转到主题详情页面
	router.push(`/club/${clubId}/post/${postId}`)
}

function goToAdmin() {
	// 跳转到社团管理页面
	router.push(`/club/${clubId}/admin`)
}

function formatDate(dateString) {
	if (!dateString) return '未知'
	return new Date(dateString).toLocaleString('zh-CN')
}

function isNewPost(post) {
	if (!post.created_at) return false

	const postTime = new Date(post.created_at)
	const now = new Date()
	const diffInHours = (now - postTime) / (1000 * 60 * 60) // 转换为小时

	return diffInHours <= 3 // 3小时内创建的帖子
}

// 活动状态判断方法
function getActivityStatus(activity) {
	const now = new Date()
	const startTime = new Date(activity.start_time)
	const endTime = new Date(activity.end_time)

	if (now < startTime) {
		return 'upcoming'
	} else if (now >= startTime && now <= endTime) {
		return 'ongoing'
	} else {
		return 'ended'
	}
}

function getActivityStatusText(activity) {
	const status = getActivityStatus(activity)
	switch (status) {
		case 'upcoming':
			return '即将开始'
		case 'ongoing':
			return '进行中'
		case 'ended':
			return '已结束'
		default:
			return '未知'
	}
}

function formatDateTime(dateString) {
	if (!dateString) return '未设置'
	return new Date(dateString).toLocaleString('zh-CN')
}

async function joinActivity(activityId) {
	try {
		await http.post(`/events/${activityId}/signup`)
		alert('报名成功！')
	} catch (error) {
		console.error('Failed to join activity:', error)
		alert('报名失败：' + (error.response?.data?.message || error.message))
	}
}

onMounted(async () => {
	await Promise.all([
		loadClubInfo(),
		loadPosts(),
		loadActivities(),
		checkMembership()
	])
})

// 页面显示时刷新数据
onActivated(async () => {
	await loadPosts()
})
</script>

<style scoped>
.forum-page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
}

.forum-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16px;
	color: white;
	display: flex;
	justify-content: space-between;
	align-items: center;
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

.admin-btn {
	padding: 12px 24px;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;
}

.admin-btn:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-1px);
}

.forum-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.posts-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.post-card {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 20px;
	transition: all 0.2s;
}

.post-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

.post-author {
	display: flex;
	align-items: center;
	gap: 12px;
}

.author-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 16px;
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-name {
	font-weight: 600;
	color: #1e293b;
}

.post-time {
	font-size: 12px;
	color: #64748b;
}

.post-stats {
	display: flex;
	align-items: center;
	gap: 16px;
}

.view-count {
	font-size: 14px;
	color: #64748b;
}

.reply-count {
	font-size: 14px;
	color: #64748b;
}

.like-count {
	font-size: 14px;
	color: #64748b;
}

.post-content {
	margin-bottom: 16px;
}

.post-title-row {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
}

.post-title {
	margin: 0;
	font-size: 18px;
	font-weight: 700;
	color: #1e293b;
}

.post-preview {
	margin: 0;
	color: #64748b;
	line-height: 1.6;
}

.status-badge {
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.pinned {
	background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	color: white;
	font-weight: 700;
	font-size: 13px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
	border: 1px solid #f59e0b;
}

.status-badge.banned {
	background: #fee2e2;
	color: #dc2626;
}

.status-badge.new {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	font-weight: 700;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
	border: 1px solid #059669;
	animation: pulse 2s infinite;
}

@keyframes pulse {

	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.8;
	}
}

.post-actions {
	display: flex;
	justify-content: flex-end;
}

.reply-btn {
	padding: 8px 16px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.reply-btn:hover {
	background: #2563eb;
}

.empty-state {
	text-align: center;
	padding: 60px 20px;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 16px;
}

.empty-state h3 {
	margin: 0 0 8px;
	font-size: 24px;
	color: #1e293b;
}

.empty-state p {
	margin: 0;
	color: #64748b;
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
	border-radius: 16px;
	width: 90%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24px;
	border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
	margin: 0;
	font-size: 20px;
	color: #1e293b;
}

.close-btn {
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #6b7280;
}

.modal-body {
	padding: 24px;
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
	border-radius: 12px;
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

.modal-footer {
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	padding: 24px;
	border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-submit {
	padding: 12px 24px;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.2s;
}

.btn-cancel {
	background: #f3f4f6;
	color: #374151;
}

.btn-submit {
	background: #3b82f6;
	color: white;
}

.btn-submit:hover {
	background: #2563eb;
}

.publish-section {
	margin-top: 24px;
}

.publish-container {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border: 1px solid #e2e8f0;
}

.publish-header {
	margin-bottom: 20px;
}

.publish-header h3 {
	margin: 0 0 8px;
	font-size: 20px;
	font-weight: 700;
	color: #1e293b;
}

.publish-tips {
	margin: 0;
	color: #64748b;
	font-size: 14px;
}

.publish-form {
	margin-top: 20px;
}

.publish-form .form-group {
	margin-bottom: 16px;
}

.publish-form .form-input,
.publish-form .form-textarea {
	width: 100%;
	padding: 12px 16px;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	font-size: 14px;
	transition: all 0.2s;
	box-sizing: border-box;
}

.publish-form .form-input:focus,
.publish-form .form-textarea:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.publish-form .form-textarea {
	resize: vertical;
	min-height: 100px;
}

.form-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}

.publish-btn {
	padding: 12px 24px;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	font-size: 14px;
	transition: all 0.3s;
	box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.publish-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* 活动分区样式 */
.activities-section {
	margin-bottom: 32px;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 12px;
	border-bottom: 2px solid #e5e7eb;
}

.section-header h2 {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	color: #1e293b;
}

.section-count {
	background: #f1f5f9;
	color: #64748b;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 14px;
	font-weight: 500;
}

.activities-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
}

.activity-card {
	background: white;
	border-radius: 16px;
	padding: 20px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	border: 1px solid #e2e8f0;
	transition: all 0.3s;
}

.activity-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.activity-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16px;
}

.activity-title {
	font-size: 18px;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.4;
}

.activity-status {
	display: flex;
	align-items: center;
}

.status-badge {
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.status-badge.upcoming {
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	color: #1d4ed8;
}

.status-badge.ongoing {
	background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
	color: #16a34a;
}

.status-badge.ended {
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	color: #6b7280;
}

.activity-content {
	margin-bottom: 20px;
}

.activity-description {
	color: #64748b;
	margin-bottom: 16px;
	line-height: 1.6;
	font-size: 14px;
}

.activity-meta {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 12px;
}

.meta-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.meta-label {
	font-size: 12px;
	color: #9ca3af;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.meta-value {
	font-size: 14px;
	color: #374151;
	font-weight: 500;
}

.activity-actions {
	display: flex;
	gap: 12px;
	justify-content: flex-end;
}

.join-btn {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 10px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s;
	font-size: 14px;
	box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.join-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.empty-activities {
	text-align: center;
	padding: 40px 20px;
	grid-column: 1 / -1;
}

.empty-activities .empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
}

.empty-activities p {
	margin: 0;
	color: #64748b;
	font-size: 16px;
}

@media (max-width: 768px) {
	.activities-list {
		grid-template-columns: 1fr;
	}

	.activity-meta {
		grid-template-columns: 1fr;
	}
}
</style>
