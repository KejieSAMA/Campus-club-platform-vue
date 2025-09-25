<template>
	<div class="operations-page">
		<div class="page-header">
			<div class="header-content">
				<h1>活动运营</h1>
				<p class="subtitle">活动数据分析与运营策略管理</p>
			</div>
		</div>

		<div class="coming-soon">
			<div class="coming-soon-icon">🚀</div>
			<h2>功能开发中</h2>
			<p>活动运营功能正在开发中，敬请期待...</p>
			<div class="features-preview">
				<div class="feature-item">
					<span>活动数据分析</span>
				</div>
				<div class="feature-item">
					<span>参与度统计</span>
				</div>
				<div class="feature-item">
					<span>活动推荐</span>
				</div>
				<div class="feature-item">
					<span>运营策略</span>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
</script>
<style scoped>
.operations-page {
	max-width: 1200px;
	margin: 0 auto;
}

.page-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
