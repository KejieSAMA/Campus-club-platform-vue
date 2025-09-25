<template>
	<div class="users-page">
		<div class="page-header">
			<div class="header-content">
				<h1>用户与权限管理</h1>
				<p class="subtitle">管理系统用户账户与权限分配</p>
			</div>
		</div>

		<div class="search-section">
			<div class="search-box">
				<input v-model="q" class="search-input" placeholder="搜索用户名或昵称..." />
				<button class="search-btn" @click="load">
					<span>🔍</span> 搜索
				</button>
			</div>
		</div>

		<div class="users-list">
			<div v-for="u in list" :key="u.id" class="user-row">
				<div class="user-avatar">
					{{ (u.nickname || u.username || 'U').slice(0, 1).toUpperCase() }}
				</div>
				<div class="user-info">
					<div class="user-name">
						{{ u.username }}
						<span :class="['role-badge', u.role]">{{ u.role }}</span>
						<span v-if="u.status === 'banned'" class="status-badge banned">已封禁</span>
					</div>
					<div class="user-details">
						<div class="detail-item">
							<span class="label">昵称：</span>
							<span class="value">{{ u.nickname || '—' }}</span>
						</div>
						<div class="detail-item">
							<span class="label">性别：</span>
							<span class="value">{{ u.gender || 'unknown' }}</span>
						</div>
					</div>
				</div>
				<div class="user-actions">
					<select v-if="u.role !== 'admin'" v-model="u._role" class="role-select">
						<option value="student">学生</option>
						<option value="teacher">教师</option>
					</select>
					<div v-else class="admin-role-display">管理员</div>
					<button v-if="u.role !== 'admin'" class="save-btn" @click="saveRole(u)"
						:disabled="u._role === u.role">
						保存
					</button>
					<button v-if="u.status === 'active'" class="ban-btn" @click="banUser(u)">
						封禁
					</button>
					<button v-else class="unban-btn" @click="unbanUser(u)">
						解封
					</button>
					<button class="reset-password-btn" @click="resetPassword(u)">
						重置密码
					</button>
				</div>
			</div>
		</div>

		<div v-if="list.length === 0" class="empty-state">
			<div class="empty-icon">👥</div>
			<h3>暂无用户数据</h3>
			<p>请尝试调整搜索条件</p>
		</div>

		<!-- 封禁用户模态框 -->
		<div v-if="showBanModal" class="modal-overlay" @click.self="closeBanModal">
			<div class="modal-content">
				<div class="modal-header">
					<h3>{{ banForm.action === 'ban' ? '封禁用户' : '解封用户' }}</h3>
					<button class="close-btn" @click="closeBanModal">×</button>
				</div>
				<div class="modal-body">
					<div v-if="banForm.action === 'ban'" class="form-group">
						<label>封禁原因</label>
						<textarea v-model="banForm.reason" class="form-textarea" rows="3"
							placeholder="请输入封禁原因..."></textarea>
					</div>
					<div v-else class="form-group">
						<p>确定要解封用户 <strong>{{ banForm.userName }}</strong> 吗？</p>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" @click="closeBanModal">取消</button>
					<button class="btn-confirm" @click="confirmBan">{{ banForm.action === 'ban' ? '确认封禁' : '确认解封'
						}}</button>
				</div>
			</div>
		</div>

		<!-- 重置密码模态框 -->
		<div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
			<div class="modal-content">
				<div class="modal-header">
					<h3>重置密码</h3>
					<button class="close-btn" @click="closeResetModal">×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<p>确定要重置用户 <strong>{{ resetForm.userName }}</strong> 的密码吗？</p>
						<p class="reset-info">重置后的密码为：<code>sc@123456</code></p>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" @click="closeResetModal">取消</button>
					<button class="btn-confirm" @click="confirmReset">确认重置</button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue'
import http from '../../api/http'
const q = ref('')
const list = ref([])
const showBanModal = ref(false)
const showResetModal = ref(false)
const banForm = ref({ userId: null, userName: '', action: 'ban', reason: '' })
const resetForm = ref({ userId: null, userName: '' })
async function load() {
	const { data } = await http.get('/admin/users', { params: { q: q.value } })
	list.value = (data.list || []).map(x => ({ ...x, _role: x.role }))
}
async function saveRole(u) {
	if (u._role === u.role) return
	await http.post('/admin/users/role', { userId: u.id, role: u._role })
	u.role = u._role
}

function banUser(u) {
	banForm.value = {
		userId: u.id,
		userName: u.username,
		action: 'ban',
		reason: ''
	}
	showBanModal.value = true
}

function unbanUser(u) {
	banForm.value = {
		userId: u.id,
		userName: u.username,
		action: 'unban',
		reason: ''
	}
	showBanModal.value = true
}

function closeBanModal() {
	showBanModal.value = false
	banForm.value = { userId: null, userName: '', action: 'ban', reason: '' }
}

async function confirmBan() {
	try {
		await http.post('/admin/users/ban', {
			userId: banForm.value.userId,
			action: banForm.value.action,
			reason: banForm.value.reason
		})

		// 找到对应的用户并更新状态
		const user = list.value.find(u => u.id === banForm.value.userId)
		if (user) {
			if (banForm.value.action === 'ban') {
				user.status = 'banned'
				user.bannedAt = new Date().toISOString()
				user.banReason = banForm.value.reason || '违反平台规定'
			} else {
				user.status = 'active'
				user.bannedAt = null
				user.banReason = null
			}
		}

		alert(banForm.value.action === 'ban' ? '用户已封禁' : '用户已解封')
		closeBanModal()
	} catch (error) {
		alert((banForm.value.action === 'ban' ? '封禁' : '解封') + '失败：' + (error.response?.data?.message || error.message))
	}
}

function resetPassword(user) {
	resetForm.value = {
		userId: user.id,
		userName: user.username
	}
	showResetModal.value = true
}

function closeResetModal() {
	showResetModal.value = false
	resetForm.value = { userId: null, userName: '' }
}

async function confirmReset() {
	try {
		await http.post('/admin/users/reset-password', { userId: resetForm.value.userId })
		alert('密码重置成功！新密码为：sc@123456')
		closeResetModal()
	} catch (error) {
		alert('密码重置失败：' + (error.response?.data?.message || error.message))
	}
}

load()
</script>
<style scoped>
.users-page {
	max-width: 1200px;
	margin: 0 auto;
}

.page-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.search-btn:hover {
	background: #2563eb;
	transform: translateY(-1px);
}

.users-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.user-row {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px;
	background: white;
	border-radius: 16px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s;
}

.user-row:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.user-avatar {
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

.user-info {
	flex: 1;
}

.user-name {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 18px;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 8px;
}

.role-badge {
	padding: 4px 8px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 500;
}

.role-badge.student {
	background: #dbeafe;
	color: #1d4ed8;
}

.role-badge.teacher {
	background: #f0f9ff;
	color: #0369a1;
}

.role-badge.admin {
	background: #fef3c7;
	color: #d97706;
}

.status-badge {
	margin-left: 6px;
	padding: 2px 6px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.banned {
	background: #fee2e2;
	color: #dc2626;
}

.user-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.detail-item {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 14px;
}

.label {
	color: #64748b;
}

.value {
	color: #1e293b;
	font-weight: 500;
}

.user-actions {
	display: flex;
	flex-direction: row;
	gap: 8px;
	flex-wrap: wrap;
}

.role-select {
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	background: white;
	font-size: 14px;
}

.admin-role-display {
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	background: #f3f4f6;
	color: #6b7280;
	font-size: 14px;
	text-align: center;
	min-width: 80px;
}

.save-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
	background: #059669;
}

.save-btn:disabled {
	background: #9ca3af;
	cursor: not-allowed;
}

.ban-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
}

.ban-btn:hover {
	background: #dc2626;
}

.unban-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
}

.unban-btn:hover {
	background: #059669;
}

.empty-state {
	text-align: center;
	padding: 60px 20px;
}

.empty-icon {
	font-size: 48px;
	margin-bottom: 16px;
}

.empty-state h3 {
	margin: 0 0 8px;
	font-size: 20px;
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

.form-textarea {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 14px;
	box-sizing: border-box;
}

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
.btn-confirm {
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

.btn-confirm {
	background: #ef4444;
	color: white;
}

.btn-confirm:hover {
	background: #dc2626;
}

.reset-password-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #f59e0b;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
}

.reset-password-btn:hover {
	background: #d97706;
}

.reset-info {
	margin-top: 12px;
	padding: 12px;
	background: #f3f4f6;
	border-radius: 8px;
	border-left: 4px solid #3b82f6;
}

.reset-info code {
	background: #1f2937;
	color: #f9fafb;
	padding: 2px 6px;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
}
</style>
