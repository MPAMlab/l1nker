<template>
  <div class="home">
    <div class="hero">
      <div class="content">
        <h1 class="title">L1nker</h1>
        <p class="subtitle">An light-weight aggregation page service</p>
        <p class="description">
          L1nker is a one-page promotional page for MPAM Laboratory internal use, but also can be deployed on your own server. 
        </p>
        <div class="actions">
          <el-button type="primary" size="large" @click="goToAdmin" v-if="isLoggedIn">
            <el-icon><Setting /></el-icon>
            Admin panel
          </el-button>
          <el-button type="primary" size="large" @click="goToLogin" v-else>
            <el-icon><User /></el-icon>
            Admin Login
          </el-button>
          <el-button size="large" @click="learnMore">
            <el-icon><InfoFilled /></el-icon>
            Learn more at GitHub
          </el-button>
        </div>
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
import { defineComponent, computed } from 'vue';
import { Setting, User, InfoFilled, Link, Picture, Monitor } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'Home',
  components: {
    Setting,
    User,
    InfoFilled,
    Link,
    Picture,
    Monitor
  },
  setup() {
    const isLoggedIn = computed(() => {
      return localStorage.getItem('authToken') !== null;
    });

    const goToAdmin = () => {
      window.location.href = '/admin';
    };

    const goToLogin = () => {
      window.location.href = '/login';
    };

    const learnMore = () => {
      window.open('https://github.com/MPAMlab/l1nker', '_blank');
    };

    return {
      isLoggedIn,
      goToAdmin,
      goToLogin,
      learnMore
    };
  }
});
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.hero {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.content {
  max-width: 800px;
}

.title {
  font-size: 64px;
  margin: 0 0 20px 0;
  font-weight: 700;
  letter-spacing: -2px;
}

.subtitle {
  font-size: 28px;
  margin: 0 0 30px 0;
  font-weight: 300;
  opacity: 0.9;
}

.description {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 40px;
  opacity: 0.8;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 80px 20px;
  background: #f8f9fa;
  flex-wrap: wrap;
}

.feature-item {
  flex: 1;
  min-width: 250px;
  max-width: 300px;
  text-align: center;
  padding: 20px;
}

.feature-item h3 {
  margin: 20px 0 10px 0;
  font-size: 24px;
  color: #333;
}

.feature-item p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.feature-item .el-icon {
  color: #667eea;
  margin-bottom: 10px;
}

.footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 40px 20px;
  margin-top: auto;
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

@media (max-width: 768px) {
  .title {
    font-size: 48px;
  }

  .subtitle {
    font-size: 24px;
  }

  .description {
    font-size: 16px;
  }

  .features {
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 60px 20px;
  }

  .title {
    font-size: 36px;
  }

  .subtitle {
    font-size: 20px;
  }

  .actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>