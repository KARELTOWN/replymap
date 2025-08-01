import './assets/main.css'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'jsvectormap/dist/jsvectormap.css'
import 'flatpickr/dist/flatpickr.css'
import 'rrweb-player/dist/style.css';
import { createPinia } from 'pinia'

import flatPickr from 'vue-flatpickr-component'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)
app.use(VueApexCharts)

app.component('flat-pickr', flatPickr)

app.mount('#app')
