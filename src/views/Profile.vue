<template>
	<div class="profile-wrap">
		<div class="profile-header" v-if="user">
			<div class="avatar">{{ (user.nickname || user.username || 'U').slice(0, 1).toUpperCase() }}</div>
			<div class="meta">
				<h2 class="name">
					{{ user.nickname || user.username }}
					<button class="edit-link" @click="openEdit = true">编辑资料</button>
				</h2>
				<p class="muted">角色：{{ user.role }}</p>
				<p class="muted">签名：{{ user.signature || '这个人很神秘，什么也没写~' }}</p>
				<p class="muted">性别：{{ genderText(user.gender) }}<span v-if="user.birthdate"> ｜ 生日：{{ user.birthdate
				}}</span></p>
				<button class="change-password-btn" @click="openPasswordModal = true">修改密码</button>
			</div>
			<div class="stats">
				<div class="stat"><span class="num">{{ memberships.length }}</span><span class="label">社团</span></div>
				<div class="stat"><span class="num">{{ signups.length }}</span><span class="label">报名</span></div>
				<div class="stat"><span class="num">{{ unreadCount }}</span><span class="label">未读</span></div>
			</div>
		</div>

		<div class="grid">
			<section class="card">
				<h3>我加入的社团</h3>
				<div v-if="memberships && memberships.length > 0" class="list">
					<div v-for="m in memberships" :key="m.id" class="list-item">
						<div class="list-title">{{ m.club?.name }}</div>
						<div class="list-sub">{{ m.club?.description || '—' }}</div>
					</div>
				</div>
				<div v-else class="empty-state">
					<p>还没有加入任何社团</p>
					<p class="debug-info">调试信息：memberships = {{ memberships }}, 长度 = {{ memberships?.length || 0 }}</p>
				</div>
			</section>

			<section class="card">
				<h3>我的活动报名</h3>
				<div v-if="signups && signups.length > 0" class="list">
					<div v-for="s in signups" :key="s.id" class="list-item">
						<div class="list-title">{{ s.Event?.title }}</div>
						<div class="list-sub">状态：<span :class="['pill', s.status]">{{ s.status }}</span></div>
					</div>
				</div>
				<div v-else class="empty-state">
					<p>还没有报名任何活动</p>
					<p class="debug-info">调试信息：signups = {{ signups }}, 长度 = {{ signups?.length || 0 }}</p>
				</div>
			</section>
		</div>

		<!-- 我发布的主题帖 -->
		<section class="card posts-section">
			<h3>我发布的主题帖</h3>
			<div v-if="userPosts && userPosts.length > 0" class="posts-list">
				<div v-for="post in userPosts" :key="post.id" class="post-card"
					@click="goToPost(post.club_id, post.id)">
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
			<div v-else class="empty-posts">
				<p>还没有发布过主题帖</p>
				<p class="debug-info">调试信息：userPosts = {{ userPosts }}, 长度 = {{ userPosts?.length || 0 }}</p>
			</div>
		</section>

		<!-- 我收藏的主题帖 -->
		<section class="card posts-section">
			<h3>我收藏的主题帖</h3>
			<div v-if="favoritePosts && favoritePosts.length > 0" class="posts-list">
				<div v-for="favorite in favoritePosts" :key="favorite.id" class="post-card"
					@click="goToPost(favorite.post?.club_id, favorite.post?.id)">
					<div class="post-header">
						<div class="post-title">{{ favorite.post?.title }}</div>
						<div class="post-club">来自：{{ favorite.post?.club?.name }}</div>
					</div>
					<div class="post-content">{{ favorite.post?.content }}</div>
					<div class="post-meta">
						<span class="post-time">收藏于：{{ formatDateTime(favorite.created_at) }}</span>
						<span class="post-stats">
							<span>👁 {{ favorite.post?.view_count || 0 }}</span>
							<span>💬 {{ favorite.post?.reply_count || 0 }}</span>
						</span>
					</div>
				</div>
			</div>
			<div v-else class="empty-posts">
				<p>还没有收藏任何主题帖</p>
				<p class="debug-info">调试信息：favoritePosts = {{ favoritePosts }}, 长度 = {{ favoritePosts?.length || 0 }}
				</p>
			</div>
		</section>

		<!-- 编辑资料悬浮框 -->
		<div v-if="openEdit" class="modal" @click.self="openEdit = false">
			<div class="dialog">
				<h3>编辑资料</h3>
				<div class="form">
					<label>昵称</label>
					<input v-model="form.nickname" class="input" placeholder="请输入昵称" />
					<label>签名</label>
					<input v-model="form.signature" class="input" placeholder="介绍一下你自己" />
					<label>性别</label>
					<select v-model="form.gender" class="input">
						<option value="unknown">未知</option>
						<option value="male">男</option>
						<option value="female">女</option>
						<option value="other">其他</option>
					</select>
					<label>生日</label>
					<input v-model="form.birthdate" type="date" class="input" />
				</div>
				<div class="dialog-actions">
					<button class="btn ghost" @click="openEdit = false">取消</button>
					<button class="btn" @click="handleSave">保存</button>
				</div>
			</div>
		</div>

		<!-- 修改密码悬浮框 -->
		<div v-if="openPasswordModal" class="modal" @click.self="openPasswordModal = false">
			<div class="dialog">
				<h3>修改密码</h3>
				<div class="form">
					<label>当前密码</label>
					<input v-model="passwordForm.oldPassword" type="password" class="input" placeholder="请输入当前密码" />
					<label>新密码</label>
					<input v-model="passwordForm.newPassword" type="password" class="input" placeholder="请输入新密码" />
					<label>确认新密码</label>
					<input v-model="passwordForm.confirmPassword" type="password" class="input"
						placeholder="请再次输入新密码" />
				</div>
				<div class="dialog-actions">
					<button class="btn ghost" @click="openPasswordModal = false">取消</button>
					<button class="btn" @click="handleChangePassword">确认修改</button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http'

const user = ref(null)
const memberships = ref([])
const signups = ref([])
const unreadCount = ref(0)
const userPosts = ref([])
const favoritePosts = ref([])
const form = ref({ nickname: '', signature: '', gender: 'unknown', birthdate: '' })
const openEdit = ref(false)
const openPasswordModal = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

async function load() {
	const { data } = await http.get('/user/overview')
	console.log('Overview API response:', data)
	user.value = data.user
	memberships.value = data.memberships || []
	signups.value = data.signups || []
	unreadCount.value = data.unreadCount || 0
	console.log('Memberships loaded:', memberships.value)
	form.value = {
		nickname: data.user?.nickname || '',
		signature: data.user?.signature || '',
		gender: data.user?.gender || 'unknown',
		birthdate: data.user?.birthdate || ''
	}

	// 加载用户发布的帖子和收藏的帖子
	if (user.value && user.value.id) {
		await Promise.all([
			loadUserPosts(),
			loadFavoritePosts()
		])
	}
}

// 加载用户发布的帖子
async function loadUserPosts() {
	try {
		console.log('Loading user posts for user ID:', user.value.id)
		const { data } = await http.get(`/user/${user.value.id}/posts`)
		console.log('User posts response:', data)
		userPosts.value = data.posts || []
		console.log('User posts loaded:', userPosts.value.length, 'posts')
	} catch (error) {
		console.error('Failed to load user posts:', error)
		userPosts.value = []
	}
}

// 加载用户收藏的帖子
async function loadFavoritePosts() {
	try {
		console.log('Loading favorite posts for user ID:', user.value.id)
		const { data } = await http.get('/favorite')
		console.log('Favorite posts response:', data)
		favoritePosts.value = data.favorites || []
		console.log('Favorite posts loaded:', favoritePosts.value.length, 'posts')
	} catch (error) {
		console.error('Failed to load favorite posts:', error)
		favoritePosts.value = []
	}
}

async function save() {
	await http.put('/user/profile', form.value)
	await load()
}

async function handleSave() {
	await save()
	openEdit.value = false
}

async function handleChangePassword() {
	if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
		alert('请填写所有字段')
		return
	}

	if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
		alert('新密码和确认密码不一致')
		return
	}

	try {
		await http.post('/auth/change-password', {
			oldPassword: passwordForm.value.oldPassword,
			newPassword: passwordForm.value.newPassword
		})
		alert('密码修改成功！')
		openPasswordModal.value = false
		passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
	} catch (error) {
		alert('密码修改失败：' + (error.response?.data?.message || error.message))
	}
}

onMounted(load)
</script>
<script>
export default {
	methods: {
		genderText(g) {
			switch (g) {
				case 'male': return '男'
				case 'female': return '女'
				case 'other': return '其他'
				default: return '未知'
			}
		}
	}
}

// 跳转到帖子详情页
function goToPost(clubId, postId) {
	if (clubId && postId) {
		window.location.href = `/club/${clubId}/post/${postId}`
	}
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
</script>
<style scoped>
.profile-wrap {
	padding: 16px;
	margin: 20px;
	max-width: 1200px;
	margin-left: auto;
	margin-right: auto;
}

.profile-header {
	display: flex;
	align-items: center;
	gap: 16px;
	background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
	border: 1px solid #eef2f7;
	border-radius: 16px;
	padding: 16px;
	box-shadow: 0 6px 16px rgba(0, 0, 0, .04);
}

.avatar {
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: #4f46e5;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	font-weight: 700;
}

.meta h2 {
	margin: 0;
}

.name {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.edit-link {
	padding: 6px 10px;
	border: 1px solid #e5e7eb;
	border-radius: 999px;
	background: #fff;
	cursor: pointer;
	font-size: 12px;
	color: #4b5563;
}

.edit-link:hover {
	border-color: #c7cad1;
}

.muted {
	color: #6b7280;
	margin: 6px 0 0;
}

.stats {
	margin-left: auto;
	display: flex;
	gap: 16px;
}

.stat {
	text-align: center;
}

.num {
	font-size: 18px;
	font-weight: 700;
	color: #111827;
}

.label {
	display: block;
	color: #6b7280;
	font-size: 12px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 16px;
	margin-top: 16px;
}

.card {
	background: #fff;
	border: 1px solid #eef2f7;
	border-radius: 14px;
	padding: 14px;
	box-shadow: 0 6px 16px rgba(0, 0, 0, .04);
}

.card h3 {
	margin: 6px 0 12px;
}

.list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0;
}

.list-item {
	padding: 12px 16px;
	margin-bottom: 8px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #fafbfc;
	transition: all 0.2s ease;
}

.list-item:hover {
	border-color: #3b82f6;
	background: #f8fafc;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.list-item:last-child {
	margin-bottom: 0;
}

.list-title {
	font-weight: 600;
	color: #111827;
}

.list-sub {
	color: #6b7280;
	font-size: 13px;
	margin-top: 2px;
}

.pill {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 12px;
	background: #eef2ff;
	color: #4f46e5;
}

.pill.approved {
	background: #ecfdf5;
	color: #059669;
}

.pill.rejected {
	background: #fef2f2;
	color: #dc2626;
}

.pill.pending {
	background: #fffbeb;
	color: #b45309;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.form label {
	font-size: 12px;
	color: #6b7280;
}

.input {
	width: 100%;
	box-sizing: border-box;
	padding: 10px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
}

.btn {
	align-self: flex-start;
	margin-top: 6px;
	padding: 10px 14px;
	background: #4f46e5;
	color: #fff;
	border: none;
	border-radius: 10px;
	box-shadow: 0 6px 14px rgba(79, 70, 229, .18);
	cursor: pointer;
}

.btn.ghost {
	background: #fff;
	color: #374151;
	border: 1px solid #e5e7eb;
	box-shadow: none;
}

.modal {
	position: fixed;
	inset: 0;
	background: rgba(17, 24, 39, .45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	z-index: 1000;
}

.dialog {
	width: 100%;
	max-width: 520px;
	background: #fff;
	border-radius: 14px;
	border: 1px solid #eef2f7;
	box-shadow: 0 20px 50px rgba(0, 0, 0, .2);
	padding: 16px;
}

.dialog h3 {
	margin: 4px 0 12px;
}

.dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 12px;
}

.change-password-btn {
	padding: 6px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	background: #fff;
	cursor: pointer;
	font-size: 12px;
	color: #4b5563;
	margin-top: 8px;
}

.change-password-btn:hover {
	border-color: #c7cad1;
	background: #f9fafb;
}

/* 帖子相关样式 */
.posts-section {
	margin-top: 20px;
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
	line-clamp: 3;
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

.empty-posts {
	text-align: center;
	padding: 40px 20px;
	color: #64748b;
}

.debug-info {
	font-size: 12px;
	color: #94a3b8;
	margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.profile-wrap {
		margin: 10px;
		padding: 12px;
	}

	.profile-header {
		flex-direction: column;
		text-align: center;
		gap: 12px;
	}

	.stats {
		justify-content: center;
	}

	.grid {
		grid-template-columns: 1fr;
		gap: 16px;
	}

	.post-card {
		padding: 16px;
	}

	.post-header {
		flex-direction: column;
		gap: 8px;
	}

	.post-club {
		margin-left: 0;
		align-self: flex-start;
	}

	.list-item {
		padding: 10px 12px;
		margin-bottom: 6px;
	}
}
</style>
