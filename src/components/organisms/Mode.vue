<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'

const STORAGE_KEY = 'lernkarten-theme'
const prefersDark = ref(false)
const darkMode = ref(false)

function applyTheme(isDark: boolean): void {
  const root = document.documentElement
  root.classList.toggle('my-app-dark', isDark)
  root.classList.toggle('my-app-light', !isDark)
}

const label = computed(() => darkMode.value ? 'Helles Theme aktivieren' : 'Dunkles Theme aktivieren')

function toggleTheme(): void {
  darkMode.value = !darkMode.value
  applyTheme(darkMode.value)
  localStorage.setItem(STORAGE_KEY, darkMode.value ? 'dark' : 'light')
}

let mediaQuery: MediaQueryList | undefined
function onSystemThemeChange(event: MediaQueryListEvent): void {
  prefersDark.value = event.matches
  if (localStorage.getItem(STORAGE_KEY) === null) {
    darkMode.value = event.matches
    applyTheme(event.matches)
  }
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  prefersDark.value = mediaQuery.matches
  const choice = localStorage.getItem(STORAGE_KEY)
  darkMode.value = choice === 'dark' || (choice === null && prefersDark.value)
  applyTheme(darkMode.value)
  mediaQuery.addEventListener('change', onSystemThemeChange)
})

onUnmounted(() => mediaQuery?.removeEventListener('change', onSystemThemeChange))
</script>

<template>
  <BaseButton
    variant="ghost"
    size="sm"
    icon-only
    :aria-label="label"
    @click="toggleTheme"
  >
    <InlineIcon :name="darkMode ? 'sun' : 'moon'" />
  </BaseButton>
</template>
