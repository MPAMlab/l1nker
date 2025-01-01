<template>
  <div id="app">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
       <div>{{ title }}</div>
      <!-- 暂时移除其他的渲染 -->
    </div>
  </div>
</template>

<script>
export default {
    data() {
      return {
          redirectKey: null,
        title: '',
        loading: true,
        error: null,
      };
    },
   async created() {
         this.redirectKey = window.location.pathname.substring(1);
        if (!this.redirectKey) {
            this.redirectKey = "default";
        }
        console.log("redirectKey:", this.redirectKey);
        console.log("window.location.pathname:", window.location.pathname);
        await this.fetchData();
    },
    methods: {
      async fetchData() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(`/api/data?key=${this.redirectKey}`);
                 console.log("response:", response)
                if (!response.ok) {
                    this.error = `Failed to fetch data: ${response.status} ${response.statusText}`;
                     console.error("fetch failed", response)
                    return;
                }
                const data = await response.json();
                console.log("data:", data)
                if (data.error) {
                    this.error = `Failed to fetch data from cloudflare d1: ${data.error}`;
                     console.error("data.error", data.error)
                    return;
                }
                 this.title = data.title;
            } catch (error) {
              this.error = `Error fetching data: ${error.message}`;
               console.error('Error fetching data:', error);
           } finally {
                this.loading = false;
            }
        },
    },
};
</script>
