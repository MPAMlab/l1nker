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
        :src="item.profileImageUrl"
        fit="cover"
      />
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :on-success="handleImageUploadSuccess"
        :before-upload="beforeUpload"
        :show-file-list="false"
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
      <el-button type="primary" @click="addButton">
        <el-icon><Plus /></el-icon>Add Button
      </el-button>
      <div v-if="localButtons.length > 0" style="margin-top: 10px;">
        <draggable 
          v-model="localButtons" 
          tag="div" 
          handle=".drag-handle"
          :animation="200"
          @change="handleDragChange"
        >
          <template #item="{ element, index }">
            <div
              class="button-item"
              style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 4px;"
            >
              <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">Button #{{ index + 1 }}</span>
                <el-icon 
                  class="drag-handle" 
                  style="cursor: move; padding: 4px;"
                >
                  <Rank />
                </el-icon>
              </div>
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
            </div>
          </template>
        </draggable>
      </div>
      <div v-else>
        <el-empty description="No buttons available." />
      </div>
    </el-form-item>
    <el-form-item label="Button Color">
      <el-color-picker v-model="item.buttonColor" />
    </el-form-item>
    <el-form-item label="Favicon">
      <el-image
        style="width: 32px; height: 32px; margin-right: 10px;"
        :src="item.faviconUrl"
        fit="cover"
      />
      <el-upload
        class="upload-demo"
        :action="uploadUrl"
        :on-success="handleFaviconUploadSuccess"
        :before-upload="beforeUpload"
        :show-file-list="false"
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
import { ref, defineComponent, watch } from 'vue';
import draggable from 'vuedraggable';
import { Rank } from '@element-plus/icons-vue';

export default defineComponent({
  components: {
    draggable,
    Rank,
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
    const localButtons = ref([...props.item.buttons || []]);
    const itemForm = ref(null);

    // 监听本地按钮数组的变化，同步到父组件
    watch(localButtons, (newValue) => {
      props.item.buttons = [...newValue];
    }, { deep: true });

    const addButton = () => {
      localButtons.value.push({ 
        text: '', 
        link: '', 
        isDownload: false,
        backgroundColor: props.item.buttonColor || '#3498db'
      });
    };

    const removeButton = (index) => {
      localButtons.value.splice(index, 1);
    };

    const handleDragChange = (evt) => {
      // 可以在这里添加额外的拖拽完成后的逻辑
      console.log('Drag completed', evt);
    };

    const handleImageUploadSuccess = (response) => {
      props.item.profileImageUrl = response.imageUrl;
    };

    const handleFaviconUploadSuccess = (response) => {
      props.item.faviconUrl = response.imageUrl;
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
    };
  },
});
</script>

<style scoped>
.drag-handle {
  color: #909399;
}
.drag-handle:hover {
  color: #409EFF;
}
</style>