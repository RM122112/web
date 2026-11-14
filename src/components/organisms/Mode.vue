<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import {
  applyTheme,
  detectSystemTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
  type ThemeName,
} from '@/theme'

const prefersDark = ref(false)
const darkMode = ref(false)

const label = computed(() => darkMode.value ? 'Helles Theme aktivieren' : 'Dunkles Theme aktivieren')

function toggleTheme(): void {
  darkMode.value = !darkMode.value
  const nextTheme: ThemeName = darkMode.value ? 'dark' : 'light'
  applyTheme(nextTheme)
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
}

let mediaQuery: MediaQueryList | undefined
function onSystemThemeChange(event: MediaQueryListEvent): void {
  prefersDark.value = event.matches
  if (readStoredTheme() === null) {
    darkMode.value = event.matches
    applyTheme(event.matches ? 'dark' : 'light')
  }
}

onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  prefersDark.value = detectSystemTheme() === 'dark'
  const choice = readStoredTheme()
  darkMode.value = choice === 'dark' || (choice === null && prefersDark.value)
  applyTheme(darkMode.value ? 'dark' : 'light')
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
