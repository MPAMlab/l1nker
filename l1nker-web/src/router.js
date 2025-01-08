import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/FrontEnd/HomePage.vue';
import AdminPage from './components/Admin/AdminPage.vue';
import LoginPage from './components/Admin/LoginPage.vue';
import AdminItemEdit from './components/Admin/AdminComponents/ItemManagement.vue';
import AdminUserManagement from './components/Admin/AdminComponents/UserManagement.vue';
import EditPanel from './components/Admin/EditPanel.vue';  // 导入 EditPanel 组件

const routes = [
  { path: '/', component: HomePage },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    meta: { requiresAuth: true },
     children: [
        {
          path: 'items',
          name: 'AdminItems',
          component: AdminItemEdit,
        },
        {
          path: 'users',
          name: 'AdminUsers',
          component: AdminUserManagement,
        },
      ],
  },
  {
    path: '/admin/edit/:id',   // 添加 EditPanel 的路由
    name: 'EditPanel',
    component: EditPanel,
    meta: { requiresAuth: true },
  },
  { path: '/login', component: LoginPage },
  { path: '/:redirectKey', component: HomePage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
