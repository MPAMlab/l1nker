<template>
  <div id="app" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="content">
      <div class="background-overlay"></div>
      <img :src="profileImageUrl" class="background-image" @load="handleImageLoad" />

      <div class="profile-section">
        <img :src="profileImageUrl ? `/images/${profileImageUrl}` : null" class="profile-image" alt="Profile" />
        <h1 class="title" :style="{ color: textColor }">{{ title }}</h1>
        <h2 class="subtitle" :style="{ color: textColor }">{{ subtitle }}</h2>
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
    <footer class="footer">
        <p class="powered-by">
          Powered by <a href="https://github.com/MPAMlab/l1nker" target="_blank" rel="noopener noreferrer">L1nker by MPAM Laboratory.</a><br>
          This site currently don't use cookie to store your information.<br>This page may contain affiliate links.
        </p>
      </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import LinkButton from './LinkButton.vue';
import Color from 'color';

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
            textColor: 'white',
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
              let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
              if (faviconLink) {
                 faviconLink.href = this.faviconUrl ? `/images/${this.faviconUrl}` : "";
            } else {
                faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                 faviconLink.href = this.faviconUrl ? `/images/${this.faviconUrl}` : "";
                 document.head.appendChild(faviconLink);
            }
            document.title = this.pageTitle;
        },
    handleImageLoad(event: Event) {
      const imageElement = event.target as HTMLImageElement;
      const imageUrl = imageElement.src;
        this.calculateTextColor(imageUrl);
    },
     calculateTextColor(imageUrl:string) {
            const img = new Image();
           img.src = imageUrl;

             img.onload = () => {
               const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if(!ctx) return;

                 canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
               ctx.drawImage(img, 0, 0);

               const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
               let totalBrightness = 0;
               for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                      totalBrightness += brightness;
                 }
                const averageBrightness = totalBrightness / (data.length / 4);
               const overlayBrightness = (0 * 299 + 0 * 587 + 0 * 114) / 1000 * 0.6;
               const combinedBrightness = (averageBrightness + overlayBrightness) / 2
               this.textColor = combinedBrightness < 128 ? 'white' : 'black';
            }
            img.onerror = () => {
             this.textColor = 'white'
            }
        },
    },
});
</script>

<style>
/* 全局样式 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&display=swap');

:root {
  font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Noto Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1a1a;
}
</style>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
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
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
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
  margin: 40px 0;
  width: 100%;
}

.profile-image {
  width: 30vh;
  height: 30vh;
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
  gap: 10px;
  width: 85%;
  max-width: 460px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}
.footer {
  width: 100%;
  text-align: center;
  padding: 20px 0 20px;
  margin-top: auto;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  flex-shrink: 0;
  z-index: 1;
}

.powered-by {
  margin: 0;
  font-size: 12px;
}
.powered-by a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: color 0.2s ease;
}
.powered-by a:hover {
  color: white;
}
@media (max-width: 480px) {
  .content {
    padding: 0 16px;
  }

  .profile-image {
    width: 25vh;
    height: 25vh;
  }

  .button-container {
    padding: 0 8px;
    gap: 10px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 15px;
  }
  .powered-by {
    font-size: 11px;
  }

}

@media (max-width: 360px) {
  .content {
    padding: 0 12px;
  }

  .button-container {
    padding: 0 4px;
  }
}
</style>
