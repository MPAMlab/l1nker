<template>
   <div>
     <el-page-header title="Admin Panel">
       <template #extra>
         <el-button type="danger" @click="logout">Logout</el-button>
       </template>
     </el-page-header>
     <el-alert v-if="error" type="error" :closable="false" :title="error" style="margin-bottom: 20px;"/>
     <div v-if="data && data.length > 0">
       <el-table :data="data" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="redirectKey" label="redirectKey"  />
         <el-table-column label="New Redirect Key">
             <template #default="scope">
                   <el-input v-model="scope.row.newRedirectKey"  />
                 </template>
         </el-table-column>
         <el-table-column prop="profileImageUrl" label="Profile Image URL">
               <template #default="scope">
                   <el-input v-model="scope.row.profileImageUrl"  />
                 </template>
         </el-table-column>
           <el-table-column prop="title" label="Title">
               <template #default="scope">
                   <el-input v-model="scope.row.title"  />
                 </template>
         </el-table-column>
         <el-table-column prop="subtitle" label="Subtitle">
                <template #default="scope">
                   <el-input v-model="scope.row.subtitle"  />
                 </template>
         </el-table-column>
          <el-table-column prop="buttons" label="Buttons">
               <template #default="scope">
                   <el-input v-model="scope.row.buttons"  />
                 </template>
         </el-table-column>
          <el-table-column prop="buttonColor" label="Button Color">
              <template #default="scope">
                   <el-input v-model="scope.row.buttonColor"  />
                 </template>
         </el-table-column>
         <el-table-column prop="faviconUrl" label="Favicon URL">
              <template #default="scope">
                   <el-input v-model="scope.row.faviconUrl"  />
                 </template>
         </el-table-column>
           <el-table-column prop="pageTitle" label="Page Title">
              <template #default="scope">
                   <el-input v-model="scope.row.pageTitle"  />
                 </template>
         </el-table-column>
         <el-table-column label="Actions" width="250">
           <template #default="scope">
            <el-button  type="primary" size="small" @click="updateItem(scope.row)" ><el-icon><EditPen /></el-icon>Update</el-button>
            <el-button type="danger" size="small" @click="deleteItem(scope.row)" ><el-icon><Delete /></el-icon>Delete</el-button>
            <el-button type="warning" size="small" @click="updateRedirectKey(scope.row)" ><el-icon><Refresh /></el-icon>Update RedirectKey</el-button>
           </template>
         </el-table-column>
       </el-table>
       <el-button type="primary" style="margin-top: 20px;" @click="openCreateModal">Create Item</el-button>
     </div>
      <div v-else-if="data && data.length === 0">
          <el-empty description="No data available."  />
      </div>
     <!-- 创建项目 Modal -->
     <el-dialog v-model="showCreateModal" title="Create New Item" width="30%" @close="closeCreateModal">
       <el-form :model="newItem" label-width="120px">
         <el-form-item label="Redirect Key">
            <el-input v-model="newItem.redirectKey" />
         </el-form-item>
         <el-form-item label="Profile Image URL">
             <el-input v-model="newItem.profileImageUrl"  />
         </el-form-item>
         <el-form-item label="Title">
            <el-input v-model="newItem.title"  />
         </el-form-item>
          <el-form-item label="Subtitle">
            <el-input v-model="newItem.subtitle"  />
         </el-form-item>
         <el-form-item label="Buttons (JSON Array)">
            <el-input v-model="newItem.buttons"  />
         </el-form-item>
          <el-form-item label="Button Color">
            <el-input v-model="newItem.buttonColor" />
         </el-form-item>
          <el-form-item label="Favicon URL">
            <el-input v-model="newItem.faviconUrl"  />
         </el-form-item>
          <el-form-item label="Page Title">
            <el-input v-model="newItem.pageTitle"  />
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
         }
     };
   },
   async created() {
     await this.fetchData();
   },
   methods: {
       async fetchData() {
             try{
                 const response = await fetch('/api/admin/data', {
                     headers: {
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     }
                 })
                 if(!response.ok){
                     const errorData = await response.json();
                     this.error = errorData.message || "Failed to fetch data"
                     return
                 }
                 const data = await response.json();
                 this.data = data
                 // 初始化 newRedirectKey，用于编辑 redirectKey
                  this.data.forEach(item => {
                      item.newRedirectKey = item.redirectKey;
                    });
             }catch(error){
                 this.error = error.message || "Error fetching data"
             }
         },
         async updateItem(item){
             try{
                 const response = await fetch(`/api/admin/data/${item.id}`, {
                     method: 'PUT',
                     headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     },
                     body: JSON.stringify(item)
                 })
                 if(!response.ok){
                     const errorData = await response.json();
                     this.error = errorData.message || "Failed to update item"
                     return;
                 }
                 await this.fetchData()
             }catch(error){
                 this.error = error.message || "Error updating item"
             }
         },
         async deleteItem(item){
             try{
                 const response = await fetch(`/api/admin/data/${item.id}`, {
                     method: 'DELETE',
                     headers: {
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     }
                 })
                 if(!response.ok){
                     const errorData = await response.json();
                     this.error = errorData.message || "Failed to delete item"
                     return;
                 }
                 await this.fetchData()
             }catch(error){
                 this.error = error.message || "Error deleting item"
             }
         },
         async createItem() {
            try {
                  const response = await fetch('/api/admin/data', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     },
                     body: JSON.stringify(this.newItem),
                 });
                 if(!response.ok){
                     const errorData = await response.json();
                     this.error = errorData.message || "Failed to create item"
                     return;
                 }
                 await this.fetchData();
                  this.closeCreateModal();
             }catch(error){
                     this.error = error.message || "Error creating item";
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
             }catch(error){
                     this.error = error.message || "Error updating redirectKey";
              }
         },
         openCreateModal(){
              this.showCreateModal = true;
         },
         closeCreateModal(){
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
            }
         },
     logout() {
       localStorage.removeItem("authToken");
       this.$router.push("/login");
     },
   },
 };
 </script>
 