<template>
	<div class="settings-page">
		<div class="page-header">
			<div class="header-content">
				<h1>系统配置</h1>
				<p class="subtitle">系统参数配置与平台设置管理</p>
			</div>
		</div>

		<div class="coming-soon">
			<div class="coming-soon-icon">🔧</div>
			<h2>功能开发中</h2>
			<p>系统配置功能正在开发中，敬请期待...</p>
			<div class="features-preview">
				<div class="feature-item">
					<span>平台设置</span>
				</div>
				<div class="feature-item">
					<span>权限配置</span>
				</div>
				<div class="feature-item">
					<span>通知设置</span>
				</div>
				<div class="feature-item">
					<span>安全策略</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
</script>
<style scoped>
.settings-page {
	max-width: 1200px;
	margin: 0 auto;
}

.page-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
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

.coming-soon {
	text-align: center;
	padding: 80px 20px;
	background: white;
	border-radius: 16px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.coming-soon-icon {
	font-size: 64px;
	margin-bottom: 24px;
}

.coming-soon h2 {
	margin: 0 0 16px;
	font-size: 32px;
	color: #1e293b;
}

.coming-soon p {
	margin: 0 0 32px;
	color: #64748b;
	font-size: 18px;
}

.features-preview {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
	max-width: 600px;
	margin: 0 auto;
}

.feature-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background: #f8fafc;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
}

.feature-icon {
	font-size: 20px;
}

.feature-item span:last-child {
	color: #1e293b;
	font-weight: 500;
}
</style>
