<template>
  <div class="admin-page">
    <el-row :gutter="20">
      <!-- 左侧导航栏 -->
      <el-col :span="6">
        <el-card class="nav-card">
          <h3>管理面板</h3>
          <el-menu
            :default-active="activeMenu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="landing-pages">
              <el-icon><Document /></el-icon>
              <span>落地页管理</span>
            </el-menu-item>
            <el-menu-item index="users" v-if="isAdmin">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="artists">
              <el-icon><Microphone /></el-icon>
              <span>艺人管理</span>
            </el-menu-item>
            <el-menu-item index="password">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-menu-item>
          </el-menu>
          <div class="user-info">
            <p>当前用户: {{ currentUser }}</p>
            <p>角色: {{ userRole }}</p>
            <el-button type="danger" @click="logout">退出登录</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="18">
        <!-- 落地页管理 -->
        <div v-if="activeMenu === 'landing-pages'">
          <ItemManagement />
        </div>

        <!-- 用户管理 -->
        <div v-if="activeMenu === 'users' && isAdmin">
          <UserManagement />
        </div>

        <!-- 艺人管理 -->
        <div v-if="activeMenu === 'artists'">
          <ArtistManagement />
        </div>

        <!-- 修改密码 -->
        <div v-if="activeMenu === 'password'">
          <ChangePassword />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { Document, User, Microphone, Lock } from '@element-plus/icons-vue';
import ItemManagement from './AdminComponents/ItemManagement.vue';
import UserManagement from './AdminComponents/UserManagement.vue';
import ArtistManagement from './AdminComponents/ArtistManagement.vue';
import ChangePassword from './AdminComponents/ChangePassword.vue';

export default {
  name: 'AdminPage',
  components: {
    Document,
    User,
    Microphone,
    Lock,
    ItemManagement,
    UserManagement,
    ArtistManagement,
    ChangePassword,
  },
  setup() {
    const activeMenu = ref('landing-pages');
    const currentUser = ref('');
    const userRole = ref('');

    const isAdmin = computed(() => userRole.value === 'admin');

    const handleMenuSelect = (index) => {
      activeMenu.value = index;
    };

    const logout = () => {
      localStorage.removeItem('authToken');
      window.location.href = '/admin/login';
    };

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser.value = payload.username;
        userRole.value = payload.role || 'user';
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        logout();
      }
    };

    onMounted(() => {
      fetchUserInfo();
    });

    return {
      activeMenu,
      currentUser,
      userRole,
      isAdmin,
      handleMenuSelect,
      logout,
    };
  },
};
</script>

<style scoped>
.admin-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.nav-card {
  position: sticky;
  top: 20px;
}

.nav-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  color: #409eff;
}

.user-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.user-info p {
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
}

.user-info .el-button {
  width: 100%;
  margin-top: 10px;
}
</style>
