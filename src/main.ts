import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { applyTheme, detectSystemTheme, readStoredTheme } from './theme'
import './styles/style.scss'

applyTheme(readStoredTheme() ?? detectSystemTheme())

createApp(App).use(router).mount('#app')
