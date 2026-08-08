import { createRouter, createWebHistory } from 'vue-router';
import Home from './components/Home.vue';
import NotFound from './components/NotFound.vue';
import HomePage from './components/FrontEnd/HomePage.vue';
import ArtistPage from './components/ArtistPage.vue';
import AdminPage from './components/Admin/AdminPage.vue';
import LoginPage from './components/Admin/LoginPage.vue';
import OAuthCallback from './components/Admin/OAuthCallback.vue';
import AdminItemList from './components/Admin/AdminComponents/ItemList.vue';
import AdminItemEdit from './components/Admin/AdminComponents/ItemManagement.vue';
import AdminUserManagement from './components/Admin/AdminComponents/UserManagement.vue';
import { isAuthenticated, ensureFreshToken } from './utils/oauth';

const routes = [
    { path: '/', component: Home },
    { path: '/404', component: NotFound },
    {
        path: '/admin',
        name: 'Admin',
        component: AdminPage,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'AdminItemList',
                component: AdminItemList,
            },
            {
                path: 'item/:id',
                name: 'AdminItemManagement',
                component: AdminItemEdit,
            },
        ],
    },
    { path: '/login', component: LoginPage },
    { path: '/oauth/callback', component: OAuthCallback },
    { path: '/artist/:artistKey', component: ArtistPage },
    { path: '/:redirectKey', component: HomePage },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requiresAuth) {
        if (!isAuthenticated()) {
            next('/login');
            return;
        }
        // Proactively refresh the token if it is near expiry.
        const fresh = await ensureFreshToken();
        if (!fresh) return; // ensureFreshToken redirects on failure
        next();
    } else if (to.path === '/login' && isAuthenticated()) {
        next('/admin');
    } else {
        next();
    }
});

export default router;
