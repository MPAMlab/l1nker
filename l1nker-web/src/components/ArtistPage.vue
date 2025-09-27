<template>
  <div id="app" :class="{ 'is-loading': loading }">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="content">
      <div class="background-overlay"></div>
      <img
        :src="profilePhotoUrl ? `https://sp.srt.pub/images/${profilePhotoUrl}` : null"
        class="background-image"
        @load="handleImageLoad"
      />

      <div class="profile-section">
        <img
          :src="profilePhotoUrl ? `https://sp.srt.pub/images/${profilePhotoUrl}` : null"
          class="profile-image"
          alt="Profile"
        />
        <h1 class="title" :style="{ color: textColor }">{{ artistName }}</h1>
        <p class="main-profile" :style="{ color: textColor }">{{ mainProfile }}</p>
      </div>

      <div class="secondary-profile-section" v-if="secondaryProfile">
        <div class="secondary-profile-content" :style="{ color: textColor }">
          <div v-for="(paragraph, index) in secondaryProfileParagraphs" :key="index" class="paragraph">
            <p>{{ paragraph }}</p>
          </div>
        </div>
      </div>

      <div class="links-section">
        <ArtistLinkButton
          v-for="(link, index) in links"
          :key="index"
          :platform="link.platform_name"
          :link="link.url"
        />
      </div>
    </div>
    <footer class="footer">
        <p class="powered-by">
          Powered by <a href="https://github.com/MPAMlab/l1nker" target="_blank" rel="noopener noreferrer">L1nker by MPAM Laboratory.</a>
        </p>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import ArtistLinkButton from './FrontEnd/ArtistLinkButton.vue';
import Color from 'color';

export default defineComponent({
  name: 'ArtistPage',
  components: {
    ArtistLinkButton,
  },
  data() {
    return {
      profilePhotoUrl: '',
      artistName: '',
      mainProfile: '',
      secondaryProfile: '',
      links: [],
      loading: true,
      error: null as string | null,
      artistKey: '',
      textColor: 'white',
    };
  },
  computed: {
    secondaryProfileParagraphs(): string[] {
      if (!this.secondaryProfile) return [];
      return this.secondaryProfile.split('\n').filter(p => p.trim());
    }
  },
  async created() {
    const artistKey = this.$route.params.artistKey;
    if (!artistKey) {
      this.error = 'No artist key provided';
      this.loading = false;
      return;
    }
    this.artistKey = artistKey as string;
    await this.fetchArtistData();
  },
  methods: {
    async fetchArtistData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`/api/artist/${this.artistKey}`);
        if (!response.ok) {
          if (response.status === 404) {
            window.location.href = '/404';
            return;
          }
          this.error = `Failed to fetch artist data: ${response.status} ${response.statusText}`;
          console.error("fetch failed", response);
          return;
        }
        const data = await response.json();

        if (data.error) {
          this.error = `Failed to fetch artist data: ${data.error}`;
          console.error("data.error", data.error);
          return;
        }

        this.profilePhotoUrl = data.profile_photo_url;
        this.artistName = data.artist_name;
        this.mainProfile = data.main_profile;
        this.secondaryProfile = data.secondary_profile;
        this.links = data.links || [];
      } catch (error) {
        const err = error as Error;
        this.error = `Error fetching artist data: ${err.message}`;
        console.error('Error fetching artist data:', error);
      } finally {
        this.loading = false;
      }
    },
    handleImageLoad(event: Event) {
      const imageElement = event.target as HTMLImageElement;
      const imageUrl = imageElement.src;
      this.calculateTextColor(imageUrl);
    },
    calculateTextColor(imageUrl: string) {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
        const combinedBrightness = (averageBrightness + overlayBrightness) / 2;
        this.textColor = combinedBrightness < 128 ? 'white' : 'black';
      };
      img.onerror = () => {
        this.textColor = 'white';
      };
    },
  },
});
</script>

<style>
/* Global styles */
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
  max-width: 800px;
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
  border-radius: 50%;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  object-fit: cover;
}

.title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-align: center;
}

.main-profile {
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
  text-align: center;
  max-width: 600px;
  line-height: 1.6;
}

.secondary-profile-section {
  width: 100%;
  margin: 20px 0 40px;
}

.secondary-profile-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 30px;
  line-height: 1.8;
}

.paragraph {
  margin-bottom: 20px;
}

.paragraph:last-child {
  margin-bottom: 0;
}

.paragraph p {
  margin: 0;
}

.links-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: 400px;
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

@media (max-width: 768px) {
  .content {
    padding: 20px 16px;
  }

  .profile-image {
    width: 25vh;
    height: 25vh;
  }

  .title {
    font-size: 28px;
  }

  .main-profile {
    font-size: 16px;
  }

  .secondary-profile-content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .profile-section {
    margin: 30px 0;
  }

  .profile-image {
    width: 20vh;
    height: 20vh;
  }

  .title {
    font-size: 24px;
  }

  .links-section {
    padding: 0 12px;
  }
}
</style>