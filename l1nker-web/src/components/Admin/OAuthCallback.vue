<template>
  <div class="callback-container">
    <el-card class="callback-card">
      <template #header>
        <div class="card-header">
          <h2>Signing you in…</h2>
        </div>
      </template>
      <div class="callback-body">
        <el-button type="primary" :loading="true">Exchanging your login</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { handleCallback } from '../../utils/oauth';

export default {
  name: 'OAuthCallback',
  async created() {
    try {
      await handleCallback();
      this.$router.replace('/admin');
    } catch (error) {
      console.error('OAuth callback failed:', error);
      this.$router.replace('/login');
    }
  },
};
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #ffffff;
}

.callback-card {
  width: 420px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.callback-body {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
</style>
