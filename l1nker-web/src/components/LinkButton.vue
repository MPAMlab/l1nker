<template>
  <a
    :href="link"
    class="link-button"
    :class="{ 'is-download': isDownload }"
    :style="{ backgroundColor }"
    target="_blank"
    rel="noopener noreferrer"
  >
    <div class="button-content">
       <span class="service-name">{{ text }}</span>
      <div class="action-badge">
        <font-awesome-icon v-if="!isDownload" :icon="['fas', 'play']" style="margin-right: 8px" />
        <font-awesome-icon v-if="isDownload" :icon="['far', 'circle-down']" style="margin-right: 8px" />
        {{ isDownload ? 'Download' : 'Play' }}
      </div>
    </div>
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

<style scoped>
.link-button {
  width: 100%;
  max-width: 400px;
  padding: 12px 20px;
  margin: 6px 0;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  display: block;
  transition: opacity 0.2s ease;
}

.link-button:hover {
  opacity: 0.9;
}

.button-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-name {
  font-size: 16px;
  font-weight: 500;
}

.action-badge {
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
}

.is-download .action-badge {
  background: rgba(255, 255, 255, 0.2);
}
</style>
