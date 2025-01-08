<template>
    <div class="profile-section">
      <img :src="profileImageUrl ? `/images/${profileImageUrl}` : null" class="profile-image" alt="Profile" />
      <h1 class="title" :style="{ color: textColor }">{{ title }}</h1>
      <h2 class="subtitle" :style="{ color: textColor }">{{ subtitle }}</h2>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'LinkProfile',
    props: {
      profileImageUrl: { type: String, default: '' },
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      textColor: { type: String, default: 'white' }
    },
  });
  </script>
  
  <style scoped>
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
  </style>
  