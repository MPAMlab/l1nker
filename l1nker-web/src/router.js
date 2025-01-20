import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/FrontEnd/HomePage.vue';
import AdminPage from './components/Admin/AdminPage.vue';
import LoginPage from './components/Admin/LoginPage.vue';
import AdminItemEdit from './components/Admin/AdminComponents/ItemManagement.vue';
import AdminUserManagement from './components/Admin/AdminComponents/UserManagement.vue';

const routes = [
    { path: '/', component: HomePage },
    {
        path: '/admin',
        name: 'Admin', // Added name for easier referencing
        component: AdminPage,
        meta: { requiresAuth: true },
        children: [
            {
                path: 'items', // Removed leading slash
                name: 'AdminItems',
                component: AdminItemEdit,
            },
            {
                path: 'users', // Removed leading slash
                name: 'AdminUsers',
                component: AdminUserManagement,
            },
        ],
    },
    {
        path: '/admin/item/:id', // 新增路由
        name: 'AdminItemManagement',
        component: AdminItemEdit,
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
