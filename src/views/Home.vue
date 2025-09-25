<template>
  <div class="home-container">
    <h2>校园社团平台</h2>
    <p v-if="!authed">请先登录，再浏览社团、活动与消息。</p>
    <p v-else>欢迎回来，{{ userName }}！可以前往「社团 / 活动 / 消息」进行操作。</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../store/auth'

// 状态管理
const auth = useAuthStore()

// 计算属性
const authed = computed(() => !!auth.token)
const userName = computed(() => auth.user?.nickname || auth.user?.username || '用户')
</script>

<style scoped>
.home-container {
  padding: 16px;
}
</style>
