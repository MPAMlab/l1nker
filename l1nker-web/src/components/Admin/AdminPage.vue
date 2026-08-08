<template>
  <div class="admin-page">
    <!-- 顶部导航栏 -->
    <el-header class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <h2>L1nker 管理后台</h2>
        </div>
        <div class="header-right">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ getCurrentPageName() }}</el-breadcrumb-item>
          </el-breadcrumb>
          <el-dropdown @command="handleDropdownCommand">
            <span class="user-dropdown">
              {{ currentUser }}<el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧导航栏 -->
      <el-col :span="6">
        <el-card class="nav-card">
          <h3>管理面板</h3>
          <el-menu
            :default-active="activeMenu"
            @select="handleMenuSelect"
          >
            <!-- 所有用户都能看到的菜单项 -->
            <el-menu-item index="landing-pages">
              <el-icon><Document /></el-icon>
              <span>落地页管理</span>
            </el-menu-item>

            <!-- 仅管理员可见 -->
            <el-menu-item index="users" v-if="isAdmin">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>

            <!-- 艺人管理 - 管理员看到所有，普通用户只看到自己的 -->
            <el-menu-item index="artists">
              <el-icon><Microphone /></el-icon>
              <span>{{ isAdmin ? '艺人管理' : '我的艺人页' }}</span>
            </el-menu-item>

            <!-- 所有用户都能修改密码 -->
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
          <router-view />
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
import { Document, User, Microphone, Lock, ArrowDown } from '@element-plus/icons-vue';
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
    ArrowDown,
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

    const handleDropdownCommand = (command) => {
      if (command === 'logout') {
        logout();
      } else if (command === 'password') {
        activeMenu.value = 'password';
      }
    };

    const getCurrentPageName = () => {
      const pageNames = {
        'landing-pages': '落地页管理',
        'users': '用户管理',
        'artists': isAdmin.value ? '艺人管理' : '我的艺人页',
        'password': '修改密码'
      };
      return pageNames[activeMenu.value] || '管理后台';
    };

    const logout = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('l1nker.refresh');
      localStorage.removeItem('l1nker.expires');
      window.location.href = '/login';
    };

    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Fetch the authenticated user's info from the server (IDaaS-backed).
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        const data = await res.json();
        currentUser.value = data.username;
        userRole.value = data.role || 'user';
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        window.location.href = '/login';
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
      handleDropdownCommand,
      getCurrentPageName,
      logout,
    };
  },
};
</script>

<style scoped>
.admin-page {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.admin-header {
  background-color: #ffffff;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
  height: 60px !important;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h2 {
  margin: 0;
  color: #409eff;
  font-size: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.main-content {
  padding: 20px;
}

.nav-card {
  position: sticky;
  top: 80px;
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
