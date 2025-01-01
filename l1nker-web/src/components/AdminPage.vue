<template>
    <div>
       <h2>Admin Panel</h2>
        <button @click="logout">Logout</button>
       <p v-if="error" style="color: red;">{{ error }}</p>
         <div v-if="data && data.length > 0">
            <table >
                 <thead>
                    <tr>
                        <th>redirectKey</th>
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
                    <tr v-for="item in data" :key="item.redirectKey">
                        <td>{{item.redirectKey}}</td>
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
                         </td>
                     </tr>
                </tbody>
            </table>
            <button @click="createItem">Create Item</button>
        </div>
         <p v-else-if="data && data.length === 0">No data available.</p>
    </div>
   </template>
   <script>
    export default {
        data() {
            return {
                data: null,
                error: null,
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
                   }catch(error){
                          this.error = error.message || "Error fetching data"
                    }
               },
                async updateItem(item){
                     try{
                        const response = await fetch(`/api/admin/data/${item.redirectKey}`, {
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
                        const response = await fetch(`/api/admin/data/${item.redirectKey}`, {
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
               async createItem(){
                    try {
                        const newItem = {
                            redirectKey: 'new-item',
                             profileImageUrl: 'default-profile.png',
                             title: 'New Title',
                             subtitle: 'New Subtitle',
                           buttons: '[]',
                             buttonColor: '#FFFFFF',
                             faviconUrl: 'default-favicon.ico',
                              pageTitle: 'New Page Title'
                           };
                         const response = await fetch('/api/admin/data', {
                              method: 'POST',
                               headers: {
                                  'Content-Type': 'application/json',
                                   'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                              },
                               body: JSON.stringify(newItem),
                           });
                            if(!response.ok){
                                const errorData = await response.json();
                                this.error = errorData.message || "Failed to create item"
                                 return;
                            }
                         await this.fetchData()
                   }catch(error){
                         this.error = error.message || "Error creating item"
                 }
                },
               logout(){
                 localStorage.removeItem('authToken')
                  this.$router.push('/login')
             }
          },
      };
   </script>
   <style scoped>
    table {
     border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
     }
   </style>
   