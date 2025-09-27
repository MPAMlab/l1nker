<template>
  <el-form :model="item" label-width="150px" ref="itemForm">
    <el-form-item label="Redirect Key" v-if="!isEdit">
      <el-input v-model="item.redirectKey" />
    </el-form-item>
    <el-form-item label="New Redirect Key" v-else>
      <el-input v-model="item.newRedirectKey" />
    </el-form-item>

    <el-form-item label="Profile Image">
      <el-image
        style="width: 100px; height: 100px; margin-right: 10px;"
        :src="item.profileImageUrl ? `https://sp.srt.pub/images/${item.profileImageUrl}` : ''"
        fit="cover"
      />
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :on-success="handleImageUploadSuccess"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :headers="uploadHeaders"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>Upload Image
        </el-button>
      </el-upload>
    </el-form-item>

    <el-form-item label="Title">
      <el-input v-model="item.title" />
    </el-form-item>
    <el-form-item label="Subtitle">
      <el-input v-model="item.subtitle" />
    </el-form-item>
    <el-form-item label="Buttons">
      <div v-if="localButtons.length > 0" style="margin-top: 10px;">
        <draggable
          v-model="localButtons"
          :component-data="{
            tag: 'div',
            type: 'transition-group',
            name: !drag ? 'flip-list' : null,
          }"
          item-key="text"
          handle=".drag-handle"
          :animation="200"
          @start="drag = true"
          @end="drag = false"
          @change="handleDragChange"
        >
          <template #item="{ element, index }">
            <div
              :key="`${element.text}-${index}`"
              class="button-item"
              style="
                border: 1px solid #eee;
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                cursor: pointer;
              "
              @click="editButton(index)"
            >
              <div
                style="
                  margin-bottom: 10px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <span style="font-weight: bold;">Button #{{ index + 1 }}</span>
                <el-icon class="drag-handle" style="cursor: move; padding: 4px;">
                  <Rank />
                </el-icon>
              </div>
              <div v-if="editingIndex === index">
                <el-form-item label="Text">
                  <el-input v-model="element.text" />
                </el-form-item>
                <el-form-item label="Link">
                  <el-input v-model="element.link" />
                </el-form-item>
                <el-form-item label="Is Download">
                  <el-checkbox v-model="element.isDownload" />
                </el-form-item>
                <el-button type="danger" size="small" @click="removeButton(index)">
                  <el-icon><Delete /></el-icon>Delete
                </el-button>
                <el-button type="primary" size="small" @click="cancelEditButton">Cancel</el-button>
              </div>
              <div v-else>
                <p>Text: {{ element.text }}</p>
                <p>Link: {{ element.link }}</p>
                <p>Is Download: {{ element.isDownload }}</p>
              </div>
            </div>
          </template>
        </draggable>
      </div>
      <div v-else>
        <el-empty description="No buttons available." />
      </div>
    </el-form-item>
    <div style="margin-left: 150px; margin-bottom: 20px;">
      <el-button type="primary" @click="addButton">
        <el-icon><Plus /></el-icon>Add Button
      </el-button>
    </div>

    <el-form-item label="Button Color">
      <el-color-picker v-model="item.buttonColor" />
    </el-form-item>
    <el-form-item label="Favicon">
      <el-image
        style="width: 32px; height: 32px; margin-right: 10px;"
        :src="item.faviconUrl ? `https://sp.srt.pub/images/${item.faviconUrl}` : ''"
        fit="cover"
      />
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :on-success="handleFaviconUploadSuccess"
        :before-upload="beforeUpload"
        :show-file-list="false"
        :headers="uploadHeaders"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>Upload Favicon
        </el-button>
      </el-upload>
    </el-form-item>
    <el-form-item label="Page Title">
      <el-input v-model="item.pageTitle" />
    </el-form-item>
  </el-form>
</template>

<script>
import { ref, defineComponent, onMounted, watchEffect } from 'vue';
import draggable from 'vuedraggable';
import { Rank, Delete, Plus, Upload } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    draggable,
    Rank,
    Delete,
    Plus,
    Upload,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
    uploadUrl: {
      type: String,
      default: '/api/upload',
    },
  },
  setup(props, { emit }) {
    const localButtons = ref([]);
    const itemForm = ref(null);
    const editingIndex = ref(-1);
    const drag = ref(false);
    const uploadHeaders = ref({
      Authorization: `Bearer ${localStorage.getItem('authToken')}`
    });

    // Initialize from props
    const item = ref(props.item || {});

    // Update local buttons when item changes
    watchEffect(() => {
      if (props.item && props.item.buttons) {
        try {
          let buttonsData;
          if (typeof props.item.buttons === 'string') {
            buttonsData = JSON.parse(props.item.buttons);
          } else {
            buttonsData = props.item.buttons;
          }

          // Ensure buttonsData is an array and filter out invalid entries
          if (Array.isArray(buttonsData)) {
            localButtons.value = buttonsData
              .filter(btn => btn && typeof btn === 'object' && btn.text && btn.link)
              .map(btn => ({
                text: btn.text || '',
                link: btn.link || '',
                isDownload: Boolean(btn.isDownload),
                backgroundColor: btn.backgroundColor || item.value.buttonColor || '#3498db'
              }));
          } else {
            localButtons.value = [];
          }
        } catch (e) {
          console.error('Failed to parse buttons:', e);
          localButtons.value = [];
        }
      } else {
        localButtons.value = [];
      }
    });

    const addButton = () => {
      localButtons.value.push({
        text: '',
        link: '',
        isDownload: false,
        backgroundColor: item.value.buttonColor || '#3498db',
      });
    };

    const removeButton = (index) => {
      localButtons.value.splice(index, 1);
      if (editingIndex.value === index) {
        editingIndex.value = -1;
      } else if (editingIndex.value > index) {
        editingIndex.value--;
      }
    };

    const editButton = (index) => {
      editingIndex.value = index;
    };

    const cancelEditButton = () => {
      editingIndex.value = -1;
    };

    const handleDragChange = (evt) => {
      // 当拖动完成后，通知父组件更新
      emit('update:item', {
        ...item.value,
        buttons: JSON.stringify(localButtons.value)
      });
    };

    const handleImageUploadSuccess = (response) => {
      item.value.profileImageUrl = response.imageUrl;
      // Notify parent of changes
      emit('update:item', { ...item.value });
    };

    const handleFaviconUploadSuccess = (response) => {
      item.value.faviconUrl = response.imageUrl;
      // Notify parent of changes
      emit('update:item', { ...item.value });
    };

    const beforeUpload = (file) => {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        console.error('Upload image files only!');
        return false;
      }
      if (!isLt2M) {
        console.error('Image size must not exceed 2MB!');
        return false;
      }
      return true;
    };

    return {
      localButtons,
      addButton,
      removeButton,
      handleDragChange,
      handleImageUploadSuccess,
      handleFaviconUploadSuccess,
      beforeUpload,
      itemForm,
      editingIndex,
      editButton,
      cancelEditButton,
      drag,
      item,
      uploadHeaders,
    };
  },
});
</script>

<style scoped>
.drag-handle {
  color: #909399;
  cursor: move;
}
.drag-handle:hover {
  color: #409EFF;
}

.button-item {
  transition: all 0.3s ease;
}

.button-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.flip-list-move {
  transition: transform 0.5s;
}

.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.5s;
}

.flip-list-enter-from,
.flip-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>