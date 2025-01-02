import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; 
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircleDown } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faPlay, faCircleDown);

const app = createApp(App);

app.component('font-awesome-icon', FontAwesomeIcon);
app.use(router); 
app.use(ElementPlus);

 for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
 }
app.mount('#app');
