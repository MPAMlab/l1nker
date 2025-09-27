<template>
  <div class="item-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>落地页列表</span>
          <el-button type="primary" @click="createNewItem">
            <el-icon><Plus /></el-icon>
            创建新落地页
          </el-button>
        </div>
      </template>

      <el-table :data="items" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="redirectKey" label="页面Key" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="pageTitle" label="页面标题" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="editItem(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="viewPage(scope.row)"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteItem(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && items.length === 0" class="empty-state">
        <el-empty description="暂无落地页">
          <el-button type="primary" @click="createNewItem">
            创建第一个落地页
          </el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Plus, Edit, View, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

export default {
  name: 'ItemList',
  components: {
    Plus,
    Edit,
    View,
    Delete,
  },
  setup() {
    const items = ref([]);
    const loading = ref(false);
    const router = useRouter();

    const fetchItems = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/admin/data', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        items.value = Array.isArray(data) ? data : [data];
      } catch (error) {
        ElMessage.error('获取落地页列表失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    const createNewItem = () => {
      // 创建新项目，使用默认值
      const newItem = {
        redirectKey: `page-${Date.now()}`,
        profileImageUrl: '',
        title: '新落地页',
        subtitle: '请编辑此页面',
        buttons: JSON.stringify([]),
        buttonColor: '#333333',
        faviconUrl: '',
        pageTitle: '新落地页',
        show_artist_section: 0,
        artist_profile_id: null,
      };

      fetch('/api/admin/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(newItem),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Successfully created') {
            ElMessage.success('创建成功');
            fetchItems();
          } else {
            ElMessage.error('创建失败: ' + (data.error || data.message));
          }
        })
        .catch(error => {
          ElMessage.error('创建失败: ' + error.message);
        });
    };

    const editItem = (item) => {
      router.push(`/admin/item/${item.id}`);
    };

    const viewPage = (item) => {
      window.open(`/${item.redirectKey}`, '_blank');
    };

    const deleteItem = async (item) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除落地页 "${item.title}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        const response = await fetch(`/api/admin/data/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '删除失败');
        }

        ElMessage.success('删除成功');
        fetchItems();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + error.message);
        }
      }
    };

    onMounted(() => {
      fetchItems();
    });

    return {
      items,
      loading,
      createNewItem,
      editItem,
      viewPage,
      deleteItem,
    };
  },
};
</script>

<style scoped>
.item-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  margin-top: 40px;
  text-align: center;
}
</style>