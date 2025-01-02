<template>
  <el-menu mode="horizontal" :default-active="$route.path"  class="admin-nav">
    <el-menu-item index="/admin/items">
      <el-icon><DocumentCopy /></el-icon>
      <span>Items Management</span>
    </el-menu-item>
    <el-menu-item index="/admin/users">
      <el-icon><User /></el-icon>
      <span>User Management</span>
    </el-menu-item>
    <el-menu-item index="/login" @click="logout">
      <el-icon><Logout /></el-icon>
      <span>Logout</span>
    </el-menu-item>
  </el-menu>
</template>

<script>
import { ElMessage } from 'element-plus'
export default {
  methods: {
    logout() {
      localStorage.removeItem('authToken');
      this.$router.push('/login');
      ElMessage.success('Logout successfully!');
    }
  }
};
</script>

<style scoped>
.admin-nav {
    border-bottom: 1px solid #eee;
    padding: 10px;
}
</style>

