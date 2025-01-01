<template>
  <div>
    <h2>Login</h2>
    <input type="text" placeholder="Username" v-model="username" />
    <input type="password" placeholder="Password" v-model="password" />
    <div>
        <input type="checkbox" id="rememberMe" v-model="rememberMe" />
        <label for="rememberMe">Remember Me</label>
    </div>
    <button @click="login">Login</button>
    <p v-if="loginError">{{ loginError }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      loginError: "",
      rememberMe: false,
    };
  },
  created() {
    // 尝试从 localStorage 中加载数据
    if (localStorage.getItem("rememberMe") === "true") {
       this.username = localStorage.getItem("rememberedUsername") || "";
      this.password = localStorage.getItem("rememberedPassword") || "";
      this.rememberMe = true;
    }
  },
  methods: {
    async login() {
      try {
          // 保存用户名和密码到 localStorage
          if (this.rememberMe) {
            localStorage.setItem("rememberedUsername", this.username);
            localStorage.setItem("rememberedPassword", this.password);
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
          body: JSON.stringify({ username: this.username, password: this.password }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          this.loginError = errorData.message || "Login failed";
          return;
        }
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        this.$router.push("/admin");
      } catch (error) {
        console.error("Error during login:", error);
        this.loginError = "Login failed";
      }
    },
  },
};
</script>
