<template>
	<div class="dashboard">
		<div class="page-header">
			<div class="header-content">
				<h1>实时数据看板</h1>
				<p class="subtitle">平台运营数据概览与趋势分析</p>
			</div>
			<button class="refresh-btn" @click="load">
				<span>🔄</span> 刷新数据
			</button>
		</div>

		<div class="kpis-grid">
			<div class="kpi-card primary">
				<div class="kpi-content">
					<div class="kpi-label">用户总数</div>
					<div class="kpi-value">{{ m.kpis.userCount || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card success">
				<div class="kpi-content">
					<div class="kpi-label">社团总数</div>
					<div class="kpi-value">{{ m.kpis.clubCount || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card warning">
				<div class="kpi-content">
					<div class="kpi-label">活动总数</div>
					<div class="kpi-value">{{ m.kpis.eventCount || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card info">
				<div class="kpi-content">
					<div class="kpi-label">报名总数</div>
					<div class="kpi-value">{{ m.kpis.signupCount || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card purple">
				<div class="kpi-content">
					<div class="kpi-label">日活用户</div>
					<div class="kpi-value">{{ m.kpis.dau || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card orange">
				<div class="kpi-content">
					<div class="kpi-label">新增申请</div>
					<div class="kpi-value">{{ m.kpis.newApplies || 0 }}</div>
				</div>
			</div>
			<div class="kpi-card teal">
				<div class="kpi-content">
					<div class="kpi-label">参与率</div>
					<div class="kpi-value">{{ m.kpis.participation || 0 }}%</div>
				</div>
			</div>
		</div>

		<div class="trends-section">
			<div class="section-header">
				<h2>7日趋势分析</h2>
				<p>平台关键指标变化趋势</p>
			</div>
			<div class="trends-grid">
				<div class="trend-card">
					<div class="trend-header">
						<div class="trend-title">用户增长</div>
					</div>
					<div class="trend-data">
						<div class="trend-numbers">{{m.trends.usersDaily.map(x => x.c).join(' → ') || '暂无数据'}}</div>
						<div class="trend-label">每日新增用户数</div>
					</div>
				</div>
				<div class="trend-card">
					<div class="trend-header">
						<div class="trend-title">社团趋势</div>
					</div>
					<div class="trend-data">
						<div class="trend-numbers">{{m.trends.clubsDaily.map(x => x.c).join(' → ') || '暂无数据'}}</div>
						<div class="trend-label">每日新增社团数</div>
					</div>
				</div>
				<div class="trend-card">
					<div class="trend-header">
						<div class="trend-title">活动趋势</div>
					</div>
					<div class="trend-data">
						<div class="trend-numbers">{{m.trends.eventsDaily.map(x => x.c).join(' → ') || '暂无数据'}}</div>
						<div class="trend-label">每日新增活动数</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import http from '../../api/http'
const m = ref({ kpis: {}, trends: { usersDaily: [], clubsDaily: [], eventsDaily: [] } })
async function load() {
	const { data } = await http.get('/admin/metrics')
	m.value = data
}
onMounted(load)
</script>
<style scoped>
.dashboard {
	max-width: 1200px;
	margin: 0 auto;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
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

.refresh-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 20px;
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 12px;
	color: white;
	cursor: pointer;
	font-weight: 500;
	transition: all 0.2s;
}

.refresh-btn:hover {
	background: rgba(255, 255, 255, 0.3);
	transform: translateY(-1px);
}

.kpis-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
	margin-bottom: 32px;
}

.kpi-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 24px;
	background: white;
	border-radius: 16px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s;
}

.kpi-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.kpi-content {
	flex: 1;
}

.kpi-label {
	color: #64748b;
	font-size: 14px;
	margin-bottom: 4px;
}

.kpi-value {
	font-size: 28px;
	font-weight: 700;
	color: #1e293b;
}

.kpi-card.primary {
	border-left: 4px solid #3b82f6;
}

.kpi-card.success {
	border-left: 4px solid #10b981;
}

.kpi-card.warning {
	border-left: 4px solid #f59e0b;
}

.kpi-card.info {
	border-left: 4px solid #06b6d4;
}

.kpi-card.purple {
	border-left: 4px solid #8b5cf6;
}

.kpi-card.orange {
	border-left: 4px solid #f97316;
}

.kpi-card.teal {
	border-left: 4px solid #14b8a6;
}

.trends-section {
	background: white;
	border-radius: 16px;
	padding: 24px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
	margin-bottom: 24px;
}

.section-header h2 {
	margin: 0 0 8px;
	font-size: 24px;
	color: #1e293b;
}

.section-header p {
	margin: 0;
	color: #64748b;
}

.trends-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 20px;
}

.trend-card {
	padding: 20px;
	background: #f8fafc;
	border-radius: 12px;
	border: 1px solid #e2e8f0;
}

.trend-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.trend-title {
	font-size: 18px;
	font-weight: 600;
	color: #1e293b;
}

.trend-data {}

.trend-numbers {
	font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	font-size: 16px;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 4px;
}

.trend-label {
	font-size: 14px;
	color: #64748b;
}
</style>
