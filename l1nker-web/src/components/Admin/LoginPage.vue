<template>
  <div class="login-container">
    <div class="login-card">
      <el-card>
        <template #header>
          <div class="card-header">
            <h2>Redirecting to MPAM Lab SSO…</h2>
          </div>
        </template>
        <div class="login-body">
          <el-button type="primary" :loading="true">Signing you in with MPAM Lab</el-button>
          <div class="login-hint">
            You will be taken to <strong>auth.mpam-lab.xyz</strong> to sign in with your
            MPAM Lab account, then returned here automatically.
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { startLogin } from '../../utils/oauth';

export default {
  name: 'LoginPage',
  created() {
    // Kick off the OAuth flow immediately (SSO: if already signed in at the
    // IDaaS, this returns instantly without a login page).
    startLogin();
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #ffffff;
}

.login-card {
  width: 420px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.login-hint {
  font-size: 13px;
  color: #888;
  text-align: center;
  line-height: 1.5;
}
</style>
