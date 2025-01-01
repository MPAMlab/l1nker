<template>
  <div id="app">
      <div v-if="loading">Loading...</div>
       <div v-else-if="error">Error: {{ error }}</div>
      <div v-else>
          <img :src="profileImageUrl" class="background-image" />
          <img :src="profileImageUrl" class="profile-image"/>
          <h1>{{ title }}</h1>
          <h2>{{ subtitle }}</h2>
          <div class="button-container">
              <LinkButton
                  v-for="(button, index) in buttons"
                  :key="index"
                  :text="button.text"
                  :link="button.link"
                  :backgroundColor="buttonColor"
                  :isDownload="button.isDownload"
              />
          </div>
      </div>
  </div>
</template>

<script>
import LinkButton from './LinkButton.vue';

export default {
  components: {
      LinkButton,
  },
  data() {
      return {
          redirectKey: null,
          profileImageUrl: '',
          title: '',
          subtitle: '',
          buttons: [],
          buttonColor: 'gray',
          faviconUrl: '',
          pageTitle: '',
          loading: true,
          error: null,
      };
  },
  async created() {
    this.redirectKey = window.location.pathname.substring(1); // 从 URL 获取 redirectKey
     if (!this.redirectKey) {
        console.log("redirectKey not found, set to default")
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
              const response = await fetch(`/api/data?key=${this.redirectKey}`); // 使用相对路径调用 worker
              if (!response.ok) {
                this.error = `Failed to fetch data: ${response.status} ${response.statusText}`
                   console.error("fetch failed", response)
                return
               }
               console.log("response:", response)
              const data = await response.json();
               console.log("data:", data)
                if(data.error){
                 this.error = `Failed to fetch data from cloudflare d1: ${data.error}`;
                   console.error("data.error", data.error)
                  return;
              }
              this.profileImageUrl = data.profileImageUrl;
              this.title = data.title;
              this.subtitle = data.subtitle;
              this.buttons = data.buttons;
              this.buttonColor = data.buttonColor;
              this.faviconUrl = data.faviconUrl
              this.pageTitle = data.pageTitle
              this.updateFaviconAndTitle();
          } catch (error) {
            this.error = `Error fetching data: ${error.message}`
            console.error('Error fetching data:', error);
          } finally {
             this.loading = false
          }
      },
      updateFaviconAndTitle() {
          // Update favicon
          let faviconLink = document.querySelector("link[rel~='icon']");
          if (faviconLink) {
              faviconLink.href = this.faviconUrl;
          } else {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'icon';
              faviconLink.href = this.faviconUrl;
              document.head.appendChild(faviconLink);
          }
          // Update title
          document.title = this.pageTitle;
      },
  },
};
</script>
<style scoped>
  /*  其他样式保持不变*/
  #app{
     display: flex;
     flex-direction: column;
     align-items: center;
  }
  .background-image {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: -1;
      opacity: 0.5;
  }
  .profile-image{
     width: 100px;
     height: 100px;
     border-radius: 50%;
     margin-bottom: 20px;
  }
  .button-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px; /* Add margin for spacing */
  }
</style>
