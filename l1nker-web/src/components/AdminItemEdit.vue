<template>
    <div>
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
  
      <el-button type="primary" style="margin-top: 20px;" @click="openCreateModal">Create Item</el-button>
      <el-dialog v-model="showEditModal" :title="editTitle" width="80%" @close="closeEditModal">
        <item-form :item="selectedItem" @update="updateItem" @delete="deleteItem" @update-redirect-key="updateRedirectKey" @close="closeEditModal"/>
      </el-dialog>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import ItemForm from './ItemForm.vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  
  export default {
    components: { ItemForm },
    setup() {
      const data = ref(null);
      const error = ref(null);
      const showEditModal = ref(false);
      const selectedItem = ref({});
      const editTitle = ref('');
  
      onMounted(async () => {
        await fetchData();
      });
  
      const fetchData = async () => {
        error.value = null; // Clear previous errors
        try {
          const response = await fetch('/api/admin/data', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          if (!response.ok) {
            const errorData = await response.json();
            error.value = errorData.message || 'Failed to fetch data';
            return;
          }
          const resData = await response.json();
          data.value = resData.map(item => ({...item, newRedirectKey: item.redirectKey, buttons: JSON.parse(item.buttons)}));
        } catch (error) {
          error.value = error.message || 'Error fetching data';
        }
      };
  
      const handleRowClick = (row) => {
        selectedItem.value = { ...row };
        editTitle.value = `Edit ${row.redirectKey}`;
        showEditModal.value = true;
      };
  
      const closeEditModal = () => {
        showEditModal.value = false;
        selectedItem.value = {};
        editTitle.value = '';
      };
  
      const updateItem = async (updatedItem) => {
        try {
          const response = await fetch(`/api/admin/data/${updatedItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updatedItem)
          });
          if (!response.ok) {
            const errorData = await response.json();
            error.value = errorData.message || 'Failed to update item';
            return;
          }
          ElMessage.success('Item updated successfully!');
          await fetchData();
          closeEditModal();
        } catch (err) {
          error.value = err.message || 'Error updating item';
        }
      };
  
      const deleteItem = async (itemId) => {
        try {
          await ElMessageBox.confirm('Are you sure you want to delete this item?', 'Warning', {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }).then(async () => {
            const response = await fetch(`/api/admin/data/${itemId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            if (!response.ok) {
              const errorData = await response.json();
              error.value = errorData.message || 'Failed to delete item';
              return;
            }
            ElMessage.success('Item deleted successfully!');
            await fetchData();
            closeEditModal();
          }).catch(() => {
              //do nothing
          });
        } catch (err) {
          error.value = err.message || 'Error deleting item';
        }
      };
  
      const updateRedirectKey = async (itemId, newRedirectKey) => {
        try {
          const response = await fetch(`/api/admin/data/update-redirect-key/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ newRedirectKey })
          });
          if (!response.ok) {
            const errorData = await response.json();
            error.value = errorData.message || 'Failed to update redirect key';
            return;
          }
          ElMessage.success('Redirect key updated successfully!');
          await fetchData();
          closeEditModal();
        } catch (err) {
          error.value = err.message || 'Error updating redirect key';
        }
      };
  
      const openCreateModal = () => {
        selectedItem.value = {
          redirectKey: '',
          newRedirectKey: '',
          profileImageUrl: '',
          title: '',
          subtitle: '',
          buttons: [],
          buttonColor: '#FFFFFF',
          faviconUrl: '',
          pageTitle: ''
        };
        editTitle.value = 'Create New Item';
        showEditModal.value = true;
      };
  
      return { data, error, showEditModal, selectedItem, handleRowClick, closeEditModal, updateItem, deleteItem, updateRedirectKey, openCreateModal, editTitle };
    }
  };
  </script>
  