<template>
  <div class="artist-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>艺人管理</span>
          <el-button type="primary" @click="openCreateArtistModal">
            <el-icon><Plus /></el-icon>
            创建新艺人
          </el-button>
        </div>
      </template>

      <el-table :data="artists" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="artist_name" label="艺人名称" />
        <el-table-column prop="artist_page_key" label="页面Key" />
        <el-table-column prop="main_profile" label="主要简介">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.main_profile"
              :content="scope.row.main_profile"
              placement="top"
              :show-after="500"
            >
              <span class="truncate-text">{{ scope.row.main_profile }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="owner_username" label="所属用户" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editArtist(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="success" size="small" @click="viewLinks(scope.row)">
              <el-icon><Link /></el-icon>
              链接管理
            </el-button>
            <el-button type="danger" size="small" @click="deleteArtist(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑艺人对话框 -->
    <el-dialog
      v-model="showArtistModal"
      :title="isEdit ? '编辑艺人' : '创建新艺人'"
      width="600px"
    >
      <el-form :model="artistForm" label-width="120px" ref="artistFormRef">
        <el-form-item label="艺人名称" required>
          <el-input v-model="artistForm.artist_name" />
        </el-form-item>
        <el-form-item label="页面Key" required>
          <el-input v-model="artistForm.artist_page_key" placeholder="用于访问艺人页面的唯一标识" />
        </el-form-item>
        <el-form-item label="主要简介">
          <el-input
            v-model="artistForm.main_profile"
            type="textarea"
            :rows="3"
            placeholder="艺人的主要简介信息"
          />
        </el-form-item>
        <el-form-item label="次要简介">
          <el-input
            v-model="artistForm.secondary_profile"
            type="textarea"
            :rows="3"
            placeholder="艺人的次要简介信息（可选）"
          />
        </el-form-item>
        <el-form-item label="个人照片" v-if="!isEdit">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handlePhotoUploadSuccess"
            :before-upload="beforeUpload"
            :show-file-list="false"
            :headers="uploadHeaders"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传照片
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png 格式，大小不超过 2MB</div>
            </template>
          </el-upload>
          <div v-if="artistForm.profile_photo_url" class="image-preview">
            <el-image
              :src="`https://sp.srt.pub/images/${artistForm.profile_photo_url}`"
              style="width: 100px; height: 100px;"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="所属用户" v-if="currentUserRole === 'admin'">
          <el-select v-model="artistForm.user_id" placeholder="选择所属用户">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeArtistModal">取消</el-button>
        <el-button type="primary" @click="saveArtist" :loading="saving">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 链接管理对话框 -->
    <el-dialog v-model="showLinksModal" title="艺人链接管理" width="800px">
      <div v-if="selectedArtist">
        <h4>{{ selectedArtist.artist_name }} 的链接</h4>
        <div class="links-section">
          <div class="links-header">
            <span>现有链接</span>
            <el-button type="primary" size="small" @click="addLink">
              <el-icon><Plus /></el-icon>
              添加链接
            </el-button>
          </div>
          <div v-if="links.length > 0" class="links-list">
            <div v-for="(link, index) in links" :key="index" class="link-item">
              <el-input v-model="link.platform" placeholder="平台名称" class="link-input" />
              <el-input v-model="link.url" placeholder="链接地址" class="link-input" />
              <el-button type="danger" size="small" @click="removeLink(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="no-links">
            <el-empty description="暂无链接" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeLinksModal">关闭</el-button>
        <el-button type="primary" @click="saveLinks" :loading="savingLinks">
          保存链接
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus, Edit, Delete, Link, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'ArtistManagement',
  components: {
    Plus,
    Edit,
    Delete,
    Link,
    Upload,
  },
  setup() {
    const artists = ref([]);
    const users = ref([]);
    const loading = ref(false);
    const saving = ref(false);
    const savingLinks = ref(false);
    const showArtistModal = ref(false);
    const showLinksModal = ref(false);
    const isEdit = ref(false);
    const selectedArtist = ref(null);
    const links = ref([]);
    const currentUserRole = ref('user');

    const uploadUrl = ref('/api/upload');
    const uploadHeaders = ref({
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    });

    const artistForm = reactive({
      id: null,
      artist_name: '',
      artist_page_key: '',
      main_profile: '',
      secondary_profile: '',
      profile_photo_url: '',
      user_id: null,
    });

    const fetchArtists = async () => {
      loading.value = true;
      try {
        const response = await fetch('/api/admin/artists', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch artists');
        }

        const data = await response.json();
        artists.value = data;
      } catch (error) {
        ElMessage.error('获取艺人列表失败: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    const fetchUsers = async () => {
      if (currentUserRole.value !== 'admin') return;

      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        users.value = data;
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    const openCreateArtistModal = () => {
      isEdit.value = false;
      Object.assign(artistForm, {
        id: null,
        artist_name: '',
        artist_page_key: '',
        main_profile: '',
        secondary_profile: '',
        profile_photo_url: '',
        user_id: null,
      });
      showArtistModal.value = true;
    };

    const editArtist = (artist) => {
      isEdit.value = true;
      Object.assign(artistForm, artist);
      showArtistModal.value = true;
    };

    const closeArtistModal = () => {
      showArtistModal.value = false;
    };

    const handlePhotoUploadSuccess = (response) => {
      artistForm.profile_photo_url = response.imageUrl;
      ElMessage.success('照片上传成功');
    };

    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        ElMessage.error('只能上传图片文件！');
        return false;
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB！');
        return false;
      }
      return true;
    };

    const saveArtist = async () => {
      try {
        saving.value = true;
        const url = isEdit.value
          ? `/api/artist-profile/${artistForm.id}`
          : '/api/artist-profile';
        const method = isEdit.value ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(artistForm),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '保存失败');
        }

        ElMessage.success(isEdit.value ? '艺人更新成功' : '艺人创建成功');
        closeArtistModal();
        fetchArtists();
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message);
      } finally {
        saving.value = false;
      }
    };

    const deleteArtist = async (artist) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除艺人 "${artist.artist_name}" 吗？此操作不可恢复。`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );

        const response = await fetch(`/api/artist-profile/${artist.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '删除失败');
        }

        ElMessage.success('艺人删除成功');
        fetchArtists();
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + error.message);
        }
      }
    };

    const viewLinks = async (artist) => {
      selectedArtist.value = artist;
      try {
        const response = await fetch(`/api/artist-links/${artist.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          links.value = await response.json();
        } else {
          links.value = [];
        }
        showLinksModal.value = true;
      } catch (error) {
        ElMessage.error('获取链接失败: ' + error.message);
      }
    };

    const closeLinksModal = () => {
      showLinksModal.value = false;
      links.value = [];
    };

    const addLink = () => {
      links.value.push({ platform: '', url: '' });
    };

    const removeLink = (index) => {
      links.value.splice(index, 1);
    };

    const saveLinks = async () => {
      try {
        savingLinks.value = true;
        const response = await fetch(`/api/artist-links/${selectedArtist.value.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ links: links.value }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '保存链接失败');
        }

        ElMessage.success('链接保存成功');
        closeLinksModal();
      } catch (error) {
        ElMessage.error('保存链接失败: ' + error.message);
      } finally {
        savingLinks.value = false;
      }
    };

    onMounted(() => {
      // Get current user role
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserRole.value = payload.role || 'user';
      }

      fetchArtists();
      fetchUsers();
    });

    return {
      artists,
      users,
      loading,
      saving,
      savingLinks,
      showArtistModal,
      showLinksModal,
      isEdit,
      selectedArtist,
      links,
      artistForm,
      uploadUrl,
      uploadHeaders,
      currentUserRole,
      openCreateArtistModal,
      editArtist,
      closeArtistModal,
      handlePhotoUploadSuccess,
      beforeUpload,
      saveArtist,
      deleteArtist,
      viewLinks,
      closeLinksModal,
      addLink,
      removeLink,
      saveLinks,
    };
  },
};
</script>

<style scoped>
.artist-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.truncate-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview {
  margin-top: 10px;
}

.links-section {
  margin-top: 20px;
}

.links-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.link-input {
  flex: 1;
}

.no-links {
  padding: 40px 0;
}
</style>