<template>
	<div class="post-detail-page">
		<div class="post-header">
			<div class="header-content">
				<h1>{{ post?.title || '主题详情' }}</h1>
				<p class="subtitle">{{ clubInfo?.name || '社团论坛' }}</p>
			</div>
			<button class="back-btn" @click="goBack">
				返回论坛
			</button>
		</div>

		<div class="post-content">
			<div class="post-main">
				<div class="post-info">
					<div class="author-info">
						<div class="author-avatar">
							{{ (post?.author?.nickname || post?.author?.username || 'U').slice(0, 1).toUpperCase() }}
						</div>
						<div class="author-details">
							<div class="author-name">{{ post?.author?.nickname || post?.author?.username }}</div>
							<div class="post-meta">
								<span class="post-time">{{ formatDateTime(post?.created_at) }}</span>
								<span class="post-stats">{{ post?.view_count || 0 }} 浏览</span>
							</div>
						</div>
					</div>
				</div>

				<div class="post-body">
					<div class="post-text">{{ post?.content }}</div>
				</div>

				<div class="post-actions">
					<button class="action-btn like-btn" :class="{ active: isLiked }" @click="toggleLike">
						<span>{{ isLiked ? '👍' : '👍' }}</span> {{ isLiked ? '已点赞' : '点赞' }} {{ post?.like_count || 0
						}}
					</button>
					<button class="action-btn share-btn">
						<span>📤</span> 分享
					</button>
					<button class="action-btn favorite-btn" :class="{ active: isFavorited }" @click="toggleFavorite">
						<span>{{ isFavorited ? '❤️' : '🤍' }}</span> {{ isFavorited ? '已收藏' : '收藏' }}
					</button>
				</div>
			</div>
		</div>

		<div class="replies-section">
			<div class="replies-header">
				<h3>回复 ({{ totalReplies }})</h3>
			</div>

			<div class="replies-list">
				<div v-for="(reply, index) in replies" :key="reply.id" class="reply-item">
					<!-- 楼层等级 -->
					<div class="floor-number">{{ getFloorName(index + 1) }}</div>
					<div class="reply-layout">
						<!-- 左侧用户信息卡片 -->
						<div class="user-info-card" @click="goToUserProfile(reply.author?.id)">
							<div class="user-avatar">
								{{ (reply.author?.nickname || reply.author?.username || 'U').slice(0, 1).toUpperCase()
								}}
							</div>
							<div class="user-details">
								<div class="user-name clickable">{{ reply.author?.nickname || reply.author?.username }}
								</div>
								<div class="user-role">{{ reply.author?.role || '未知' }}</div>
								<div class="club-role">{{ getClubRole(reply) }}</div>
							</div>
						</div>

						<!-- 右侧回复内容区域 -->
						<div class="reply-content-area">
							<div class="reply-content">{{ reply.content }}</div>
							<div class="reply-meta">
								<span class="reply-time">{{ formatDateTime(reply.createdAt || reply.created_at)
									}}</span>
								<button class="reply-to-btn" @click="toggleReplyForm(reply.id)">
									回复
								</button>
							</div>
						</div>
					</div>

					<!-- 楼中楼回复 -->
					<div v-if="reply.children && reply.children.length > 0" class="nested-replies">
						<!-- 显示楼中楼回复 -->
						<template v-for="(child, index) in getDisplayedNestedReplies(reply)" :key="child.id">
							<div class="nested-reply">
								<div class="nested-reply-content">
									<span class="nested-author-name">{{ child.author?.nickname || child.author?.username
										}}:</span>
									<span class="nested-reply-text" v-html="getNestedReplyText(child, reply)"></span>
									<div class="nested-reply-meta">
										<span class="nested-reply-time">{{ formatDateTime(child.createdAt ||
											child.created_at) }}</span>
										<button class="nested-reply-btn" @click="toggleNestedReplyForm(child.id)">
											回复
										</button>
									</div>
								</div>

								<!-- 楼中楼回复表单 -->
								<div v-if="showNestedReplyForm === child.id" class="nested-reply-form">
									<div class="reply-form" v-if="!post?.is_banned">
										<textarea v-model="nestedReplyForm.content" class="reply-textarea" rows="2"
											:placeholder="`回复 @${child.author?.nickname || child.author?.username}...`"></textarea>
										<div class="reply-actions">
											<button class="cancel-btn" @click="cancelNestedReply">取消</button>
											<button class="submit-btn" @click="submitNestedReply(child.id)">回复</button>
										</div>
									</div>
									<div v-else class="banned-notice">
										🚫 此主题已被封禁，无法回复
									</div>
								</div>
							</div>
						</template>

						<!-- 展开/收起按钮 -->
						<div v-if="getAllNestedRepliesFlat(reply).length > 3" class="expand-section">
							<button class="expand-btn" @click="toggleExpandReply(reply.id)">
								{{ expandedReplies.has(reply.id) ? '收起楼层' : `展开 ${getHiddenNestedReplies(reply).length}
								条回复` }}
							</button>
						</div>
					</div>

					<!-- 楼中楼回复表单 -->
					<div v-if="showReplyForm === reply.id" class="nested-reply-form">
						<div class="reply-form" v-if="!post?.is_banned">
							<textarea v-model="nestedReplyForm.content" class="reply-textarea" rows="3"
								:placeholder="`回复 @${reply.author?.nickname || reply.author?.username}...`"></textarea>
							<div class="reply-actions">
								<button class="cancel-btn" @click="cancelReply">取消</button>
								<button class="submit-btn" @click="submitNestedReply(reply.id)">回复</button>
							</div>
						</div>
						<div v-else class="banned-notice">
							🚫 此主题已被封禁，无法回复
						</div>
					</div>
				</div>
			</div>

			<div v-if="replies.length === 0" class="empty-replies">
				<div class="empty-icon">💬</div>
				<p>暂无回复，快来抢沙发吧！</p>
			</div>
		</div>

		<!-- 回复输入区域 -->
		<div class="reply-section">
			<div class="reply-container">
				<div class="reply-header">
					<h3>发表回复</h3>
					<div v-if="post?.is_banned" class="banned-notice">
						🚫 此主题已被封禁，无法回复
					</div>
				</div>
				<div class="reply-form" v-if="!post?.is_banned">
					<textarea v-model="replyForm.content" class="reply-textarea" rows="4"
						placeholder="请输入回复内容..."></textarea>
					<div class="reply-actions">
						<button class="reply-btn" @click="submitReply">
							发表回复
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '../api/http'

const route = useRoute()
const router = useRouter()
const clubId = route.params.id
const postId = route.params.postId

const post = ref(null)
const clubInfo = ref(null)
const replies = ref([])
const replyForm = ref({ content: '' })
const showReplyForm = ref(null)
const nestedReplyForm = ref({ content: '' })
const showNestedReplyForm = ref(null)
const expandedReplies = ref(new Set())
const isFavorited = ref(false)
const isLiked = ref(false)

// 计算总回复数（包括楼中楼）
const totalReplies = computed(() => {
	let total = 0
	replies.value.forEach(reply => {
		total += 1 // 主回复
		if (reply.children && reply.children.length > 0) {
			const allReplies = getAllNestedRepliesFlat(reply)
			total += allReplies.length
		}
	})
	return total
})

async function loadPost() {
	try {
		const { data } = await http.get(`/clubs/${clubId}/posts/${postId}`)
		post.value = data.post
		clubInfo.value = data.club
	} catch (error) {
		console.error('Failed to load post:', error)
		alert('加载帖子失败：' + (error.response?.data?.message || error.message))
	}
}

async function loadReplies() {
	try {
		const { data } = await http.get(`/clubs/${clubId}/posts/${postId}/replies`)
		replies.value = data.replies || []
	} catch (error) {
		console.error('Failed to load replies:', error)
	}
}

// 检查收藏状态
async function checkFavoriteStatus() {
	try {
		const { data } = await http.get(`/favorite/${postId}`)
		isFavorited.value = data.isFavorited
	} catch (error) {
		console.error('Failed to check favorite status:', error)
	}
}

// 切换收藏状态
async function toggleFavorite() {
	try {
		const { data } = await http.post(`/favorite/${postId}`)
		isFavorited.value = data.action === 'favorited'
		alert(data.message)
	} catch (error) {
		console.error('Failed to toggle favorite:', error)
		alert('操作失败：' + (error.response?.data?.message || error.message))
	}
}

// 检查点赞状态
async function checkLikeStatus() {
	try {
		const { data } = await http.get(`/like/${postId}`)
		isLiked.value = data.isLiked
		// 更新帖子的点赞数
		if (post.value) {
			post.value.like_count = data.likeCount
		}
	} catch (error) {
		console.error('Failed to check like status:', error)
	}
}

// 切换点赞状态
async function toggleLike() {
	try {
		const { data } = await http.post(`/like/${postId}`)
		isLiked.value = data.action === 'liked'
		// 更新帖子的点赞数
		if (post.value) {
			post.value.like_count = data.likeCount
		}
		alert(data.message)
	} catch (error) {
		console.error('Failed to toggle like:', error)
		alert('操作失败：' + (error.response?.data?.message || error.message))
	}
}

async function submitReply() {
	if (!replyForm.value.content.trim()) {
		alert('请输入回复内容')
		return
	}

	try {
		await http.post(`/clubs/${clubId}/posts/${postId}/replies`, {
			content: replyForm.value.content
		})
		alert('回复成功！')
		replyForm.value.content = ''
		await loadReplies()
		// 更新帖子信息，包括回复数
		await loadPost()
	} catch (error) {
		alert('回复失败：' + (error.response?.data?.message || error.message))
	}
}

// 楼中楼相关方法
function toggleReplyForm(replyId) {
	if (showReplyForm.value === replyId) {
		showReplyForm.value = null
		nestedReplyForm.value.content = ''
	} else {
		showReplyForm.value = replyId
		nestedReplyForm.value.content = ''
	}
}

function cancelReply() {
	showReplyForm.value = null
	nestedReplyForm.value.content = ''
}

async function submitNestedReply(parentId) {
	if (!nestedReplyForm.value.content.trim()) {
		alert('请输入回复内容')
		return
	}

	try {
		await http.post(`/clubs/${clubId}/posts/${postId}/replies`, {
			content: nestedReplyForm.value.content,
			parentId: parentId
		})
		alert('回复成功！')
		nestedReplyForm.value.content = ''
		showReplyForm.value = null
		await loadReplies()
		await loadPost()
	} catch (error) {
		alert('回复失败：' + (error.response?.data?.message || error.message))
	}
}

// 楼中楼回复方法
function toggleNestedReplyForm(replyId) {
	if (showNestedReplyForm.value === replyId) {
		showNestedReplyForm.value = null
		nestedReplyForm.value.content = ''
	} else {
		showNestedReplyForm.value = replyId
		nestedReplyForm.value.content = ''
	}
}

function cancelNestedReply() {
	showNestedReplyForm.value = null
	nestedReplyForm.value.content = ''
}

// 获取所有楼中楼回复（展平显示）
function getAllNestedRepliesFlat(reply) {
	const allReplies = []

	function flattenReplies(replies) {
		replies.forEach(replyItem => {
			allReplies.push(replyItem)
			if (replyItem.children && replyItem.children.length > 0) {
				flattenReplies(replyItem.children)
			}
		})
	}

	if (reply.children && reply.children.length > 0) {
		flattenReplies(reply.children)
	}

	return allReplies
}

// 获取显示的楼中楼回复（简单折叠逻辑）
function getDisplayedNestedReplies(reply) {
	if (!reply.children || reply.children.length === 0) {
		return []
	}

	const allReplies = getAllNestedRepliesFlat(reply)
	const isExpanded = expandedReplies.value.has(reply.id)

	if (isExpanded) {
		// 展开状态：显示所有回复
		return allReplies
	} else {
		// 折叠状态：只显示前3条回复
		return allReplies.slice(0, 3)
	}
}

// 获取隐藏的楼中楼回复数量
function getHiddenNestedReplies(reply) {
	if (!reply.children || reply.children.length === 0) {
		return []
	}

	const allReplies = getAllNestedRepliesFlat(reply)
	const isExpanded = expandedReplies.value.has(reply.id)

	if (isExpanded) {
		// 展开状态：没有隐藏回复
		return []
	} else {
		// 折叠状态：超过3条的回复为隐藏
		return allReplies.slice(3)
	}
}

// 切换展开/收起状态
function toggleExpandReply(replyId) {
	if (expandedReplies.value.has(replyId)) {
		expandedReplies.value.delete(replyId)
	} else {
		expandedReplies.value.add(replyId)
	}
}

// 获取楼中楼回复的显示文本
function getNestedReplyText(child, parentReply) {
	// 如果这个回复是直接回复主回复的，直接显示内容
	if (child.parent_id === parentReply.id) {
		return child.content
	}

	// 如果这个回复是回复其他楼中楼的，需要找到被回复的用户
	// 这里我们需要在展平的回复中找到被回复的用户
	const allReplies = getAllNestedRepliesFlat(parentReply)
	const repliedToReply = allReplies.find(r => r.id === child.parent_id)

	if (repliedToReply) {
		const repliedToUser = repliedToReply.author?.nickname || repliedToReply.author?.username
		return `回复 <span style="color: #dc2626; background: #fef2f2; padding: 1px 4px; border-radius: 3px; font-weight: 600; border: 1px solid #fecaca; display: inline-block;">@${repliedToUser}</span> ${child.content}`
	}

	// 如果找不到被回复的用户，直接显示内容
	return child.content
}

// 获取用户在社团内的角色
function getClubRole(reply) {
	// 使用后端返回的clubRole信息
	if (reply.clubRole) {
		// 根据角色类型返回中文显示
		switch (reply.clubRole) {
			case 'owner':
				return '社团团长'
			case 'manager':
				return '社团管理员'
			case 'member':
				return '社团成员'
			case 'visitor':
				return '游客'
			default:
				return reply.clubRole || '游客'
		}
	}

	// 如果没有clubRole信息，检查是否是社团团长
	if (clubInfo.value && clubInfo.value.owner_id === reply.author?.id) {
		return '社团团长'
	}

	return '游客'
}

// 获取楼层名称
function getFloorName(floorNumber) {
	switch (floorNumber) {
		case 1:
			return '沙发'
		case 2:
			return '板凳'
		case 3:
			return '地板'
		default:
			return `#${floorNumber}`
	}
}

function goBack() {
	router.push(`/club/${clubId}/forum`)
}

// 跳转到用户个人主页
function goToUserProfile(userId) {
	if (userId) {
		router.push(`/user/${userId}`)
	}
}

function formatDate(dateString) {
	if (!dateString) return '未知'
	return new Date(dateString).toLocaleString('zh-CN')
}

function formatDateTime(dateString) {
	if (!dateString) return '未知'

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
		console.error('formatDateTime error:', error)
		return '格式错误'
	}
}

onMounted(async () => {
	await Promise.all([
		loadPost(),
		loadReplies(),
		checkFavoriteStatus(),
		checkLikeStatus()
	])
})
</script>

<style scoped>
.post-detail-page {
	max-width: 1000px;
	margin: 0 auto;
	padding: 20px;
}

.post-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	padding: 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16px;
	color: white;
}

.header-content h1 {
	margin: 0;
	font-size: 24px;
	font-weight: 700;
}

.subtitle {
	margin: 8px 0 0;
	opacity: 0.9;
	font-size: 16px;
}

.back-btn {
	padding: 10px 20px;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 10px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s;
}

.back-btn:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-2px);
}

.post-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.post-info {
	margin-bottom: 20px;
}

.author-info {
	display: flex;
	align-items: center;
	gap: 16px;
}

.author-avatar {
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

.author-details {
	display: flex;
	flex-direction: column;
}

.author-name {
	font-weight: 600;
	color: #1e293b;
	font-size: 16px;
}

.post-meta {
	display: flex;
	gap: 16px;
	margin-top: 4px;
}

.post-time,
.post-stats {
	font-size: 14px;
	color: #64748b;
}

.post-body {
	margin-bottom: 24px;
}

.post-text {
	line-height: 1.8;
	color: #1e293b;
	font-size: 16px;
	white-space: pre-wrap;
}

.post-actions {
	display: flex;
	gap: 12px;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	color: #64748b;
	transition: all 0.2s;
}

.action-btn:hover {
	background: #e2e8f0;
}

.favorite-btn.active {
	background: #fef2f2;
	border-color: #fecaca;
	color: #dc2626;
}

.favorite-btn.active:hover {
	background: #fee2e2;
	border-color: #fca5a5;
}

.like-btn.active {
	background: #f0f9ff;
	border-color: #bae6fd;
	color: #0369a1;
}

.like-btn.active:hover {
	background: #e0f2fe;
	border-color: #7dd3fc;
}

.replies-section {
	background: white;
	border-radius: 16px;
	padding: 24px;
	margin-bottom: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.replies-header {
	margin-bottom: 20px;
}

.replies-header h3 {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	color: #1e293b;
}

.replies-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.reply-item {
	padding: 20px;
	background: #f8fafc;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
	margin-bottom: 16px;
	position: relative;
}

/* 楼层等级 */
.floor-number {
	position: absolute;
	top: 12px;
	right: 16px;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
	z-index: 1;
	width: 40px;
	text-align: center;
	box-sizing: border-box;
}

.reply-layout {
	display: flex;
	gap: 20px;
}

/* 左侧用户信息卡片 */
.user-info-card {
	width: 150px;
	flex-shrink: 0;
	background: white;
	border-radius: 8px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	cursor: pointer;
	transition: all 0.2s ease;
}

.user-info-card:hover {
	border-color: #3b82f6;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	transform: translateY(-1px);
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
	font-weight: 700;
	font-size: 16px;
	margin: 0 auto 10px;
}

.user-details {
	text-align: center;
}

.user-name {
	font-weight: 600;
	color: #1e293b;
	font-size: 14px;
	margin-bottom: 4px;
}

.user-name.clickable {
	color: #3b82f6;
	transition: color 0.2s ease;
}

.user-name.clickable:hover {
	color: #1d4ed8;
	text-decoration: underline;
}

.user-role {
	font-size: 11px;
	color: #64748b;
	background: #f1f5f9;
	padding: 1px 6px;
	border-radius: 3px;
	margin-bottom: 3px;
	display: inline-block;
}

.club-role {
	font-size: 10px;
	color: #3b82f6;
	background: #eff6ff;
	padding: 1px 4px;
	border-radius: 2px;
	border: 1px solid #bfdbfe;
	display: inline-block;
}

.reply-time {
	font-size: 12px;
	color: #64748b;
}

/* 右侧回复内容区域 */
.reply-content-area {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.reply-content {
	color: #374151;
	font-size: 15px;
	line-height: 1.6;
	margin-bottom: 12px;
	flex: 1;
	white-space: pre-wrap;
}

.empty-replies {
	text-align: center;
	padding: 40px;
	color: #64748b;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 12px;
}

.reply-section {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.reply-header {
	margin-bottom: 16px;
}

.reply-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 700;
	color: #1e293b;
}

.reply-textarea {
	width: 100%;
	padding: 12px 16px;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	font-size: 14px;
	transition: all 0.2s;
	box-sizing: border-box;
	resize: vertical;
	min-height: 100px;
}

.reply-textarea:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reply-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}

.reply-btn {
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

.reply-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* 回复按钮样式 */
.reply-to-btn {
	padding: 6px 12px;
	background: #f1f5f9;
	color: #475569;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	transition: all 0.2s;
	align-self: flex-end;
	margin-top: auto;
}

.reply-to-btn:hover {
	background: #e2e8f0;
	border-color: #94a3b8;
}

/* 回复元信息样式 */
.reply-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 8px;
}

.reply-time {
	font-size: 12px;
	color: #64748b;
	background: #f1f5f9;
	padding: 2px 6px;
	border-radius: 4px;
}

.nested-replies {
	margin-top: 12px;
	padding-left: 16px;
	border-left: 2px solid #e2e8f0;
}

.nested-reply {
	margin-bottom: 8px;
}

.nested-reply-content {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 8px 12px;
	background: #f8fafc;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
}

.nested-author-name {
	font-weight: 600;
	color: #3b82f6;
	font-size: 14px;
	flex-shrink: 0;
}

.nested-reply-text {
	color: #374151;
	font-size: 14px;
	line-height: 1.5;
	flex: 1;
}

.nested-reply-text .mention {
	color: #dc2626 !important;
	background: #fef2f2 !important;
	padding: 1px 4px !important;
	border-radius: 3px !important;
	font-weight: 600 !important;
	border: 1px solid #fecaca !important;
	display: inline-block;
}

.nested-reply-btn {
	padding: 4px 8px;
	background: #f1f5f9;
	color: #475569;
	border: 1px solid #cbd5e1;
	border-radius: 4px;
	cursor: pointer;
	font-size: 11px;
	font-weight: 500;
	transition: all 0.2s;
	margin-left: 8px;
}

.nested-reply-btn:hover {
	background: #e2e8f0;
	border-color: #94a3b8;
}

/* 楼中楼回复元信息样式 */
.nested-reply-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 6px;
}

.nested-reply-time {
	font-size: 11px;
	color: #64748b;
	background: #f8fafc;
	padding: 1px 4px;
	border-radius: 3px;
}

/* 展开/收起按钮样式 */
.expand-section {
	margin-top: 12px;
	text-align: center;
}

.expand-btn {
	padding: 6px 12px;
	background: #f1f5f9;
	color: #475569;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	transition: all 0.2s;
}

.expand-btn:hover {
	background: #e2e8f0;
	border-color: #94a3b8;
	color: #334155;
}

/* 展开的隐藏回复样式 */
.expanded-replies {
	margin-top: 8px;
	padding-left: 20px;
	border-left: 2px solid #e2e8f0;
}


.nested-reply-form {
	margin-top: 12px;
	padding: 16px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
}

.reply-form {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.reply-textarea {
	width: 100%;
	padding: 12px;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	font-size: 14px;
	resize: vertical;
	min-height: 80px;
	box-sizing: border-box;
}

.reply-textarea:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reply-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.cancel-btn {
	padding: 8px 16px;
	background: #f8fafc;
	color: #64748b;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
}

.cancel-btn:hover {
	background: #f1f5f9;
	border-color: #94a3b8;
}

.submit-btn {
	padding: 8px 16px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s;
}

.submit-btn:hover {
	background: #2563eb;
}

.banned-notice {
	padding: 12px 16px;
	background: #fef2f2;
	color: #dc2626;
	border: 1px solid #fecaca;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	text-align: center;
	margin: 16px 0;
}
</style>
