import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import { initDb } from './db'
import './style.css'

const app = createApp(App)
app.use(router)

async function bootstrap() {
  await initDb()
  app.mount('#app')
}
bootstrap()