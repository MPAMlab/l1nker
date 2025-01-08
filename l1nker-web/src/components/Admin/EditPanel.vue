<template>
    <el-page-header title="Edit Item" @back="handleBack">
      <template #extra>
        <el-button type="danger" @click="deleteItem">Delete</el-button>
        <el-button type="primary" @click="updateItem">Update</el-button>
      </template>
    </el-page-header>
    <el-alert v-if="error" :type="error.type || 'error'" :closable="false"
      :title="error.message || 'An error occurred'" />
    <div v-if="loading">
      <el-empty description="Loading item data..." />
    </div>
    <div v-else>
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="Button" name="button">
          <button-card-edit :item="item" :isEdit="true" :uploadUrl="uploadUrl"
            @update:item="updateItemData('buttons', $event)" />
        </el-tab-pane>
         <el-tab-pane label="Music" name="music">
           <music-card-edit :item="item" :isEdit="true" :uploadUrl="uploadUrl"
             @update:item="updateItemData('musicLinks', $event)" />
        </el-tab-pane>
        <el-tab-pane label="Profile" name="profile">
          <profile-card-edit :item="item" :isEdit="true" :uploadUrl="uploadUrl"
            @update:item="updateItemData('profile', $event)" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import ButtonCardEdit from './AdminComponents/ButtonCardEdit.vue';
   import MusicCardEdit from './AdminComponents/MusicCardEdit.vue';
  import ProfileCardEdit from './AdminComponents/ProfileCardEdit.vue';
  import { ElMessage } from 'element-plus';
  import _ from 'lodash'
  
  export default {
    components: {
      ButtonCardEdit,
      MusicCardEdit,
      ProfileCardEdit,
    },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const itemId = route.params.id;
      const item = ref({});
      const error = ref(null);
      const loading = ref(true);
      const uploadUrl = ref('/api/upload');
        const activeTab = ref('button');
  
       const fetchItemData = async () => {
        loading.value = true;
        error.value = null;
        try {
          const response = await fetch(`/api/admin/data/${itemId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            error.value = { type: 'error', message: errorData.message || 'Failed to fetch item data' };
            throw new Error(errorData.message);
          }
          const itemJson = await response.json();
             item.value = {
                ...itemJson,
                buttons: itemJson.buttons,
               musicLinks:itemJson.musicLinks || [],
              ...itemJson.profile,
          };
        } catch (err) {
          ElMessage.error("Error fetching item data: " + err.message)
        } finally {
          loading.value = false;
        }
      };
  
  
      const updateItemData = (key, updatedData) => {
       if(key === 'profile'){
           item.value = {
               ...item.value,
              ...updatedData
          }
       } else {
         item.value = {
          ...item.value,
           [key]: updatedData,
         };
       }
      };
  
      const updateItem = async () => {
        try {
          const updateItem =  {
             ..._.omit(item.value,['id','redirectKey', 'newRedirectKey']),
                buttons: item.value.buttons
          }
          const response = await fetch(`/api/admin/data/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(updateItem),
          });
          if (!response.ok) {
            const errorData = await response.json();
            error.value = { type: 'error', message: errorData.message || 'Failed to update item' };
            return;
          }
          ElMessage.success('Item updated successfully!');
          router.push('/admin');
        } catch (err) {
            ElMessage.error('Error updating item: ' + err.message);
        }
      };
  
      const deleteItem = async () => {
        try {
          const response = await fetch(`/api/admin/data/${itemId}`, {
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
           ElMessage.success('Item deleted successfully!');
          router.push('/admin');
        } catch (err) {
          ElMessage.error('Error deleting item: ' + err.message);
        }
      };
  
        const handleBack = () => {
         router.push('/admin')
      };
  
  
      onMounted(fetchItemData);
  
      return {
        item,
        error,
        loading,
        uploadUrl,
        updateItem,
        deleteItem,
        updateItemData,
         activeTab,
          handleBack
      };
    },
  };
  </script>
  