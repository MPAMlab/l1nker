<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      <div class="actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
    <footer class="footer">
      <p class="powered-by">
        Powered by <a href="https://github.com/MPAMlab/l1nker" target="_blank" rel="noopener noreferrer">L1nker by MPAM Laboratory.</a>
      </p>
    </footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'NotFound',
  components: {
    HomeFilled,
    ArrowLeft
  },
  methods: {
    goHome() {
      this.$router.push('/');
    },
    goBack() {
      this.$router.go(-1);
    }
  }
});
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 20px;
}

.content {
  max-width: 600px;
}

h1 {
  font-size: 120px;
  margin: 0;
  line-height: 1;
  font-weight: 700;
}

h2 {
  font-size: 36px;
  margin: 20px 0;
  font-weight: 400;
}

p {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.footer {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
}

.powered-by {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.powered-by a {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.powered-by a:hover {
  opacity: 1;
}

@media (max-width: 480px) {
  h1 {
    font-size: 80px;
  }

  h2 {
    font-size: 28px;
  }

  p {
    font-size: 16px;
  }

  .actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>