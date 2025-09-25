<template>
	<div class="admin-layout">
		<aside class="sider">
			<div class="sider-brand">ADM</div>
			<nav class="sider-nav">
				<router-link to="/admin/dashboard">仪表盘</router-link>
				<router-link to="/admin/users">用户与权限</router-link>
				<router-link to="/admin/clubs">社团管理</router-link>
				<router-link to="/admin/operations">活动运营</router-link>
				<router-link to="/admin/settings">系统配置</router-link>
			</nav>
		</aside>
		<section class="admin-content">
			<router-view />
		</section>
	</div>
</template>
<script setup>
</script>
<style scoped>
.admin-layout {
	display: grid;
	grid-template-columns: 260px 1fr;
	min-height: calc(100vh - 56px);
}

.sider {
	background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	color: #cbd5e1;
	display: flex;
	flex-direction: column;
	box-shadow: 2px 0 8px rgba(0, 0, 0, .1);
}

.sider-brand {
	padding: 20px 16px;
	font-weight: 800;
	color: #fff;
	letter-spacing: .6px;
	border-bottom: 1px solid #334155;
	display: flex;
	align-items: center;
	gap: 8px;
}

.sider-brand::before {
	content: '⚡';
	font-size: 18px;
}

.sider-nav {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 8px;
}

.sider-nav a {
	color: #cbd5e1;
	text-decoration: none;
	padding: 12px 16px;
	border-radius: 10px;
	transition: all .2s;
	display: flex;
	align-items: center;
	gap: 10px;
	font-weight: 500;
}

.sider-nav a:hover {
	background: #334155;
	color: #fff;
}

.sider-nav a.router-link-active {
	background: #3b82f6;
	color: #fff;
	box-shadow: 0 4px 12px rgba(59, 130, 246, .3);
}

.sider-nav a::before {
	content: '📊';
	font-size: 14px;
}

.sider-nav a:nth-child(2)::before {
	content: '👥';
}

.sider-nav a:nth-child(3)::before {
	content: '🏢';
}

.sider-nav a:nth-child(4)::before {
	content: '🎯';
}

.sider-nav a:nth-child(5)::before {
	content: '⚙️';
}

.admin-content {
	padding: 24px;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	min-height: calc(100vh - 56px);
}
</style>
