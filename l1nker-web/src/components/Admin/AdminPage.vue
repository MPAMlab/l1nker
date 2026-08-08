<template>
  <div class="admin-shell">
    <!-- Dark sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-title">L1nker</span>
        <span class="brand-sub">Admin Panel</span>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in visibleNavItems"
          :key="item.id"
          :class="['nav-item', { active: activeMenu === item.id }]"
          @click="handleMenuSelect(item.id)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-user">
        <div class="user-line">{{ currentUser }}</div>
        <div class="role-line">{{ isAdmin ? 'Admin' : 'User' }}</div>
        <button class="logout-btn" @click="logout">Sign out</button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="admin-main">
      <header class="admin-topbar">
        <div class="topbar-title">{{ getCurrentPageName() }}</div>
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
      </header>

      <div class="admin-content">
        <router-view v-if="activeMenu === 'landing-pages'" />
        <UserManagement v-else-if="activeMenu === 'users' && isAdmin" />
        <ArtistManagement v-else-if="activeMenu === 'artists'" />
        <ChangePassword v-else-if="activeMenu === 'password'" />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { Document, User, Microphone, Lock, ArrowDown } from '@element-plus/icons-vue';
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
    UserManagement,
    ArtistManagement,
    ChangePassword,
  },
  setup() {
    const activeMenu = ref('landing-pages');
    const currentUser = ref('');
    const userRole = ref('');

    const isAdmin = computed(() => userRole.value === 'admin');

    const navItems = computed(() => [
      { id: 'landing-pages', label: '落地页管理', icon: Document },
      { id: 'users', label: '用户管理', icon: User, adminOnly: true },
      { id: 'artists', label: isAdmin.value ? '艺人管理' : '我的艺人页', icon: Microphone },
      { id: 'password', label: '修改密码', icon: Lock },
    ]);

    const visibleNavItems = computed(() => navItems.value.filter((i) => !i.adminOnly || isAdmin.value));

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
      visibleNavItems,
      handleMenuSelect,
      handleDropdownCommand,
      getCurrentPageName,
      logout,
    };
  },
};
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background-color: #fafafa;
  color: #18181b;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ---------- Sidebar ---------- */
.admin-sidebar {
  width: 220px;
  flex-shrink: 0;
  background-color: #18181b;
  color: #d4d4d8;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  padding: 24px 20px;
  border-bottom: 1px solid #27272a;
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 11px;
  color: #71717a;
  margin-top: 2px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: #a1a1aa;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s, color 0.15s;
}

.nav-item:hover {
  background-color: #27272a;
  color: #ffffff;
}

.nav-item.active {
  background-color: #27272a;
  color: #ffffff;
  font-weight: 500;
}

.sidebar-user {
  padding: 16px 16px 20px;
  border-top: 1px solid #27272a;
}

.user-line {
  color: #fafafa;
  font-size: 14px;
  font-weight: 500;
}

.role-line {
  color: #71717a;
  font-size: 12px;
  margin-top: 2px;
}

.logout-btn {
  margin-top: 12px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #3f3f46;
  background: transparent;
  color: #a1a1aa;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.logout-btn:hover {
  color: #ffffff;
  border-color: #71717a;
}

/* ---------- Main ---------- */
.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-topbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e4e7;
  padding: 0 28px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #18181b;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  color: #3f3f46;
  font-size: 14px;
  transition: background-color 0.15s;
}

.user-dropdown:hover {
  background-color: #f4f4f5;
}

.admin-content {
  flex: 1;
  padding: 28px;
  background-color: #fafafa;
}
</style>
