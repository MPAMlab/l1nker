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
      <div v-if="buttons && buttons.length > 0" style="margin-top: 10px;">
        <draggable v-model="buttons" tag="div" handle=".button-item">
          <div
            v-for="(button, index) in buttons"
            :key="index"
            style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 4px; cursor: move;"
            class="button-item"
          >
            <div style="margin-bottom: 10px;">
              <span style="font-weight: bold;">Button #{{ index + 1 }}:</span>
            </div>
            <el-form-item label="Text">
              <el-input v-model="button.text" />
            </el-form-item>
            <el-form-item label="Link">
              <el-input v-model="button.link" />
            </el-form-item>
            <el-form-item label="Is Download">
              <el-checkbox v-model="button.isDownload" />
            </el-form-item>
            <el-button type="danger" size="small" @click="removeButton(index)">
              <el-icon><Delete /></el-icon>Delete
            </el-button>
          </div>
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
import { ref, defineComponent } from 'vue';
import draggable from 'vuedraggable';

export default defineComponent({
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
  setup(props) {
    const buttons = ref(props.item.buttons || []);
    const itemForm = ref(null);

    const addButton = () => {
      buttons.value.push({ text: '', link: '', isDownload: false });
    };

    const removeButton = (index) => {
      buttons.value.splice(index, 1);
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
      buttons,
      addButton,
      removeButton,
      handleImageUploadSuccess,
      handleFaviconUploadSuccess,
      beforeUpload,
      itemForm,
    };
  },
});
</script>
