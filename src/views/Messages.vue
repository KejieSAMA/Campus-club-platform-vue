<template>
	<div class="message-center-page">
		<!-- 页面头部 -->
		<div class="message-header">
			<div class="header-content">
				<h1>消息中心</h1>
				<p class="subtitle">管理您的邀请和系统通知</p>
			</div>
			<div class="header-actions">
				<button class="mark-all-read-btn" @click="markAllAsRead" :disabled="unreadCount === 0">
					全部标记为已读
				</button>
			</div>
		</div>

		<!-- 统计卡片 -->
		<div class="stats-cards">
			<div class="stat-card">
				<div class="stat-icon">📨</div>
				<div class="stat-content">
					<div class="stat-number">{{ invitations.length }}</div>
					<div class="stat-label">总邀请</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">⏳</div>
				<div class="stat-content">
					<div class="stat-number">{{ unreadInvitations }}</div>
					<div class="stat-label">待处理</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">✅</div>
				<div class="stat-content">
					<div class="stat-number">{{ acceptedCount }}</div>
					<div class="stat-label">已接受</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="stat-icon">❌</div>
				<div class="stat-content">
					<div class="stat-number">{{ rejectedCount }}</div>
					<div class="stat-label">已拒绝</div>
				</div>
			</div>
		</div>

		<!-- 标签页导航 -->
		<div class="message-tabs">
			<button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]"
				@click="switchTab(tab.key)">
				<span class="tab-icon">{{ tab.icon }}</span>
				<span class="tab-label">{{ tab.label }}</span>
				<span v-if="tab.key === 'invitations' && unreadInvitations > 0" class="tab-badge">
					{{ unreadInvitations }}
				</span>
				<span v-if="tab.key === 'topics' && unreadTopicMessages > 0" class="tab-badge">
					{{ unreadTopicMessages }}
				</span>
				<span v-if="tab.key === 'system' && unreadSystemMessages > 0" class="tab-badge">
					{{ unreadSystemMessages }}
				</span>
			</button>
		</div>

		<!-- 消息内容区域 -->
		<div class="message-content">
			<!-- 邀请消息 -->
			<div v-if="activeTab === 'invitations'" class="tab-panel">
				<div v-if="loading" class="loading-state">
					<div class="loading-spinner"></div>
					<div class="loading-text">加载中...</div>
				</div>
				<div v-else-if="invitations.length === 0" class="empty-state">
					<div class="empty-icon">📭</div>
					<div class="empty-title">暂无邀请消息</div>
					<div class="empty-subtitle">当有人邀请您加入社团时，消息会显示在这里</div>
				</div>
				<div v-else class="invitations-list">
					<div v-for="invitation in invitations" :key="invitation.id" class="invitation-card">
						<div class="card-header">
							<div class="invitation-avatar">
								{{ (invitation.inviter?.nickname || invitation.inviter?.username ||
									'U').slice(0, 1).toUpperCase() }}
							</div>
							<div class="invitation-info">
								<div class="invitation-title">社团邀请</div>
								<div class="invitation-time">{{ formatDate(invitation.created_at) }}</div>
							</div>
							<div class="invitation-status">
								<span v-if="invitation.status === 'pending'" class="status-badge pending">待处理</span>
								<span v-else-if="invitation.status === 'accepted'"
									class="status-badge accepted">已接受</span>
								<span v-else-if="invitation.status === 'rejected'"
									class="status-badge rejected">已拒绝</span>
							</div>
						</div>
						<div class="card-content">
							<div class="invitation-message">
								<strong>{{ invitation.inviter?.nickname || invitation.inviter?.username }}</strong>
								邀请您加入社团
								<strong class="club-name">"{{ invitation.club?.name }}"</strong>
							</div>
							<div v-if="invitation.message" class="invitation-note">
								💬 {{ invitation.message }}
							</div>
						</div>
						<div v-if="invitation.status === 'pending'" class="card-actions">
							<button class="btn-accept" @click="respondToInvitation(invitation, 'accept')">
								✅ 接受邀请
							</button>
							<button class="btn-reject" @click="respondToInvitation(invitation, 'reject')">
								❌ 拒绝邀请
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 主题消息 -->
			<div v-if="activeTab === 'topics'" class="tab-panel">
				<div v-if="loading" class="loading-state">
					<div class="loading-spinner"></div>
					<div class="loading-text">加载中...</div>
				</div>
				<div v-else-if="topicMessages.length === 0" class="empty-state">
					<div class="empty-icon">💬</div>
					<div class="empty-title">暂无主题消息</div>
					<div class="empty-subtitle">当有人回复您的帖子时，消息会显示在这里</div>
				</div>
				<div v-else class="topic-messages-list">
					<div v-for="message in topicMessages" :key="message.id" class="topic-message-card"
						@click="handleTopicMessageClick(message)">
						<div class="card-header">
							<div class="message-icon">💬</div>
							<div class="message-info">
								<div class="message-title">{{ message.title }}</div>
								<div class="message-time">{{ formatDate(message.created_at) }}</div>
							</div>
							<div class="message-status">
								<span v-if="!message.is_read" class="status-badge unread">未读</span>
								<span v-else class="status-badge read">已读</span>
							</div>
						</div>
						<div class="card-content">
							<div class="message-text" v-html="formatTopicMessage(message.message)"></div>
						</div>
					</div>
				</div>
			</div>

			<!-- 系统消息 -->
			<div v-if="activeTab === 'system'" class="tab-panel">
				<div v-if="loading" class="loading-state">
					<div class="loading-spinner"></div>
					<div class="loading-text">加载中...</div>
				</div>
				<div v-else-if="systemMessages.length === 0" class="empty-state">
					<div class="empty-icon">📭</div>
					<div class="empty-title">暂无系统消息</div>
					<div class="empty-subtitle">系统通知会显示在这里</div>
				</div>
				<div v-else class="messages-list">
					<div v-for="message in systemMessages" :key="message.id" class="message-card"
						@click="handleSystemMessageClick(message)">
						<div class="card-header">
							<div class="message-icon">🔔</div>
							<div class="message-info">
								<div class="message-title">{{ message.title }}</div>
								<div class="message-time">{{ formatDate(message.created_at) }}</div>
							</div>
							<div class="message-status">
								<span v-if="!message.is_read" class="status-badge unread">未读</span>
								<span v-else class="status-badge read">已读</span>
							</div>
						</div>
						<div class="card-content">
							<div class="message-text">{{ message.message }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import http from '../api/http'

const activeTab = ref('invitations')
const loading = ref(false)
const invitations = ref([])
const topicMessages = ref([])
const systemMessages = ref([])

const tabs = [
	{ key: 'invitations', label: '社团邀请', icon: '📨' },
	{ key: 'topics', label: '主题消息', icon: '💬' },
	{ key: 'system', label: '系统消息', icon: '🔔' }
]

const unreadInvitations = computed(() => {
	return invitations.value.filter(inv => inv.status === 'pending').length
})

const acceptedCount = computed(() => {
	return invitations.value.filter(inv => inv.status === 'accepted').length
})

const rejectedCount = computed(() => {
	return invitations.value.filter(inv => inv.status === 'rejected').length
})

const unreadTopicMessages = computed(() => {
	return topicMessages.value.filter(msg => !msg.is_read).length
})

const unreadSystemMessages = computed(() => {
	return systemMessages.value.filter(msg => !msg.is_read).length
})

const unreadCount = computed(() => {
	return unreadInvitations.value + unreadTopicMessages.value + unreadSystemMessages.value
})

function switchTab(tabKey) {
	activeTab.value = tabKey
	if (tabKey === 'topics') {
		loadTopicMessages()
	} else if (tabKey === 'system') {
		loadSystemMessages()
	}
}

async function loadInvitations() {
	loading.value = true
	try {
		const { data } = await http.get('/invitation/received')
		invitations.value = data.invitations || []
	} catch (error) {
		console.error('加载邀请失败:', error)
	} finally {
		loading.value = false
	}
}

async function loadTopicMessages() {
	loading.value = true
	try {
		const { data } = await http.get('/topic-message/list')
		topicMessages.value = data.messages || []
	} catch (error) {
		console.error('加载主题消息失败:', error)
	} finally {
		loading.value = false
	}
}

async function loadSystemMessages() {
	loading.value = true
	try {
		const { data } = await http.get('/messages/list', {
			params: { type: 'system' }
		})
		systemMessages.value = data.messages || []
	} catch (error) {
		console.error('加载系统消息失败:', error)
	} finally {
		loading.value = false
	}
}

async function respondToInvitation(invitation, action) {
	try {
		await http.post(`/invitation/${invitation.id}/respond`, { action })

		if (action === 'accept') {
			alert('已成功加入社团！')
		} else {
			alert('已拒绝邀请')
		}

		// 重新加载邀请列表
		await loadInvitations()
	} catch (error) {
		console.error('回应邀请失败:', error)
		alert('操作失败：' + (error.response?.data?.message || error.message))
	}
}

async function markAllAsRead() {
	try {
		// 标记邀请消息为已读
		if (activeTab.value === 'invitations') {
			// 邀请消息的标记已读逻辑
		} else if (activeTab.value === 'topics') {
			await http.post('/topic-message/read-all')
			await loadTopicMessages()
		} else if (activeTab.value === 'system') {
			// 标记系统消息为已读
			const unreadMessages = systemMessages.value.filter(msg => !msg.is_read)
			if (unreadMessages.length > 0) {
				const messageIds = unreadMessages.map(msg => msg.id)
				await http.post('/messages/read', { ids: messageIds })
				await loadSystemMessages()
			}
		}
		alert('已标记所有消息为已读')
	} catch (error) {
		console.error('标记已读失败:', error)
	}
}

async function handleTopicMessageClick(message) {
	try {
		// 标记消息为已读
		await http.post(`/topic-message/${message.id}/read`)

		// 解析消息数据，跳转到对应帖子
		const data = JSON.parse(message.data || '{}')
		if (data.postId && data.clubId) {
			// 跳转到帖子详情页
			window.open(`/club/${data.clubId}/post/${data.postId}`, '_blank')
		}

		// 重新加载消息列表
		await loadTopicMessages()
	} catch (error) {
		console.error('处理主题消息失败:', error)
	}
}

async function handleSystemMessageClick(message) {
	try {
		// 标记消息为已读
		if (!message.is_read) {
			await http.post(`/messages/read`, { ids: [message.id] })
			message.is_read = true
		}

		// 重新加载系统消息列表
		await loadSystemMessages()
	} catch (error) {
		console.error('处理系统消息失败:', error)
	}
}

function formatTopicMessage(message) {
	if (!message) return ''

	// 高亮显示发送者名称（通常在消息开头）
	// 匹配格式：用户名 回复了您的主题帖 "标题"
	// 或者：用户名 回复了您在主题帖 "标题" 中的回复
	const senderPattern = /^([^回复了]+?)\s+(回复了您的主题帖|回复了您在主题帖)/;
	const match = message.match(senderPattern);

	if (match) {
		const senderName = match[1].trim();
		const action = match[2];
		const restOfMessage = message.replace(senderPattern, '').trim();

		// 高亮显示发送者名称
		return `<span class="message-sender">${senderName}</span> ${action}${restOfMessage}`;
	}

	// 如果没有匹配到模式，直接返回原消息
	return message;
}

function formatDate(dateString) {
	if (!dateString) return '未知'
	try {
		const date = new Date(dateString)
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})
	} catch (error) {
		return '未知'
	}
}

onMounted(async () => {
	await loadInvitations()

	// 预加载主题消息和系统消息数据以检查未读数量
	await Promise.all([
		loadTopicMessages(),
		loadSystemMessages()
	])

	// 检查是否有未读消息，如果有则自动切换到对应标签页
	if (unreadSystemMessages.value > 0) {
		// 如果有未读系统消息，切换到系统消息标签页
		activeTab.value = 'system'
	} else if (unreadTopicMessages.value > 0) {
		// 如果没有未读系统消息但有未读主题消息，切换到主题消息标签页
		activeTab.value = 'topics'
	} else if (unreadInvitations.value > 0) {
		// 如果没有未读系统消息和主题消息但有未读邀请，保持在邀请标签页
		// activeTab.value 已经是 'invitations'，无需更改
	}
})
</script>

<style scoped>
.message-center-page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	background: #f8fafc;
	min-height: 100vh;
}

/* 页面头部 */
.message-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding: 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16px;
	color: white;
	box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.header-content h1 {
	margin: 0 0 8px 0;
	font-size: 28px;
	font-weight: 700;
	color: white;
}

.subtitle {
	margin: 0;
	font-size: 16px;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 400;
}

.mark-all-read-btn {
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.3);
	padding: 12px 20px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
	backdrop-filter: blur(10px);
}

.mark-all-read-btn:hover:not(:disabled) {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.mark-all-read-btn:disabled {
	background: rgba(255, 255, 255, 0.1);
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

/* 统计卡片 */
.stats-cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.stat-card {
	background: white;
	border-radius: 12px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	transition: all 0.2s;
	border: 1px solid #e5e7eb;
}

.stat-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
	font-size: 32px;
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	border-radius: 12px;
}

.stat-content {
	flex: 1;
}

.stat-number {
	font-size: 24px;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 4px;
}

.stat-label {
	font-size: 14px;
	color: #6b7280;
	font-weight: 500;
}

/* 标签页导航 */
.message-tabs {
	display: flex;
	gap: 8px;
	margin-bottom: 24px;
	background: white;
	padding: 8px;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	border: 1px solid #e5e7eb;
}

.tab-btn {
	background: transparent;
	border: none;
	padding: 12px 20px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	color: #6b7280;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 8px;
	position: relative;
}

.tab-btn:hover {
	background: #f9fafb;
	color: #374151;
}

.tab-btn.active {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tab-icon {
	font-size: 16px;
}

.tab-label {
	font-size: 14px;
	font-weight: 500;
}

.tab-badge {
	background: #ef4444;
	color: white;
	font-size: 11px;
	font-weight: 600;
	padding: 2px 6px;
	border-radius: 10px;
	min-width: 18px;
	text-align: center;
	position: absolute;
	top: -4px;
	right: -4px;
}

/* 消息内容区域 */
.message-content {
	background: white;
	border-radius: 16px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	overflow: hidden;
	border: 1px solid #e5e7eb;
}

.tab-panel {
	padding: 24px;
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	color: #6b7280;
}

.loading-spinner {
	width: 32px;
	height: 32px;
	border: 3px solid #e5e7eb;
	border-top: 3px solid #3b82f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}

.loading-text {
	font-size: 16px;
	font-weight: 500;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 60px 20px;
	color: #6b7280;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 20px;
	opacity: 0.6;
}

.empty-title {
	font-size: 20px;
	font-weight: 600;
	color: #374151;
	margin-bottom: 8px;
}

.empty-subtitle {
	font-size: 14px;
	color: #9ca3af;
}

/* 邀请卡片 */
.invitations-list,
.messages-list,
.topic-messages-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.invitation-card,
.message-card,
.topic-message-card {
	background: #fafafa;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 20px;
	transition: all 0.2s;
	position: relative;
}

.message-card {
	cursor: pointer;
}

.message-card:hover {
	background: #f8fafc;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transform: translateY(-1px);
	border-color: #d1d5db;
}

.invitation-card:hover,
.message-card:hover,
.topic-message-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transform: translateY(-1px);
	border-color: #d1d5db;
}

.topic-message-card {
	cursor: pointer;
}

.topic-message-card:hover {
	background: #f8fafc;
}

.card-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.invitation-avatar,
.message-icon {
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
	flex-shrink: 0;
}

.invitation-info,
.message-info {
	flex: 1;
}

.invitation-title,
.message-title {
	font-weight: 600;
	color: #1f2937;
	font-size: 16px;
	margin-bottom: 4px;
}

.invitation-time,
.message-time {
	font-size: 12px;
	color: #6b7280;
}

.invitation-status {
	margin-left: auto;
}

.status-badge {
	font-size: 12px;
	font-weight: 600;
	padding: 6px 12px;
	border-radius: 20px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.status-badge.pending {
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	color: #d97706;
	border: 1px solid #f59e0b;
}

.status-badge.accepted {
	background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
	color: #059669;
	border: 1px solid #10b981;
}

.status-badge.rejected {
	background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
	color: #dc2626;
	border: 1px solid #ef4444;
}

.status-badge.unread {
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	color: #1d4ed8;
	border: 1px solid #3b82f6;
}

.status-badge.read {
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	color: #6b7280;
	border: 1px solid #9ca3af;
}

.card-content {
	margin-bottom: 16px;
}

.invitation-message,
.message-text {
	font-size: 14px;
	color: #374151;
	line-height: 1.6;
}

.club-name {
	color: #3b82f6;
	font-weight: 600;
}

.invitation-note {
	font-size: 13px;
	color: #6b7280;
	margin-top: 12px;
	padding: 12px;
	background: #f3f4f6;
	border-radius: 8px;
	border-left: 3px solid #3b82f6;
}

.message-sender {
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 2px 8px;
	border-radius: 12px;
	font-weight: 600;
	font-size: 13px;
	display: inline-block;
	margin-right: 8px;
	box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.card-actions {
	display: flex;
	gap: 12px;
}

.btn-accept,
.btn-reject {
	padding: 10px 20px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 6px;
}

.btn-accept {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-accept:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-reject {
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-reject:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
	.message-center-page {
		padding: 16px;
	}

	.message-header {
		flex-direction: column;
		gap: 16px;
		text-align: center;
	}

	.stats-cards {
		grid-template-columns: 1fr;
	}

	.message-tabs {
		flex-direction: column;
	}

	.card-actions {
		flex-direction: column;
	}

	.btn-accept,
	.btn-reject {
		width: 100%;
		justify-content: center;
	}
}
</style>
