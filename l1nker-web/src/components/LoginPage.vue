<template>
    <div>
      <h2>Login</h2>
      <input type="text" placeholder="Username" v-model="username" />
      <input type="password" placeholder="Password" v-model="password" />
      <button @click="login">Login</button>
      <p v-if="loginError">{{ loginError }}</p>
    </div>
   </template>
   
   <script>
   export default {
    data() {
      return {
        username: '',
        password: '',
        loginError: '',
      };
     },
    methods: {
     async login() {
        try {
         const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
             'Content-Type': 'application/json',
             },
             body: JSON.stringify({ username: this.username, password: this.password }),
         });
          if (!response.ok) {
              const errorData = await response.json()
              this.loginError = errorData.message || 'Login failed'
            return;
          }
         const data = await response.json();
           localStorage.setItem('authToken', data.token);
          this.$router.push('/admin');
        } catch (error) {
          console.error('Error during login:', error);
          this.loginError = 'Login failed';
       }
      },
    },
   };
   </script>
   