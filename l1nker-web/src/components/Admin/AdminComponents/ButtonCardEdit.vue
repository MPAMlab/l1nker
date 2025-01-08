// ButtonCardEdit.vue
<template>
    <div>
        <el-form ref="formRef" :model="form" label-width="120px" >
            <el-form-item label="Buttons">
                <el-table :data="form.buttons" border>
                    <el-table-column prop="text" label="Text" />
                    <el-table-column prop="link" label="Link" />
                    <el-table-column prop="backgroundColor" label="Background Color" />
                    <el-table-column label="Actions" width="120">
                        <template #default="scope">
                            <el-button type="text" size="small" @click="editButton(scope.$index)">Edit</el-button>
                            <el-button type="text" size="small" @click="deleteButton(scope.$index)">Delete</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addButton">Add Button</el-button>
            </el-form-item>
        </el-form>

        <el-dialog v-model="editDialogVisible" title="Edit Button" width="50%">
            <el-form ref="editFormRef" :model="editForm" label-width="120px">
                <el-form-item label="Text">
                    <el-input v-model="editForm.text" />
                </el-form-item>
                <el-form-item label="Link">
                    <el-input v-model="editForm.link" />
                </el-form-item>
                <el-form-item label="Background Color">
                    <el-color-picker v-model="editForm.backgroundColor" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editDialogVisible = false">Cancel</el-button>
                <el-button type="primary" @click="saveEditButton">Save</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script>
import { ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
export default {
    props: {
        item: { type: Object, required: true },
        isEdit: { type: Boolean, default: false },
        uploadUrl: { type: String, default: '' },
    },
    setup(props, { emit }) {
        const formRef = ref(null);
        const form = ref({ buttons: [] });
        const editDialogVisible = ref(false);
        const editForm = ref({
            text: '',
            link: '',
            backgroundColor: '',
        });
        const editIndex = ref(-1)


         watch(() => props.item, (newVal) => {
            form.value = {
              buttons:  newVal.buttons ?  [...newVal.buttons] : []
            };
       },{ deep: true, immediate: true })


        const addButton = () => {
            form.value.buttons.push({
                text: '',
                link: '',
                backgroundColor: '#333',
            });
            emit('update:item', form.value.buttons);
        };
        const editButton = (index) => {
            editIndex.value = index
            editForm.value = { ...form.value.buttons[index] };
            editDialogVisible.value = true;
        };
        const deleteButton = (index) => {
            form.value.buttons.splice(index, 1);
            emit('update:item', form.value.buttons);
        };

        const saveEditButton = () => {
            form.value.buttons[editIndex.value] = { ...editForm.value };
             emit('update:item', form.value.buttons);
            editDialogVisible.value = false;
            ElMessage.success('Button updated successfully');
        };
        return {
            formRef,
            form,
            addButton,
            editButton,
            deleteButton,
            editDialogVisible,
            editForm,
            saveEditButton
        };
    },
};
</script>
