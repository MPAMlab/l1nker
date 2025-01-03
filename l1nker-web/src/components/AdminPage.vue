<template>
  <div>
    <el-page-header title="Admin Panel">
      <template #extra>
        <el-button type="danger" @click="logout">Logout</el-button>
      </template>
    </el-page-header>
    <el-alert v-if="error" :type="error.type || 'error'" :closable="false" :title="error.message || 'An error occurred'" />
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

      <el-dialog v-model="showEditModal" :title="`Edit ${selectedItem.redirectKey}`" width="80%" @close="closeEditModal">
        <item-form :item="selectedItem" :isEdit="true" :uploadUrl="uploadUrl" @update:item="updateSelectedItem" />
        <template #footer>
          <el-button @click="closeEditModal">Cancel</el-button>
          <el-button type="primary" @click="updateItem">Update</el-button>
          <el-button type="danger" @click="deleteItem">Delete</el-button>
          <el-button type="warning" @click="updateRedirectKey">Update RedirectKey</el-button>
        </template>
      </el-dialog>

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
import ItemForm from './ItemForm.vue';
import { ElMessage } from 'element-plus';
import _ from 'lodash';

export default {
  components: {
    ItemForm,
  },
  setup() {
    const data = ref(null);
    const error = ref(null);
    const loading = ref(true);
    const showEditModal = ref(false);
    const showCreateModal = ref(false);
    const selectedItem = ref({});
    const newItem = ref({ buttons: [] });
    const uploadUrl = ref('/api/upload'); // Make uploadUrl reactive


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
        data.value = dataJson.map((item) => ({ ...item, newRedirectKey: item.redirectKey, buttons: JSON.parse(item.buttons || '[]') }));
      } catch (err) {
          ElMessage.error("Error fetching data: " + err.message)
      } finally {
        loading.value = false;
      }
    };

    const handleRowClick = (row) => {
      selectedItem.value = { ...row, buttons: [...row.buttons] }; //浅拷贝按钮数组
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      selectedItem.value = {};
    };

    const closeCreateModal = () => {
      showCreateModal.value = false;
      newItem.value = { buttons: [] };
    };


    const updateSelectedItem = (updatedItem) => {
      selectedItem.value = updatedItem;
    };

    const updateNewItem = (updatedItem) => {
        newItem.value = updatedItem;
    };

    const updateItem = async () => {
      try {
        const response = await fetch(`/api/admin/data/${selectedItem.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(selectedItem.value),
        });
        if (!response.ok) {
          const errorData = await response.json();
          error.value = { type: 'error', message: errorData.message || 'Failed to update item' };
          return;
        }
        await fetchData();
        closeEditModal();
        ElMessage.success('Item updated successfully!');
      } catch (err) {
          ElMessage.error('Error updating item: ' + err.message);
      }
    };

    const deleteItem = async () => {
      try {
        const response = await fetch(`/api/admin/data/${selectedItem.value.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          error.value = { type: 'error', message: errorData.message || 'Failed to delete item' };
          return;
        }
        await fetchData();
        closeEditModal();
        ElMessage.success('Item deleted successfully!');
      } catch (err) {
          ElMessage.error('Error deleting item: ' + err.message);
      }
    };


    const createItem = async () => {
      try {
        const response = await fetch('/api/admin/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(newItem.value),
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

    const updateRedirectKey = async () => {
      try {
        const response = await fetch(`/api/admin/data/update-redirect-key/${selectedItem.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ newRedirectKey: selectedItem.value.newRedirectKey }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          error.value = { type: 'error', message: errorData.message || 'Failed to update redirect key' };
          return;
        }
        await fetchData();
        closeEditModal();
        ElMessage.success('Redirect key updated successfully!');
      } catch (err) {
          ElMessage.error('Error updating redirect key: ' + err.message);
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
      showEditModal,
      showCreateModal,
      selectedItem,
      newItem,
      handleRowClick,
      closeEditModal,
      closeCreateModal,
      updateItem,
      deleteItem,
      createItem,
      updateRedirectKey,
      logout,
      updateSelectedItem,
      updateNewItem,
      uploadUrl,
    };
  },
};
</script>
