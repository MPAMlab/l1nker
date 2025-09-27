<template>
    <div>
      <ButtonCardEdit :itemId="$route.params.id" />
    </div>
  </template>
  
  <script>
  import { defineComponent } from 'vue';
  import ButtonCardEdit from './ButtonCardEdit.vue';
  
  export default defineComponent({
    components: {
      ButtonCardEdit,
    },
    props: {
      itemId: {
        type: String,
        required: true,
      },
    },
  });
  </script>