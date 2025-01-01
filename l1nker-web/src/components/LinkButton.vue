<template>
  <a
    :href="link"
    class="link-button"
    :style="{ backgroundColor: backgroundColor }"
    target="_blank"
  >
      <span>{{ text }}</span>
      <div :style="{backgroundColor: isDownload ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' , color: isDownload ? 'white' : 'black'  }">{{ isDownload ? '下载' : '播放' }}</div>
  </a>
</template>

<script>
export default {
  props: {
    text: { type: String, required: true },
    link: { type: String, required: true },
    backgroundColor: { type: String, required: true },
    isDownload: { type: Boolean, default: false }
  },
};
</script>
