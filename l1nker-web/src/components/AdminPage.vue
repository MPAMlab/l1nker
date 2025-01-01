<template>
   <div>
     <h2>Admin Panel</h2>
     <button @click="logout">Logout</button>
     <p v-if="error" style="color: red">{{ error }}</p>
     <div v-if="data && data.length > 0">
       <table>
         <thead>
           <tr>
             <th>ID</th>
             <th>redirectKey</th>
             <th>New Redirect Key</th>
             <th>profileImageUrl</th>
             <th>title</th>
             <th>subtitle</th>
             <th>buttons</th>
             <th>buttonColor</th>
             <th>faviconUrl</th>
             <th>pageTitle</th>
             <th>Actions</th>
           </tr>
         </thead>
         <tbody>
           <tr v-for="item in data" :key="item.id">
             <td>{{ item.id }}</td>
             <td>{{ item.redirectKey }}</td>
             <td>
               <input type="text" v-model="item.newRedirectKey" />
             </td>
             <td><input type="text" v-model="item.profileImageUrl" /></td>
             <td><input type="text" v-model="item.title" /></td>
             <td><input type="text" v-model="item.subtitle" /></td>
             <td><input type="text" v-model="item.buttons" /></td>
             <td><input type="text" v-model="item.buttonColor" /></td>
             <td><input type="text" v-model="item.faviconUrl" /></td>
             <td><input type="text" v-model="item.pageTitle" /></td>
             <td>
               <button @click="updateItem(item)">Update</button>
               <button @click="deleteItem(item)">Delete</button>
                <button @click="updateRedirectKey(item)">Update RedirectKey</button>
             </td>
           </tr>
         </tbody>
       </table>
       <button @click="openCreateModal">Create Item</button>
     </div>
     <p v-else-if="data && data.length === 0">No data available.</p>
 
     <!-- 创建项目 Modal -->
     <div v-if="showCreateModal" class="modal">
       <div class="modal-content">
         <span class="close" @click="closeCreateModal">&times;</span>
         <h3>Create New Item</h3>
           <input type="text" placeholder="Redirect Key" v-model="newItem.redirectKey" />
         <input type="text" placeholder="Profile Image URL" v-model="newItem.profileImageUrl" />
         <input type="text" placeholder="Title" v-model="newItem.title" />
         <input type="text" placeholder="Subtitle" v-model="newItem.subtitle" />
         <input type="text" placeholder="Buttons (JSON Array)" v-model="newItem.buttons" />
         <input type="text" placeholder="Button Color" v-model="newItem.buttonColor" />
         <input type="text" placeholder="Favicon URL" v-model="newItem.faviconUrl" />
         <input type="text" placeholder="Page Title" v-model="newItem.pageTitle" />
         <button @click="createItem">Create</button>
       </div>
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
 
 <style scoped>
 table {
   border-collapse: collapse;
   width: 100%;
 }
 th,
 td {
   border: 1px solid black;
   padding: 8px;
   text-align: left;
 }
 
 .modal {
   position: fixed;
   z-index: 1;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   overflow: auto;
   background-color: rgba(0, 0, 0, 0.4);
   display: flex;
   justify-content: center;
   align-items: center;
 }
 
 .modal-content {
   background-color: #fefefe;
   padding: 20px;
   border: 1px solid #888;
   width: 60%;
     max-width: 500px;
   position: relative;
 }
 
 .close {
   color: #aaa;
   position: absolute;
   top: 0;
     right: 10px;
   font-size: 28px;
   font-weight: bold;
   cursor: pointer;
 }
 
 .close:hover,
 .close:focus {
   color: black;
   text-decoration: none;
   cursor: pointer;
 }
 </style>
 