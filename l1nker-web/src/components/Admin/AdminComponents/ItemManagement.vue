<template>
    <div>
      <el-page-header @back="goBack" title="返回列表">
        <template #content>
          <span class="page-title">编辑落地页</span>
        </template>
      </el-page-header>

      <div class="edit-container">
        <ButtonCardEdit
          :item="item"
          :isEdit="true"
          @update:item="updateItem"
        />

        <div class="action-buttons">
          <el-button type="primary" @click="saveItem" :loading="saving">
            <el-icon><Check /></el-icon>
            保存更改
          </el-button>
          <el-button @click="goBack">
            取消
          </el-button>
        </div>
      </div>
    </div>
  </template>
<script>
import { defineComponent, ref, onMounted } from 'vue';
import ButtonCardEdit from './ButtonCardEdit.vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    ButtonCardEdit,
    Check,
  },
  setup() {
    const item = ref({});
    const router = useRouter();
    const saving = ref(false);

    const goBack = () => {
      router.push('/admin/landing-pages');
    };

    const updateItem = (newItem) => {
      item.value = newItem;
    };

    const saveItem = async () => {
      saving.value = true;
      try {
        const id = window.location.pathname.split('/').pop();
        const response = await fetch(`/api/admin/data/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(item.value),
        });

        if (response.ok) {
          ElMessage.success('保存成功');
        } else {
          const error = await response.json();
          ElMessage.error('保存失败: ' + (error.message || '未知错误'));
        }
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message);
      } finally {
        saving.value = false;
      }
    };

    onMounted(async () => {
      const id = window.location.pathname.split('/').pop();
      const response = await fetch(`/api/admin/data/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        item.value = await response.json();
      }
    });

    return {
      item,
      goBack,
      updateItem,
      saveItem,
      saving
    };
  }
});
</script>

<style scoped>
.edit-container {
  margin-top: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.action-buttons {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 10px;
}
</style>
