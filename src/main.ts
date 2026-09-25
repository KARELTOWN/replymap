import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// This application only serves the sign-in screen. It still loaded the
// stylesheets and plugins inherited from the dashboard: charts, carousel, date
// picker, vector maps and the rrweb session player, none of them used here.
const app = createApp(App)

app.use(router)
app.use(createPinia())

app.mount('#app')
