<script setup lang="ts">
withDefaults(defineProps<{
  name: 'sun' | 'moon' | 'clock' | 'pause' | 'play' | 'game'
  size?: number
}>(), { size: 20 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'pause'">
      <path d="M9 5v14m6-14v14" />
    </template>
    <template v-else-if="name === 'play'">
      <path d="m8 5 12 7-12 7z" />
    </template>
    <template v-else>
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 8h3v3H8zm5 0h3v3h-3zm-5 5h3v3H8zm5 0h3v3h-3z" />
    </template>
  </svg>
</template>
