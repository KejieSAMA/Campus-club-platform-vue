<template>
	<div class="events-page">
		<div class="page-header">
			<div class="header-content">
				<h1>活动中心</h1>
				<p class="subtitle">发现精彩活动，参与校园生活</p>
			</div>
		</div>

		<div class="events-content">
			<!-- 筛选器 -->
			<div class="filters-section">
				<div class="filter-tabs">
					<button v-for="status in statusFilters" :key="status.key"
						:class="['filter-tab', { active: activeFilter === status.key }]"
						@click="activeFilter = status.key">
						{{ status.label }}
					</button>
				</div>
				<div class="search-section">
					<div class="search-input-wrapper">
						<input v-model="searchQuery" @input="handleSearch" placeholder="搜索活动..." class="search-input" />
						<div class="search-icon">🔍</div>
					</div>
				</div>
			</div>

			<!-- 活动列表 -->
			<div class="events-list">
				<div v-if="loading" class="loading-state">
					<div class="loading-spinner"></div>
					<p>加载中...</p>
				</div>

				<div v-else-if="filteredEvents.length === 0" class="empty-state">
					<div class="empty-icon">📅</div>
					<div class="empty-text">暂无活动</div>
					<p class="empty-subtitle">当前筛选条件下没有找到活动</p>
				</div>

				<div v-else class="events-grid">
					<div v-for="event in filteredEvents" :key="event.id" class="event-card">
						<div class="event-header">
							<div class="event-title">{{ event.title }}</div>
							<div class="event-status">
								<span :class="['status-badge', getEventStatus(event)]">
									{{ getEventStatusText(getEventStatus(event)) }}
								</span>
							</div>
						</div>

						<div class="event-content">
							<div class="event-description">{{ event.content || '暂无描述' }}</div>

							<div class="event-meta">
								<div class="meta-item">
									<span class="meta-label">社团：</span>
									<span class="meta-text">{{ event.club?.name || '未知社团' }}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">时间：</span>
									<span class="meta-text">{{ formatDateTime(event.start_time) }}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">地址：</span>
									<span class="meta-text">{{ event.location || '待定' }}</span>
								</div>
								<div class="meta-item">
									<span class="meta-label">报名：</span>
									<span class="meta-text">{{ event.signup_count || 0 }} 人已报名</span>
								</div>
							</div>

							<div class="event-actions">
								<button v-if="!event.is_signed_up"
									:class="['join-btn', { loading: joiningEvents.has(event.id) }]"
									@click="joinEvent(event.id)" :disabled="joiningEvents.has(event.id)">
									{{ joiningEvents.has(event.id) ? '报名中...' : '立即报名' }}
								</button>
								<div v-else class="joined-actions">
									<button class="joined-btn">
										已报名
									</button>
									<button class="cancel-btn" @click="cancelJoinEvent(event.id)"
										:disabled="joiningEvents.has(event.id)">
										取消报名
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '../api/http'

// 响应式数据
const events = ref([])
const loading = ref(false)
const searchQuery = ref('')
const activeFilter = ref('all')
const joiningEvents = ref(new Set())

// 状态筛选器
const statusFilters = [
	{ key: 'all', label: '全部' },
	{ key: 'upcoming', label: '即将开始' },
	{ key: 'ongoing', label: '进行中' },
	{ key: 'ended', label: '已结束' }
]

// 计算属性
const filteredEvents = computed(() => {
	let filtered = events.value

	// 按状态筛选
	if (activeFilter.value !== 'all') {
		const now = new Date()
		filtered = filtered.filter(event => {
			const startTime = new Date(event.start_time)
			const endTime = new Date(event.end_time)

			switch (activeFilter.value) {
				case 'upcoming':
					return startTime > now
				case 'ongoing':
					return startTime <= now && endTime >= now
				case 'ended':
					return endTime < now
				default:
					return true
			}
		})
	}

	// 按搜索关键词筛选
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase()
		filtered = filtered.filter(event =>
			event.title.toLowerCase().includes(query) ||
			event.content?.toLowerCase().includes(query) ||
			event.Club?.name?.toLowerCase().includes(query)
		)
	}

	return filtered
})

// 方法
async function loadEvents() {
	try {
		loading.value = true
		const { data } = await http.get('/events')
		events.value = data.events || []
	} catch (error) {
		console.error('Failed to load events:', error)
		alert('加载活动失败：' + (error.response?.data?.message || error.message))
	} finally {
		loading.value = false
	}
}

async function joinEvent(eventId) {
	try {
		joiningEvents.value.add(eventId)
		await http.post(`/events/${eventId}/signup`)

		// 更新本地状态
		const event = events.value.find(e => e.id === eventId)
		if (event) {
			event.is_signed_up = true
			event.signup_count = (event.signup_count || 0) + 1
		}

		alert('报名成功！')
	} catch (error) {
		console.error('Failed to join event:', error)
		alert('报名失败：' + (error.response?.data?.message || error.message))
	} finally {
		joiningEvents.value.delete(eventId)
	}
}

async function cancelJoinEvent(eventId) {
	try {
		joiningEvents.value.add(eventId)
		await http.delete(`/events/${eventId}/signup`)

		// 更新本地状态
		const event = events.value.find(e => e.id === eventId)
		if (event) {
			event.is_signed_up = false
			event.signup_count = Math.max(0, (event.signup_count || 1) - 1)
		}

		alert('已取消报名')
	} catch (error) {
		console.error('Failed to cancel join:', error)
		alert('取消报名失败：' + (error.response?.data?.message || error.message))
	} finally {
		joiningEvents.value.delete(eventId)
	}
}

function getEventStatus(event) {
	const now = new Date()
	const startTime = new Date(event.start_time)
	const endTime = new Date(event.end_time)

	if (now < startTime) return 'upcoming'
	if (now >= startTime && now <= endTime) return 'ongoing'
	return 'ended'
}

function getEventStatusText(status) {
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

function handleSearch() {
	// 搜索防抖可以在这里实现
}

// 生命周期
onMounted(() => {
	loadEvents()
})
</script>

<style scoped>
.events-page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	background: #f8fafc;
	min-height: 100vh;
}

.page-header {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	padding: 40px 0;
	border-radius: 16px;
	margin-bottom: 30px;
	text-align: center;
}

.header-content h1 {
	font-size: 32px;
	font-weight: 700;
	margin: 0 0 8px 0;
}

.subtitle {
	font-size: 16px;
	opacity: 0.9;
	margin: 0;
}

.events-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.filters-section {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	flex-wrap: wrap;
	gap: 16px;
	overflow: visible;
	min-height: 60px;
}

.filter-tabs {
	display: flex;
	gap: 8px;
}

.filter-tab {
	padding: 8px 16px;
	border: 2px solid #e5e7eb;
	background: white;
	color: #6b7280;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.filter-tab:hover {
	border-color: #667eea;
	color: #667eea;
}

.filter-tab.active {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-color: transparent;
}

.search-input-wrapper {
	position: relative;
	width: 280px;
	max-width: 100%;
	min-width: 200px;
	flex-shrink: 0;
}

.search-input {
	width: 100%;
	padding: 12px 16px 12px 40px;
	border: 2px solid #e5e7eb;
	border-radius: 10px;
	font-size: 14px;
	transition: all 0.2s;
	background: #fafafa;
	box-sizing: border-box;
	min-height: 44px;
}

.search-input:focus {
	outline: none;
	border-color: #667eea;
	background: white;
	box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #9ca3af;
}

.loading-state {
	text-align: center;
	padding: 60px 20px;
}

.loading-spinner {
	width: 40px;
	height: 40px;
	border: 4px solid #e5e7eb;
	border-top: 4px solid #667eea;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 16px;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}

	100% {
		transform: rotate(360deg);
	}
}

.empty-state {
	text-align: center;
	padding: 60px 20px;
	color: #6b7280;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
}

.empty-text {
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 8px;
}

.empty-subtitle {
	font-size: 14px;
	margin: 0;
}

.events-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 20px;
}

.event-card {
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 20px;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.event-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	border-color: #667eea;
}

.event-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
}

.event-title {
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	line-height: 1.4;
	flex: 1;
	margin-right: 12px;
}

.event-status {
	flex-shrink: 0;
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

.event-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.event-description {
	color: #4b5563;
	line-height: 1.5;
	font-size: 14px;
}

.event-meta {
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
	font-size: 14px;
	color: #374151;
	font-weight: 500;
	min-width: 50px;
}

.meta-text {
	font-size: 14px;
	color: #6b7280;
}

.event-actions {
	display: flex;
	gap: 8px;
}

.join-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
	flex: 1;
}

.join-btn:hover:not(:disabled) {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.join-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.joined-btn {
	background: #dcfce7;
	color: #16a34a;
	border: 1px solid #16a34a;
	padding: 10px 20px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
	flex: 1;
}

.joined-btn:hover {
	background: #bbf7d0;
}

.joined-actions {
	display: flex;
	gap: 8px;
	width: 100%;
}

.cancel-btn {
	background: #fef2f2;
	color: #dc2626;
	border: 1px solid #dc2626;
	padding: 10px 20px;
	border-radius: 8px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
	flex: 1;
}

.cancel-btn:hover:not(:disabled) {
	background: #fee2e2;
	transform: translateY(-1px);
	box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
}

.cancel-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

@media (max-width: 768px) {
	.events-page {
		padding: 16px;
	}

	.filters-section {
		flex-direction: column;
		align-items: stretch;
		gap: 12px;
		min-height: auto;
	}

	.search-input-wrapper {
		width: 100%;
		max-width: none;
		min-width: auto;
	}

	.filter-tabs {
		justify-content: center;
		flex-wrap: wrap;
	}

	.events-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 480px) {
	.filter-tabs {
		gap: 4px;
	}

	.filter-tab {
		padding: 6px 12px;
		font-size: 13px;
	}
}
</style>
