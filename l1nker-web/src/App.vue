<template>
  <div id="app">
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
</template>

<script>
import LinkButton from './components/LinkButton.vue';

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
      pageTitle: ''
    };
  },
  async created() {
    this.redirectKey = window.location.pathname.substring(1); // 从 URL 获取 redirectKey
     if (!this.redirectKey) {
        console.log("redirectKey not found, set to default")
        this.redirectKey = "default";
    }
    await this.fetchData();
    this.updateFaviconAndTitle();
  },
   methods: {
    async fetchData() {
       try {
        const response = await fetch(`/api/data?key=${this.redirectKey}`); // 使用相对路径调用 worker
        if (!response.ok) {
           console.error('Failed to fetch data:', response.status, response.statusText);
          return
        }
        const data = await response.json();
          if(data.error){
           console.error('Failed to fetch data from cloudflare d1:', data.error);
          return;
         }
        this.profileImageUrl = data.profileImageUrl;
        this.title = data.title;
        this.subtitle = data.subtitle;
        this.buttons = data.buttons;
        this.buttonColor = data.buttonColor;
         this.faviconUrl = data.faviconUrl
         this.pageTitle = data.pageTitle
      } catch (error) {
        console.error('Error fetching data:', error);
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
