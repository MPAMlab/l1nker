<template>
  <a :href="link" target="_blank" rel="noopener noreferrer" class="artist-link">
    <div class="link-content">
      <div class="platform-icon">
        <component :is="platformIcon" v-if="platformIcon" />
        <el-icon v-else><Link /></el-icon>
      </div>
      <div class="link-text">
        <span class="platform-name">{{ platform }}</span>
        <span class="visit-text">Visit</span>
      </div>
    </div>
  </a>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import {
  Link, VideoPlay, MusicNote, Picture, ChatDotRound,
  Shop, MoreFilled, Trophy, Star
} from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ArtistLinkButton',
  components: {
    Link, VideoPlay, MusicNote, Picture, ChatDotRound,
    Shop, MoreFilled, Trophy, Star
  },
  props: {
    platform: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const platformIcon = computed(() => {
      const platformLower = props.platform.toLowerCase();

      if (platformLower.includes('youtube') || platformLower.includes('video')) {
        return VideoPlay;
      }
      if (platformLower.includes('spotify') || platformLower.includes('music') || platformLower.includes('apple')) {
        return MusicNote;
      }
      if (platformLower.includes('instagram') || platformLower.includes('photo')) {
        return Picture;
      }
      if (platformLower.includes('twitter') || platformLower.includes('wechat') || platformLower.includes('weibo')) {
        return ChatDotRound;
      }
      if (platformLower.includes('shop') || platformLower.includes('store')) {
        return Shop;
      }
      if (platformLower.includes('patreon') || platformLower.includes('support')) {
        return Star;
      }
      if (platformLower.includes('award') || platformLower.includes('competition')) {
        return Trophy;
      }

      return null;
    });

    return {
      platformIcon,
    };
  },
});
</script>

<style scoped>
.artist-link {
  display: block;
  width: 100%;
  text-decoration: none;
  color: inherit;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.artist-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.link-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.platform-icon {
  width: 24px;
  height: 24px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.link-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 1;
  margin-left: 16px;
}

.platform-name {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
}

.visit-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 480px) {
  .artist-link {
    padding: 14px 16px;
  }

  .platform-name {
    font-size: 14px;
  }

  .visit-text {
    font-size: 11px;
  }
}
</style>