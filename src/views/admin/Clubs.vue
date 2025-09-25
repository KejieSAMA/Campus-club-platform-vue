<template>
	<div class="clubs-page">
		<div class="page-header">
			<div class="header-content">
				<h1>社团管理</h1>
				<p class="subtitle">审核学生社团申请，管理社团生命周期</p>
			</div>
		</div>

		<div class="search-section">
			<div class="search-box">
				<input v-model="keyword" class="search-input" placeholder="搜索社团名称..." />
				<button class="search-btn" @click="load">
					<span>🔄</span> 刷新
				</button>
			</div>
		</div>

		<div class="clubs-grid">
			<div class="clubs-section">
				<div class="section-header">
					<h2>待审核社团</h2>
					<span class="count-badge">{{ filteredPending.length }}</span>
				</div>
				<div class="clubs-list">
					<div v-for="c in filteredPending" :key="c.id" class="club-card pending">
						<div class="club-info">
							<div class="club-name">{{ c.name }}</div>
							<div class="club-desc">{{ c.description || '暂无描述' }}</div>
						</div>
						<div class="club-actions">
							<button class="action-btn approve" @click="review(c.id, true)">
								通过
							</button>
							<button class="action-btn reject" @click="review(c.id, false)">
								拒绝
							</button>
						</div>
					</div>
					<div v-if="filteredPending.length === 0" class="empty-state">
						<div class="empty-icon">📋</div>
						<p>暂无待审核社团</p>
					</div>
				</div>
			</div>

			<div class="clubs-section">
				<div class="section-header">
					<h2>已通过社团</h2>
					<span class="count-badge success">{{ filteredApproved.length }}</span>
				</div>
				<div class="clubs-list">
					<div v-for="c in filteredApproved" :key="c.id" class="club-card approved">
						<div class="club-info">
							<div class="club-name">
								{{ c.name }}
								<span v-if="c.status === 'banned'" class="status-badge banned">已封禁</span>
							</div>
							<div class="club-desc">{{ c.description || '暂无描述' }}</div>
							<div v-if="c.status === 'banned'" class="ban-info">
								<small>封禁时间：{{ formatDate(c.bannedAt) }}</small>
								<small>封禁原因：{{ c.banReason || '无' }}</small>
							</div>
						</div>
						<div class="club-actions">
							<button class="action-btn edit" @click="editClub(c)">
								编辑
							</button>
							<button v-if="c.status === 'approved'" class="action-btn ban" @click="banClub(c)">
								封禁
							</button>
							<button v-else class="action-btn unban" @click="unbanClub(c)">
								解封
							</button>
						</div>
					</div>
					<div v-if="filteredApproved.length === 0" class="empty-state">
						<div class="empty-icon">🏢</div>
						<p>暂无已通过社团</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 编辑社团模态框 -->
		<div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
			<div class="modal-content">
				<div class="modal-header">
					<h3>编辑社团信息</h3>
					<button class="close-btn" @click="closeEditModal">×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>社团名称</label>
						<input v-model="editForm.name" class="form-input" />
					</div>
					<div class="form-group">
						<label>社团简介</label>
						<textarea v-model="editForm.description" class="form-textarea" rows="4"></textarea>
					</div>
					<div class="form-group">
						<label>封面图片URL</label>
						<input v-model="editForm.cover" class="form-input" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" @click="closeEditModal">取消</button>
					<button class="btn-save" @click="saveClub">保存</button>
				</div>
			</div>
		</div>

		<!-- 封禁社团模态框 -->
		<div v-if="showBanModal" class="modal-overlay" @click.self="closeBanModal">
			<div class="modal-content">
				<div class="modal-header">
					<h3>{{ banForm.action === 'ban' ? '封禁社团' : '解封社团' }}</h3>
					<button class="close-btn" @click="closeBanModal">×</button>
				</div>
				<div class="modal-body">
					<div v-if="banForm.action === 'ban'" class="form-group">
						<label>封禁原因</label>
						<textarea v-model="banForm.reason" class="form-textarea" rows="3"
							placeholder="请输入封禁原因..."></textarea>
					</div>
					<div v-else class="form-group">
						<p>确定要解封社团 <strong>{{ banForm.clubName }}</strong> 吗？</p>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" @click="closeBanModal">取消</button>
					<button class="btn-confirm" @click="confirmBan">{{ banForm.action === 'ban' ? '确认封禁' : '确认解封'
						}}</button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue'
import http from '../../api/http'
const pending = ref([])
const approved = ref([])
const keyword = ref('')
const showEditModal = ref(false)
const showBanModal = ref(false)
const editForm = ref({ id: null, name: '', description: '', cover: '' })
const banForm = ref({ clubId: null, clubName: '', action: 'ban', reason: '' })

async function load() {
	const [pRes, aRes] = await Promise.all([
		http.get('/clubs/admin/pending'),
		http.get('/clubs')
	])
	pending.value = pRes.data.list || []
	approved.value = aRes.data.list || []
}
load()

async function review(clubId, approve) {
	await http.post('/clubs/admin/review', { clubId, approve })
	await load()
}

async function editClub(club) {
	editForm.value = {
		id: club.id,
		name: club.name,
		description: club.description || '',
		cover: club.cover || ''
	}
	showEditModal.value = true
}

function closeEditModal() {
	showEditModal.value = false
	editForm.value = { id: null, name: '', description: '', cover: '' }
}

async function saveClub() {
	try {
		await http.put(`/admin/clubs/${editForm.value.id}`, {
			name: editForm.value.name,
			description: editForm.value.description,
			cover: editForm.value.cover
		})
		alert('社团信息更新成功！')
		closeEditModal()
		await load()
	} catch (error) {
		alert('更新失败：' + (error.response?.data?.message || error.message))
	}
}

function banClub(club) {
	banForm.value = {
		clubId: club.id,
		clubName: club.name,
		action: 'ban',
		reason: ''
	}
	showBanModal.value = true
}

function unbanClub(club) {
	banForm.value = {
		clubId: club.id,
		clubName: club.name,
		action: 'unban',
		reason: ''
	}
	showBanModal.value = true
}

function closeBanModal() {
	showBanModal.value = false
	banForm.value = { clubId: null, clubName: '', action: 'ban', reason: '' }
}

async function confirmBan() {
	try {
		await http.post('/admin/clubs/ban', {
			clubId: banForm.value.clubId,
			action: banForm.value.action,
			reason: banForm.value.reason
		})

		// 找到对应的社团并更新状态
		const club = approved.value.find(c => c.id === banForm.value.clubId)
		if (club) {
			if (banForm.value.action === 'ban') {
				club.status = 'banned'
				club.bannedAt = new Date().toISOString()
				club.banReason = banForm.value.reason || '违反平台规定'
			} else {
				club.status = 'approved'
				club.bannedAt = null
				club.banReason = null
			}
		}

		alert(banForm.value.action === 'ban' ? '社团已封禁' : '社团已解封')
		closeBanModal()
	} catch (error) {
		alert((banForm.value.action === 'ban' ? '封禁' : '解封') + '失败：' + (error.response?.data?.message || error.message))
	}
}

function formatDate(dateString) {
	if (!dateString) return '无'
	return new Date(dateString).toLocaleString('zh-CN')
}

const filteredPending = computed(() => (pending.value || []).filter(c => !keyword.value || c.name.includes(keyword.value)))
const filteredApproved = computed(() => (approved.value || []).filter(c => !keyword.value || c.name.includes(keyword.value)))
</script>
<style scoped>
.clubs-page {
	max-width: 1200px;
	margin: 0 auto;
}

.page-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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

.search-section {
	margin-bottom: 24px;
}

.search-box {
	display: flex;
	gap: 12px;
	align-items: center;
}

.search-input {
	flex: 1;
	padding: 12px 16px;
	border: 2px solid #e2e8f0;
	border-radius: 12px;
	font-size: 16px;
	transition: all 0.2s;
}

.search-input:focus {
	outline: none;
	border-color: #f59e0b;
	box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.search-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	background: #f59e0b;
	color: white;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.search-btn:hover {
	background: #d97706;
	transform: translateY(-1px);
}

.clubs-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 24px;
}

.clubs-section {
	background: white;
	border-radius: 16px;
	padding: 20px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16px;
}

.section-header h2 {
	margin: 0;
	font-size: 20px;
	color: #1e293b;
}

.count-badge {
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 14px;
	font-weight: 600;
	background: #fef3c7;
	color: #d97706;
}

.count-badge.success {
	background: #d1fae5;
	color: #059669;
}

.clubs-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.club-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px;
	border-radius: 12px;
	transition: all 0.2s;
}

.club-card.pending {
	background: #fef3c7;
	border: 1px solid #fbbf24;
}

.club-card.approved {
	background: #d1fae5;
	border: 1px solid #34d399;
}

.club-info {
	flex: 1;
}

.club-name {
	font-size: 18px;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 4px;
}

.club-desc {
	color: #64748b;
	font-size: 14px;
}

.club-actions {
	display: flex;
	gap: 8px;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s;
}

.action-btn.approve {
	background: #10b981;
	color: white;
}

.action-btn.approve:hover {
	background: #059669;
	transform: translateY(-1px);
}

.action-btn.reject {
	background: #ef4444;
	color: white;
}

.action-btn.reject:hover {
	background: #dc2626;
	transform: translateY(-1px);
}

.action-btn.edit {
	background: #3b82f6;
	color: white;
}

.action-btn.edit:hover {
	background: #2563eb;
	transform: translateY(-1px);
}

.action-btn.ban {
	background: #ef4444;
	color: white;
}

.action-btn.ban:hover {
	background: #dc2626;
	transform: translateY(-1px);
}

.action-btn.unban {
	background: #10b981;
	color: white;
}

.action-btn.unban:hover {
	background: #059669;
	transform: translateY(-1px);
}

.status-badge {
	margin-left: 8px;
	padding: 2px 6px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.banned {
	background: #fee2e2;
	color: #dc2626;
}

.ban-info {
	margin-top: 8px;
	color: #64748b;
	font-size: 12px;
}

.ban-info small {
	display: block;
	margin-bottom: 2px;
}

.empty-state {
	text-align: center;
	padding: 40px 20px;
}

.empty-icon {
	font-size: 32px;
	margin-bottom: 8px;
}

.empty-state p {
	margin: 0;
	color: #64748b;
	font-size: 14px;
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
	max-height: 90vh;
	overflow-y: auto;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px;
	border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
	margin: 0;
	font-size: 18px;
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
	padding: 20px;
}

.form-group {
	margin-bottom: 16px;
}

.form-group label {
	display: block;
	margin-bottom: 6px;
	font-weight: 500;
	color: #374151;
}

.form-input,
.form-textarea {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
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
	padding: 20px;
	border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-save {
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
}

.btn-cancel {
	background: #f3f4f6;
	color: #374151;
}

.btn-save {
	background: #3b82f6;
	color: white;
}

.btn-save:hover {
	background: #2563eb;
}

.btn-confirm {
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	background: #ef4444;
	color: white;
}

.btn-confirm:hover {
	background: #dc2626;
}
</style>
