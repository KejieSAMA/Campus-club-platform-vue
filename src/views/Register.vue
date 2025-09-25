<template>
	<div class="auth-wrap">
		<div class="auth-card">
			<div class="auth-header">
				<div class="auth-logo">CC</div>
				<h2>创建账号</h2>
				<p class="auth-sub">加入校园社团平台</p>
			</div>

			<div class="auth-body">
				<input v-model="username" class="auth-input" placeholder="用户名" />
				<input v-model="nickname" class="auth-input" placeholder="昵称（可选）" />
				<input v-model="password" class="auth-input" type="password" placeholder="密码" />
				<button class="auth-btn" @click="submit">注册</button>
			</div>

			<div class="auth-footer">
				<span>已有账号？</span>
				<router-link to="/login">去登录</router-link>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import http from '../api/http'
import { useRouter } from 'vue-router'

// 表单数据
const username = ref('')
const nickname = ref('')
const password = ref('')

// 状态管理
const auth = useAuthStore()
const router = useRouter()

/**
 * 处理注册提交
 */
async function submit() {
	if (!username.value || !password.value) {
		return alert('请输入用户名和密码')
	}

	try {
		const { data } = await http.post('/auth/register', {
			username: username.value,
			password: password.value,
			nickname: nickname.value
		})

		auth.setToken(data.token)
		auth.setUser(data.user)
		router.push('/')
	} catch (error) {
		console.error('注册失败:', error)
		alert('注册失败，请检查输入信息')
	}
}
</script>
<style scoped>
.auth-wrap {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
	padding: 24px;
}

.auth-card {
	width: 100%;
	max-width: 380px;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.auth-header {
	text-align: center;
	padding: 28px 24px 8px;
}

.auth-logo {
	width: 52px;
	height: 52px;
	margin: 0 auto 10px;
	border-radius: 12px;
	background: #4f46e5;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	letter-spacing: 1px;
}

.auth-sub {
	color: #6b7280;
	margin-top: 6px;
	font-size: 13px;
}

.auth-body {
	padding: 18px 24px 8px;
}

.auth-input {
	width: 100%;
	box-sizing: border-box;
	padding: 12px 14px;
	margin: 8px 0;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	outline: none;
	transition: border-color .2s, box-shadow .2s;
}

.auth-input:focus {
	border-color: #4f46e5;
	box-shadow: 0 0 0 3px rgba(79, 70, 229, .15);
}

.auth-btn {
	width: 100%;
	padding: 12px 14px;
	margin-top: 8px;
	background: #4f46e5;
	color: #fff;
	border: none;
	border-radius: 10px;
	cursor: pointer;
	font-weight: 600;
	transition: transform .05s ease, box-shadow .2s;
	box-shadow: 0 6px 14px rgba(79, 70, 229, .25);
}

.auth-btn:hover {
	box-shadow: 0 8px 18px rgba(79, 70, 229, .3);
}

.auth-btn:active {
	transform: scale(.99);
}

.auth-footer {
	padding: 16px 24px 24px;
	text-align: center;
	color: #6b7280;
	font-size: 14px;
}

.auth-footer a {
	color: #4f46e5;
	text-decoration: none;
	margin-left: 4px;
}
</style>
