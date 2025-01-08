<template>
    <div>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="Music Links">
          <el-table :data="form.musicLinks" border>
            <el-table-column prop="platform" label="Platform" />
            <el-table-column prop="link" label="Link" />
            <el-table-column prop="backgroundColor" label="Background Color" />
            <el-table-column prop="isDownload" label="Is Downloadable?" />
            <el-table-column label="Actions" width="120">
              <template #default="scope">
                <el-button type="text" size="small" @click="editMusic(scope.$index)">Edit</el-button>
                <el-button type="text" size="small" @click="deleteMusic(scope.$index)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addMusic">Add Music Link</el-button>
        </el-form-item>
      </el-form>
      <el-dialog v-model="editDialogVisible" title="Edit Music Link" width="50%">
        <el-form ref="editFormRef" :model="editForm" label-width="120px">
          <el-form-item label="Platform">
            <el-select v-model="editForm.platform" placeholder="Select Platform">
              <el-option label="Spotify" value="Spotify" />
              <el-option label="Apple Music" value="Apple Music" />
              <el-option label="YouTube Music" value="YouTube Music" />
              <el-option label="Other" value="Other" />
            </el-select>
          </el-form-item>
          <el-form-item label="Link">
            <el-input v-model="editForm.link" />
          </el-form-item>
          <el-form-item label="Background Color">
            <el-color-picker v-model="editForm.backgroundColor" />
          </el-form-item>
            <el-form-item label="Is Downloadable?">
                <el-switch v-model="editForm.isDownload" />
            </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveEditMusic">Save</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  
  export default {
    props: {
      item: { type: Object, required: true },
      isEdit: { type: Boolean, default: false },
      uploadUrl: { type: String, default: '' },
    },
    setup(props, { emit }) {
      const formRef = ref(null);
        const form = ref({ musicLinks: [] });
      const editDialogVisible = ref(false);
      const editForm = ref({
        platform: '',
        link: '',
        backgroundColor: '#333',
          isDownload:false
      });
         const editIndex = ref(-1)
  
  
         watch(() => props.item, (newVal) => {
             form.value = {
                 musicLinks: newVal.musicLinks ? [...newVal.musicLinks] : []
             }
         }, { deep: true, immediate: true })
  
  
  
      const addMusic = () => {
          form.value.musicLinks.push({
              platform: 'Spotify',
              link: '',
              backgroundColor: '#333',
              isDownload:false
          });
         emit('update:item', form.value.musicLinks);
      };
      const editMusic = (index) => {
          editIndex.value = index
        editForm.value = { ...form.value.musicLinks[index] };
        editDialogVisible.value = true;
      };
      const deleteMusic = (index) => {
          form.value.musicLinks.splice(index, 1);
          emit('update:item', form.value.musicLinks);
      };
      const saveEditMusic = () => {
        form.value.musicLinks[editIndex.value] = { ...editForm.value };
          emit('update:item', form.value.musicLinks);
        editDialogVisible.value = false;
        ElMessage.success('Music link updated successfully');
      };
      return {
        formRef,
          form,
        addMusic,
        editMusic,
        deleteMusic,
        editDialogVisible,
        editForm,
        saveEditMusic,
      };
    },
  };
  </script>
  