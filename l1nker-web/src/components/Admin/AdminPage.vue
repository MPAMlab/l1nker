<template>
  <div>
    <el-page-header title="Admin Panel">
      <template #extra>
        <el-button type="danger" @click="logout">Logout</el-button>
      </template>
    </el-page-header>
    <el-alert v-if="error" :type="error.type || 'error'" :closable="false"
      :title="error.message || 'An error occurred'" />
    <div v-if="loading">
      <el-empty description="Loading data..." />
    </div>
    <div v-else-if="data && data.length > 0">
      <el-table :data="data" style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="redirectKey" label="Redirect Key" />
        <el-table-column label="Actions" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleRowClick(scope.row)">
              <el-icon><EditPen /></el-icon>Edit
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="showCreateModal" title="Create New Item" width="80%" @close="closeCreateModal">
        <item-form :item="newItem" :isEdit="false" :uploadUrl="uploadUrl" @update:item="updateNewItem" />
        <template #footer>
          <el-button @click="closeCreateModal">Cancel</el-button>
          <el-button type="primary" @click="createItem">Create</el-button>
        </template>
      </el-dialog>
    </div>
    <div v-else>
      <el-empty description="No data available." />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import ItemForm from './AdminComponents/ButtonCardEdit.vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

export default {
  components: {
    ItemForm,
  },
  setup() {
    const data = ref(null);
    const error = ref(null);
    const loading = ref(true);
    const showCreateModal = ref(false);
    const newItem = ref({ buttons: [] });
    const uploadUrl = ref('/api/upload'); // Make uploadUrl reactive
    const router = useRouter();

    const fetchData = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await fetch('/api/admin/data', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          error.value = { type: 'error', message: errorData.message || 'Failed to fetch data' };
          throw new Error(errorData.message);
        }
        const dataJson = await response.json();
          data.value = dataJson.map((item) => ({ ...item, newRedirectKey: item.redirectKey, buttons:item.buttons, ...item.profile }));
      } catch (err) {
        ElMessage.error("Error fetching data: " + err.message)
      } finally {
        loading.value = false;
      }
    };

    const handleRowClick = (row) => {
      router.push(`/admin/edit/${row.id}`);
    };


    const closeCreateModal = () => {
      showCreateModal.value = false;
      newItem.value = { buttons: [] };
    };


    const updateNewItem = (updatedItem) => {
      newItem.value = updatedItem;
    };


    const createItem = async () => {
      try {
        const newItemWithButtons = {
          ...newItem.value,
            buttons: JSON.stringify(newItem.value.buttons),
        };
        const response = await fetch('/api/admin/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(newItemWithButtons),
        });

        if (!response.ok) {
          const errorData = await response.json();
          error.value = { type: 'error', message: errorData.message || 'Failed to create item' };
          return;
        }
        await fetchData();
        closeCreateModal();
        ElMessage.success('Item created successfully!');
      } catch (err) {
        ElMessage.error('Error creating item: ' + err.message);
      }
    };


    const logout = () => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    };

    onMounted(fetchData);

    return {
      data,
      error,
      loading,
      showCreateModal,
      newItem,
      handleRowClick,
      closeCreateModal,
      createItem,
      logout,
       updateNewItem,
      uploadUrl,
    };
  },
};
</script>
