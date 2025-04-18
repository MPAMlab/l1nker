import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: '/',
    server:{
       proxy: {
        '/api': 'http://localhost:8787'
    }
    }
})