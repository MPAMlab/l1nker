<template>
   <div>
     <h2>Admin Panel</h2>
     <el-button type="primary" @click="logout">Logout</el-button>
     <el-alert
       v-if="error"
       type="error"
       :title="error"
       show-icon
       style="margin-bottom: 20px"
     />
     <div v-if="data && data.length > 0">
       <el-table :data="data" border style="width: 100%">
         <el-table-column prop="id" label="ID" width="60" />
         <el-table-column prop="redirectKey" label="Redirect Key">
           <template #default="scope">
             <el-input v-model="scope.row.newRedirectKey" />
           </template>
         </el-table-column>
         <el-table-column label="Profile Image">
           <template #default="scope">
             <el-image
               style="width: 100px; height: 100px"
               :src="scope.row.profileImageUrl"
               :preview-src-list="[scope.row.profileImageUrl]"
               fit="contain"
             />
             <el-upload
               class="upload-demo"
               :action="'/api/upload'"
               :on-success="(response, uploadFile) => handleImageUploadSuccess(response, uploadFile, scope.row)"
               :show-file-list="false"
             >
               <el-button size="small" type="primary">Upload</el-button>
             </el-upload>
           </template>
         </el-table-column>
         <el-table-column prop="title" label="Title">
           <template #default="scope">
             <el-input v-model="scope.row.title" />
           </template>
         </el-table-column>
         <el-table-column prop="subtitle" label="Subtitle">
           <template #default="scope">
             <el-input v-model="scope.row.subtitle" />
           </template>
         </el-table-column>
         <el-table-column prop="buttons" label="Buttons">
           <template #default="scope">
             <el-input type="textarea" v-model="scope.row.buttons" />
           </template>
         </el-table-column>
         <el-table-column prop="buttonColor" label="Button Color">
           <template #default="scope">
             <el-input v-model="scope.row.buttonColor" />
           </template>
         </el-table-column>
          <el-table-column prop="faviconUrl" label="FaviconUrl">
           <template #default="scope">
             <el-input v-model="scope.row.faviconUrl" />
           </template>
         </el-table-column>
         <el-table-column prop="pageTitle" label="Page Title">
           <template #default="scope">
             <el-input v-model="scope.row.pageTitle" />
           </template>
         </el-table-column>
         <el-table-column label="Actions">
           <template #default="scope">
             <el-button size="small" type="primary" @click="updateItem(scope.row)"
               >Update</el-button
             >
             <el-button size="small" type="danger" @click="deleteItem(scope.row)"
               >Delete</el-button
             >
               <el-button size="small" @click="updateRedirectKey(scope.row)"
               >Update RedirectKey</el-button
             >
           </template>
         </el-table-column>
       </el-table>
       <el-button type="success" style="margin-top: 20px" @click="openCreateModal"
         >Create Item</el-button
       >
     </div>
     <p v-else-if="data && data.length === 0">No data available.</p>
 
     <!-- 创建项目 Modal -->
     <el-dialog v-model="showCreateModal" title="Create New Item">
       <el-form :model="newItem" label-width="120px">
           <el-form-item label="Redirect Key">
           <el-input v-model="newItem.redirectKey" />
         </el-form-item>
          <el-form-item label="Profile Image">
             <el-image
               v-if="newItem.profileImageUrl"
               style="width: 100px; height: 100px"
               :src="newItem.profileImageUrl"
               :preview-src-list="[newItem.profileImageUrl]"
               fit="contain"
             />
              <el-upload
               class="upload-demo"
               :action="'/api/upload'"
               :on-success="(response, uploadFile) => handleImageUploadSuccess(response, uploadFile, newItem)"
               :show-file-list="false"
             >
               <el-button size="small" type="primary">Upload</el-button>
             </el-upload>
           </el-form-item>
         <el-form-item label="Title">
           <el-input v-model="newItem.title" />
         </el-form-item>
         <el-form-item label="Subtitle">
           <el-input v-model="newItem.subtitle" />
         </el-form-item>
         <el-form-item label="Buttons (JSON Array)">
           <el-input type="textarea" v-model="newItem.buttons" />
         </el-form-item>
         <el-form-item label="Button Color">
           <el-input v-model="newItem.buttonColor" />
         </el-form-item>
          <el-form-item label="FaviconUrl">
           <el-input v-model="newItem.faviconUrl" />
         </el-form-item>
         <el-form-item label="Page Title">
           <el-input v-model="newItem.pageTitle" />
         </el-form-item>
       </el-form>
       <template #footer>
         <span class="dialog-footer">
           <el-button @click="closeCreateModal">Cancel</el-button>
           <el-button type="primary" @click="createItem">Create</el-button>
         </span>
       </template>
     </el-dialog>
   </div>
 </template>
 
 <script>
 import { ElMessage } from 'element-plus';
 
 export default {
   data() {
     return {
       data: null,
       error: null,
       showCreateModal: false,
       newItem: {
         redirectKey: '',
         profileImageUrl: '',
         title: '',
         subtitle: '',
         buttons: '[]',
         buttonColor: '#FFFFFF',
           faviconUrl: '',
           pageTitle: ''
       },
     };
   },
   async created() {
     await this.fetchData();
   },
   methods: {
     async fetchData() {
       try {
         const response = await fetch('/api/admin/data', {
           headers: {
             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
           },
         });
         if (!response.ok) {
           const errorData = await response.json();
           this.error = errorData.message || 'Failed to fetch data';
           return;
         }
         const data = await response.json();
         this.data = data;
         // 初始化 newRedirectKey，用于编辑 redirectKey
         this.data.forEach((item) => {
           item.newRedirectKey = item.redirectKey;
         });
       } catch (error) {
         this.error = error.message || 'Error fetching data';
       }
     },
     async updateItem(item) {
       try {
         const response = await fetch(`/api/admin/data/${item.id}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
           },
           body: JSON.stringify(item),
         });
         if (!response.ok) {
           const errorData = await response.json();
           this.error = errorData.message || 'Failed to update item';
           return;
         }
         await this.fetchData();
         ElMessage.success("Successfully updated item");
       } catch (error) {
         this.error = error.message || 'Error updating item';
       }
     },
     async deleteItem(item) {
       try {
         const response = await fetch(`/api/admin/data/${item.id}`, {
           method: 'DELETE',
           headers: {
             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
           },
         });
         if (!response.ok) {
           const errorData = await response.json();
           this.error = errorData.message || 'Failed to delete item';
           return;
         }
         await this.fetchData();
          ElMessage.success("Successfully deleted item");
       } catch (error) {
         this.error = error.message || 'Error deleting item';
       }
     },
     async createItem() {
       try {
         const response = await fetch('/api/admin/data', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${localStorage.getItem('authToken')}`,
           },
           body: JSON.stringify(this.newItem),
         });
         if (!response.ok) {
           const errorData = await response.json();
           this.error = errorData.message || 'Failed to create item';
           return;
         }
         await this.fetchData();
         this.closeCreateModal();
         ElMessage.success("Successfully created item");
       } catch (error) {
         this.error = error.message || 'Error creating item';
       }
     },
       async updateRedirectKey(item){
           try {
               const response = await fetch(`/api/admin/data/update-redirect-key/${item.id}`, {
                   method: 'PUT',
                   headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                   },
                   body: JSON.stringify({newRedirectKey: item.newRedirectKey}),
               });
               if (!response.ok) {
                   const errorData = await response.json();
                   this.error = errorData.message || 'Failed to update redirectKey';
                   return
               }
               await this.fetchData();
                ElMessage.success("Successfully updated redirectKey");
           }catch(error){
               this.error = error.message || "Error updating redirectKey";
           }
       },
     openCreateModal() {
       this.showCreateModal = true;
     },
     closeCreateModal() {
       this.showCreateModal = false;
       this.newItem = {
         redirectKey: '',
         profileImageUrl: '',
         title: '',
         subtitle: '',
         buttons: '[]',
         buttonColor: '#FFFFFF',
         faviconUrl: '',
         pageTitle: ''
       };
     },
     handleImageUploadSuccess(response, uploadFile, item) {
        if(response && response.url) {
             item.profileImageUrl = response.url
            ElMessage.success('Image upload successfully')
       }else{
            ElMessage.error('Failed to upload image')
       }
     },
     logout() {
       localStorage.removeItem('authToken');
       this.$router.push('/login');
     },
   },
 };
 </script>
 
 <style scoped>
 .upload-demo {
   display: inline-block;
   margin-left: 10px;
 }
 </style>
 