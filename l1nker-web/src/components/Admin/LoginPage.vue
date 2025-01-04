<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>Login</h2>
        </div>
      </template>
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="Username">
          <el-input
            v-model.trim="loginForm.username"
            placeholder="Enter username"
          />
        </el-form-item>
        <el-form-item label="Password">
          <el-input
            type="password"
            v-model.trim="loginForm.password"
            placeholder="Enter password"
              @keyup.enter="login"
          />
        </el-form-item>
         <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">Remember Me</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="login">Login</el-button>
        </el-form-item>
      </el-form>
       <el-alert v-if="loginError" type="error" :closable="false" :title="loginError" style="margin-top: 20px;"/>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';

export default {
  data() {
    return {
      loginForm: {
        username: "",
        password: "",
         rememberMe: false,
      },
      loginError: "",
      loading: false,
    };
  },
  created() {
    // 尝试从 localStorage 中加载数据
    if (localStorage.getItem("rememberMe") === "true") {
      this.loginForm.username = localStorage.getItem("rememberedUsername") || "";
      this.loginForm.password = localStorage.getItem("rememberedPassword") || "";
      this.loginForm.rememberMe = true;
    }
  },
  methods: {
    async login() {
         this.loading = true;
         this.loginError = '';
      try {
         if(!this.loginForm.username || !this.loginForm.password) {
            this.loginError = "Username and password cannot be empty.";
             return;
         }
          // 保存用户名和密码到 localStorage
          if (this.loginForm.rememberMe) {
            localStorage.setItem("rememberedUsername", this.loginForm.username);
            localStorage.setItem("rememberedPassword", this.loginForm.password);
             localStorage.setItem("rememberMe", "true");
          } else {
              localStorage.removeItem('rememberedUsername');
              localStorage.removeItem('rememberedPassword');
              localStorage.removeItem('rememberMe');
          }
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.loginForm.username,
            password: this.loginForm.password,
          }),
        });
       if (response.status === 401) {
           const errorData = await response.json();
          this.loginError = errorData.message || "Invalid username or password";
            return;
        }
         if (!response.ok) {
            this.loginError = `Login failed, status code: ${response.status}`;
             return;
         }
        const data = await response.json();
           localStorage.setItem("authToken", data.token);
        this.$router.push("/admin");
        ElMessage.success("Login successfully!");
      } catch (error) {
        console.error("Error during login:", error);
         this.loginError = "Login failed";
      }finally {
         this.loading = false
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
