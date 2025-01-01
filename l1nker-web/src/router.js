import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import AdminPage from './components/AdminPage.vue';
import LoginPage from './components/LoginPage.vue';

const routes = [
    { path: '/', component: HomePage },
    { path: '/admin', component: AdminPage, meta: { requiresAuth: true } }, 
    { path: '/login', component: LoginPage },
    { path: '/:redirectKey', component: HomePage } 
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('authToken');
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

   if (requiresAuth && !isAuthenticated) {
     next('/login')
   } else {
      next();
   }
});

export default router;
