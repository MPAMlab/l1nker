<template>
    <div>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="Profile Image URL">
            <el-input v-model="form.profileImageUrl" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="Subtitle">
          <el-input type="textarea" v-model="form.subtitle" />
        </el-form-item>
      </el-form>
    </div>
  </template>
  
  <script>
  import { ref, watch } from 'vue';
  
  export default {
    props: {
      item: { type: Object, required: true },
      isEdit: { type: Boolean, default: false },
      uploadUrl: { type: String, default: '' },
    },
    setup(props, { emit }) {
        const formRef = ref(null);
        const form = ref({
            profileImageUrl: '',
            title: '',
            subtitle: '',
        });
  
  
        watch(() => props.item, (newVal) => {
            form.value = {
               profileImageUrl: newVal.profileImageUrl || '',
               title: newVal.title || '',
               subtitle: newVal.subtitle || '',
            };
        }, { deep: true, immediate: true })
  
  
          watch(() => form.value,(newVal)=>{
              emit('update:item',newVal)
         }, { deep: true });
  
  
      return {
        formRef,
        form,
      };
    },
  };
  </script>
  