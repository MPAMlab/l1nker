<template>
   <div>
     <el-page-header title="Admin Panel">
       <template #extra>
         <el-button type="danger" @click="logout">Logout</el-button>
       </template>
     </el-page-header>
     <el-alert v-if="error" type="error" :closable="false" :title="error" style="margin-bottom: 20px;"/>
     <div v-if="data && data.length > 0">
         <el-table :data="data" style="width: 100%" @row-click="handleRowClick">
              <el-table-column prop="redirectKey" label="redirectKey"  />
            <el-table-column  label="Actions" width="150">
                <template #default="scope">
                   <el-button type="primary" size="small"  @click="handleRowClick(scope.row)" ><el-icon><EditPen /></el-icon>Edit</el-button>
                </template>
            </el-table-column>
         </el-table>
 
         <el-dialog v-model="showEditModal" :title="`Edit ${selectedItem.redirectKey}`" width="60%" @close="closeEditModal">
         <el-form :model="selectedItem" label-width="150px">
              <el-form-item label="ID" v-if="selectedItem.id">
                   <el-input v-model="selectedItem.id" disabled/>
              </el-form-item>
            <el-form-item label="New Redirect Key">
               <el-input v-model="selectedItem.newRedirectKey"  />
              </el-form-item>
           <el-form-item label="Profile Image">
             <el-image
                 style="width: 100px; height: 100px; margin-right: 10px;"
               :src="selectedItem.profileImageUrl"
               fit="cover"
             />
              <el-upload
                 class="upload-demo"
               :action="'/api/upload'"
               :on-success="handleUploadSuccess"
               :before-upload="beforeUpload"
                :show-file-list="false"
              >
               <el-button type="primary"><el-icon><Upload /></el-icon>Upload Image</el-button>
             </el-upload>
           </el-form-item>
 
            <el-form-item label="Title">
               <el-input v-model="selectedItem.title"  />
              </el-form-item>
             <el-form-item label="Subtitle">
              <el-input v-model="selectedItem.subtitle"  />
              </el-form-item>
            <el-form-item label="Buttons (JSON Array)">
               <el-input type="textarea" v-model="selectedItem.buttons"  />
               </el-form-item>
            <el-form-item label="Button Color">
                <el-input v-model="selectedItem.buttonColor"  />
             </el-form-item>
             <el-form-item label="Favicon URL">
                <el-input v-model="selectedItem.faviconUrl"  />
              </el-form-item>
              <el-form-item label="Page Title">
                  <el-input v-model="selectedItem.pageTitle"  />
             </el-form-item>
            </el-form>
                <template #footer>
                <span class="dialog-footer">
                  <el-button @click="closeEditModal">Cancel</el-button>
                  <el-button type="primary" @click="updateItem">Update</el-button>
                    <el-button type="danger" @click="deleteItem">Delete</el-button>
                       <el-button type="warning" @click="updateRedirectKey">Update RedirectKey</el-button>
                 </span>
              </template>
         </el-dialog>
       <el-button type="primary" style="margin-top: 20px;" @click="openCreateModal">Create Item</el-button>
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
       <div v-else-if="data && data.length === 0">
          <el-empty description="No data available."  />
      </div>
 
   </div>
 </template>
 
 <script>
 export default {
   data() {
     return {
       data: null,
       error: null,
       showCreateModal: false,
       showEditModal:false,
        selectedItem: {
              id:null,
              redirectKey: '',
              newRedirectKey: '',
               profileImageUrl: '',
                 title: '',
                  subtitle: '',
               buttons: '[]',
               buttonColor: '#FFFFFF',
               faviconUrl: '',
               pageTitle: ''
         },
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
      handleRowClick(row){
           this.selectedItem = { ...row }
          this.showEditModal = true;
      },
         closeEditModal(){
             this.showEditModal = false;
             this.selectedItem = {
                 id:null,
                 redirectKey: '',
                 newRedirectKey: '',
                 profileImageUrl: '',
                 title: '',
                 subtitle: '',
                 buttons: '[]',
                 buttonColor: '#FFFFFF',
                 faviconUrl: '',
                 pageTitle: ''
            }
         },
       async updateItem(){
            try {
                 const response = await fetch(`/api/admin/data/${this.selectedItem.id}`, {
                     method: 'PUT',
                     headers: {
                        'Content-Type': 'application/json',
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     },
                      body: JSON.stringify(this.selectedItem),
                 });
                 if (!response.ok) {
                     const errorData = await response.json();
                     this.error = errorData.message || 'Failed to update item';
                       return
                 }
                   await this.fetchData();
                   this.closeEditModal()
             }catch(error){
                     this.error = error.message || "Error updating item";
              }
         },
         async deleteItem(){
             try{
                 const response = await fetch(`/api/admin/data/${this.selectedItem.id}`, {
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
                  this.closeEditModal()
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
           async updateRedirectKey(){
             try {
                 const response = await fetch(`/api/admin/data/update-redirect-key/${this.selectedItem.id}`, {
                     method: 'PUT',
                     headers: {
                        'Content-Type': 'application/json',
                         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                     },
                      body: JSON.stringify({newRedirectKey: this.selectedItem.newRedirectKey}),
                 });
                 if (!response.ok) {
                     const errorData = await response.json();
                     this.error = errorData.message || 'Failed to update redirectKey';
                       return
                 }
                   await this.fetchData();
                  this.closeEditModal()
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
       handleUploadSuccess(response, file, fileList) {
        this.selectedItem.profileImageUrl = response.imageUrl
       },
       beforeUpload(file){
             const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
             const isLt2M = file.size / 1024 / 1024 < 2;
 
             if (!isJPG) {
                 this.$message.error('Upload image files only!');
             }
             if (!isLt2M) {
                 this.$message.error('Image size must not exceed 2MB!');
             }
              return isJPG && isLt2M;
         }
   },
 };
 </script>
 <style>
 
 </style>
 