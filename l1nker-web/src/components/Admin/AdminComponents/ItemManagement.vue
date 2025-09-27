<template>
    <div>
      <ButtonCardEdit :item="item" />
    </div>
  </template>
<script>
import { defineComponent, ref, onMounted } from 'vue';
import ButtonCardEdit from './ButtonCardEdit.vue';

export default defineComponent({
  components: {
    ButtonCardEdit,
  },
  setup() {
    const item = ref({});

    onMounted(async () => {
      const id = window.location.pathname.split('/').pop();
      const response = await fetch(`/api/admin/data/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        item.value = await response.json();
      }
    });

    return {
      item
    };
  }
});
</script>
