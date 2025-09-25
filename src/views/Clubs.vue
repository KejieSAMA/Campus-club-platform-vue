<template>
	<div class="clubs-page">
		<div class="page-header">
			<div class="header-content">
				<h1>社团中心</h1>
				<p class="subtitle">探索丰富多彩的校园社团，找到属于你的兴趣圈子</p>
			</div>
			<button class="apply-club-btn" @click="openApplyModal = true">
				申请创建社团
			</button>
		</div>

		<div class="clubs-grid">
			<div v-for="club in list" :key="club.id" class="club-card">
				<div class="club-cover">
					<img v-if="club.cover" :src="club.cover" :alt="club.name" />
					<div v-else class="default-cover">
						<span>{{ club.name.charAt(0) }}</span>
					</div>
				</div>
				<div class="club-content">
					<div class="club-header">
						<h3 class="club-name">{{ club.name }}</h3>
						<span :class="['status-badge', club.status]">{{ getStatusText(club.status) }}</span>
					</div>
					<p class="club-description">{{ club.description || '暂无简介' }}</p>
					<div class="club-meta">
						<div class="meta-item">
							<span class="meta-label">创建时间</span>
							<span class="meta-value">{{ formatDate(club.created_at) }}</span>
						</div>
						<div class="meta-item">
							<span class="meta-label">状态</span>
							<span class="meta-value">{{ getStatusText(club.status) }}</span>
						</div>
					</div>
					<div class="club-actions">
						<button class="enter-btn" @click="enterClub(club.id)">
							进入社团
						</button>
					</div>
				</div>
			</div>
		</div>

		<div v-if="list.length === 0" class="empty-state">
			<div class="empty-icon">🏢</div>
			<h3>暂无社团</h3>
			<p>还没有任何社团，快来创建第一个吧！</p>
		</div>

		<!-- 申请创建社团模态框 -->
		<div v-if="openApplyModal" class="modal-overlay" @click.self="closeApplyModal">
			<div class="modal-content">
				<div class="modal-header">
					<h3>申请创建社团</h3>
					<button class="close-btn" @click="closeApplyModal">×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>社团名称</label>
						<input v-model="applyForm.name" class="form-input" placeholder="请输入社团名称" />
					</div>
					<div class="form-group">
						<label>社团简介</label>
						<textarea v-model="applyForm.description" class="form-textarea" rows="4"
							placeholder="请描述社团的宗旨和活动内容"></textarea>
					</div>
					<div class="form-group">
						<label>封面图片URL（可选）</label>
						<input v-model="applyForm.cover" class="form-input" placeholder="请输入封面图片链接" />
					</div>
					<div class="form-group">
						<label>创建理由</label>
						<textarea v-model="applyForm.reason" class="form-textarea" rows="3"
							placeholder="请说明创建此社团的理由和必要性"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" @click="closeApplyModal">取消</button>
					<button class="btn-submit" @click="submitApplication">提交申请</button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http'
import { useAuthStore } from '../store/auth'

const list = ref([])
const openApplyModal = ref(false)
const applyForm = ref({ name: '', description: '', cover: '', reason: '' })
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

async function fetchList() {
	const { data } = await http.get('/clubs')
	list.value = (data.list || [])
}

function closeApplyModal() {
	openApplyModal.value = false
	applyForm.value = { name: '', description: '', cover: '', reason: '' }
}

async function submitApplication() {
	if (!applyForm.value.name) {
		alert('请输入社团名称')
		return
	}

	try {
		await http.post('/clubs/apply', {
			name: applyForm.value.name,
			description: applyForm.value.description,
			cover: applyForm.value.cover,
			reason: applyForm.value.reason
		})
		alert('创建申请已提交，等待管理员审核')
		closeApplyModal()
		await fetchList()
	} catch (error) {
		alert('提交失败：' + (error.response?.data?.message || error.message))
	}
}

function enterClub(clubId) {
	// 跳转到社团论坛页面
	router.push(`/club/${clubId}/forum`)
}

function getStatusText(status) {
	switch (status) {
		case 'approved': return '已通过'
		case 'pending': return '待审核'
		case 'rejected': return '已拒绝'
		case 'banned': return '已封禁'
		default: return '未知'
	}
}

function formatDate(dateString) {
	if (!dateString) return '未知'
	return new Date(dateString).toLocaleDateString('zh-CN')
}

onMounted(fetchList)
</script>
<style scoped>
.clubs-page {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
}

.page-header {
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

.apply-club-btn {
	padding: 12px 24px;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s;
}

.apply-club-btn:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-2px);
}

.clubs-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 24px;
}

.club-card {
	background: white;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s;
}

.club-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.club-cover {
	height: 200px;
	overflow: hidden;
	position: relative;
}

.club-cover img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.default-cover {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 48px;
	font-weight: 700;
}

.club-content {
	padding: 20px;
}

.club-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.club-name {
	margin: 0;
	font-size: 20px;
	font-weight: 700;
	color: #1e293b;
}

.status-badge {
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
}

.status-badge.approved {
	background: #dcfce7;
	color: #166534;
}

.status-badge.pending {
	background: #fef3c7;
	color: #92400e;
}

.status-badge.rejected {
	background: #fee2e2;
	color: #991b1b;
}

.status-badge.banned {
	background: #f3f4f6;
	color: #6b7280;
}

.club-description {
	color: #64748b;
	line-height: 1.6;
	margin-bottom: 16px;
}

.club-meta {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 20px;
}

.meta-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.meta-label {
	color: #6b7280;
	font-size: 14px;
}

.meta-value {
	color: #1e293b;
	font-weight: 500;
	font-size: 14px;
}

.club-actions {
	display: flex;
	justify-content: center;
}

.enter-btn {
	padding: 12px 24px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	transition: all 0.3s;
}

.enter-btn:hover {
	background: #2563eb;
	transform: translateY(-2px);
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
	max-width: 500px;
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
</style>
