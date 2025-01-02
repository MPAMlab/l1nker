<template>
    <el-form :model="item" label-width="150px">
      <el-form-item label="ID" v-if="item.id">
        <el-input v-model="item.id" disabled />
      </el-form-item>
      <el-form-item label="New Redirect Key">
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
          :action="'/api/upload'"
          :on-success="handleProfileImageUploadSuccess"
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
        <div v-if="item.buttons && item.buttons.length > 0" style="margin-top: 10px;">
          <div
            v-for="(button, index) in item.buttons"
            :key="index"
            style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 4px;"
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
          :action="'/api/upload'"
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
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('close')">Cancel</el-button>
        <el-button type="primary" @click="$emit('update', item)">Update</el-button>
        <el-button type="danger" v-if="item.id" @click="$emit('delete', item.id)">Delete</el-button>
        <el-button type="warning" @click="$emit('update-redirect-key', item.id, item.newRedirectKey)">Update RedirectKey</el-button>
      </span>
    </template>
  </template>
  
  <script>
  import { ref } from 'vue';
  
  export default {
      props: {
          item: {
              type: Object,
              required: true
          }
      },
      emits: ['update', 'delete', 'update-redirect-key', 'close'],
      setup(props, { emit }){
          const addButton = () => {
              if(!props.item.buttons) props.item.buttons = [];
              props.item.buttons.push({ text: '', link: '', isDownload: false });
          };
          const removeButton = (index) => {
              props.item.buttons.splice(index, 1);
          };
          const handleProfileImageUploadSuccess = (response) => {
              props.item.profileImageUrl = response.imageUrl;
          };
          const handleFaviconUploadSuccess = (response) => {
              props.item.faviconUrl = response.imageUrl;
          };
          const beforeUpload = (file) => {
              const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
              const isLt2M = file.size / 1024 / 1024 < 2;
      
              if (!isJPG) {
                  ElMessage.error('Upload image files only!');
              }
              if (!isLt2M) {
                  ElMessage.error('Image size must not exceed 2MB!');
              }
              return isJPG && isLt2M;
          };
  
          return { addButton, removeButton, handleProfileImageUploadSuccess, handleFaviconUploadSuccess, beforeUpload };
      }
  };
  </script>
  