import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/style.scss'

const storedTheme = localStorage.getItem('denkspiele-theme')
if (storedTheme === 'dark' || storedTheme === 'light') {
  document.documentElement.classList.toggle('my-app-dark', storedTheme === 'dark')
  document.documentElement.classList.toggle('my-app-light', storedTheme === 'light')
}

createApp(App).use(router).mount('#app')
