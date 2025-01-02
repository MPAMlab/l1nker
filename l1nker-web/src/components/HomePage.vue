<template>
  <div id="app" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="content">
      <div class="background-overlay"></div>
      <img :src="profileImageUrl" class="background-image" />
      
      <div class="profile-section">
        <img :src="profileImageUrl" class="profile-image" alt="Profile" />
        <h1 class="title">{{ title }}</h1>
        <h2 class="subtitle">{{ subtitle }}</h2>
      </div>

      <div class="button-container">
        <LinkButton
          v-for="(button, index) in buttons"
          :key="index"
          :text="button.text"
          :link="button.link"
          :backgroundColor="button.backgroundColor || defaultButtonColor"
          :isDownload="button.isDownload"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LinkButton from './LinkButton.vue';

interface Button {
  text: string;
  link: string;
  backgroundColor?: string;
  isDownload?: boolean;
}

export default defineComponent({
  name: 'HomePage',
  components: {
    LinkButton,
  },
  data() {
    return {
      profileImageUrl: '',
      title: '',
      subtitle: '',
      buttons: [] as Button[],
      defaultButtonColor: '#333333',
      faviconUrl: '',
      pageTitle: '',
      loading: true,
      error: null as string | null,
      redirectKey: 'default',
    };
  },
  async created() {
    const redirectKey = this.$route.params.redirectKey;
    if (!redirectKey) {
      console.log("redirectKey not found, set to default");
      this.redirectKey = 'default';
    } else {
      this.redirectKey = redirectKey as string;
      console.log("redirectKey:", this.redirectKey);
      console.log("window.location.pathname:", window.location.pathname);
    }

    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`/api/data?key=${this.redirectKey}`);
        if (!response.ok) {
          this.error = `Failed to fetch data: ${response.status} ${response.statusText}`;
          console.error("fetch failed", response);
          return;
        }
        console.log("response:", response);
        const data = await response.json();
        console.log("data:", data);
        
        if (data.error) {
          this.error = `Failed to fetch data from cloudflare d1: ${data.error}`;
          console.error("data.error", data.error);
          return;
        }
        
        this.profileImageUrl = data.profileImageUrl;
        this.title = data.title;
        this.subtitle = data.subtitle;
        this.buttons = data.buttons;
        this.faviconUrl = data.faviconUrl;
        this.pageTitle = data.pageTitle;
        this.updateFaviconAndTitle();
      } catch (error) {
        const err = error as Error;
        this.error = `Error fetching data: ${err.message}`;
        console.error('Error fetching data:', error);
      } finally {
        this.loading = false;
      }
    },
    updateFaviconAndTitle() {
      // Update favicon
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
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
});
</script>

<style scoped>
/* Style remains the same as before */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
  background-color: #1a1a1a;
  color: white;
}

.loading, .error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 18px;
}

.content {
  width: 100%;
  max-width: 500px;
  z-index: 1;
  position: relative;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  filter: blur(10px);
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: -1;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  opacity: 0.8;
  text-align: center;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

@media (max-width: 480px) {
  .content {
    padding: 0 16px;
  }
  
  .profile-image {
    width: 100px;
    height: 100px;
  }
}
</style>