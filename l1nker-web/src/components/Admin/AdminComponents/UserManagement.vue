<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="openCreateUserModal">
            <el-icon><Plus /></el-icon>
            创建新用户
          </el-button>
        </div>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="managedProjects" label="管理项目">
          <template #default="scope">
            {{ scope.row.managedProjects === '*' ? '全部项目' : scope.row.managedProjects || '无' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editUser(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteUser(scope.row)" :disabled="scope.row.id === currentUserId">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建用户对话框 -->
    <el-dialog v-model="showCreateModal" title="创建新用户" width="500px">
      <el-form :model="newUser" label-width="120px" ref="createForm">
        <el-form-item label="用户名" required>
          <el-input v-model="newUser.username" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="newUser.email" type="email" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="newUser.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="newUser.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="管理项目" v-if="newUser.role === 'user'">
          <el-input
            v-model="newUser.managedProjects"
            placeholder="输入项目key，多个用逗号分隔（如：project1,project2）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateModal">取消</el-button>
        <el-button type="primary" @click="createUser">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditModal" title="编辑用户" width="500px">
      <el-form :model="editUserForm" label-width="120px">
        <el-form-item label="用户名">
          <el-input v-model="editUserForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editUserForm.email" type="email" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="editUserForm.password" type="password" show-password placeholder="留空则不修改" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editUserForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="管理项目" v-if="editUserForm.role === 'user'">
          <el-input
            v-model="editUserForm.managedProjects"
            placeholder="输入项目key，多个用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditModal">取消</el-button>
        <el-button type="primary" @click="updateUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'UserManagement',
  components: {
    Plus,
    Edit,
    Delete,
  },
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const currentUserId = ref(null);

    const newUser = ref({
      username: '',
      email: '',
      password: '',
      role: 'user',
      managedProjects: '',
    });

    const editUserForm = ref({
      id: null,
      username: '',
      email: '',
      password: '',
      role: 'user',
      managedProjects: '',
    });

    const fetchUsers = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        users.value = data;

        // Get current user ID
        const token = localStorage.getItem('authToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId.value = payload.userId;
        }
      } catch (error) {
        ElMessage.error('获取用户列表失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    const openCreateUserModal = () => {
      showCreateModal.value = true;
      newUser.value = {
        username: '',
        email: '',
        password: '',
        role: 'user',
        managedProjects: '',
      };
    };

    const closeCreateModal = () => {
      showCreateModal.value = false;
    };

    const createUser = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(newUser.value),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '创建用户失败');
        }

        ElMessage.success('用户创建成功');
        closeCreateModal();
        fetchUsers();
      } catch (error) {
        ElMessage.error('创建用户失败: ' + error.message);
      }
    };

    const editUser = (user) => {
      editUserForm.value = {
        id: user.id,
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        managedProjects: user.managedProjects === '*' ? '' : user.managedProjects,
      };
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
    };

    const updateUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${editUserForm.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(editUserForm.value),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '更新用户失败');
        }

        ElMessage.success('用户更新成功');
        closeEditModal();
        fetchUsers();
      } catch (error) {
        ElMessage.error('更新用户失败: ' + error.message);
      }
    };

    const deleteUser = async (user) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '删除用户失败');
        }

        ElMessage.success('用户删除成功');
        fetchUsers();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除用户失败: ' + error.message);
        }
      }
    };

    onMounted(fetchUsers);

    return {
      users,
      loading,
      showCreateModal,
      showEditModal,
      newUser,
      editUserForm,
      currentUserId,
      openCreateUserModal,
      closeCreateModal,
      createUser,
      editUser,
      closeEditModal,
      updateUser,
      deleteUser,
    };
  },
};
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>