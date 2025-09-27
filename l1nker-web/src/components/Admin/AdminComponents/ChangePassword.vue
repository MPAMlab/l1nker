<template>
  <div class="change-password">
    <el-card>
      <template #header>
        <span>修改密码</span>
      </template>

      <el-form :model="passwordForm" label-width="120px" :rules="rules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            show-password
            placeholder="请输入当前密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码（至少6位）"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword" :loading="loading">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'ChangePassword',
  setup() {
    const passwordFormRef = ref(null);
    const loading = ref(false);

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };

    const rules = {
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' },
      ],
      confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
      ],
    };

    const changePassword = async () => {
      if (!passwordFormRef.value) return;

      try {
        await passwordFormRef.value.validate();

        loading.value = true;
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '修改密码失败');
        }

        ElMessage.success('密码修改成功');

        // 清空表单
        passwordForm.currentPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
        passwordFormRef.value.resetFields();
      } catch (error) {
        ElMessage.error('修改密码失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    return {
      passwordFormRef,
      passwordForm,
      rules,
      loading,
      changePassword,
    };
  },
};
</script>

<style scoped>
.change-password {
  max-width: 600px;
  margin: 0 auto;
}
</style>