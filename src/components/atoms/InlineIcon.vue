<script setup lang="ts">
withDefaults(defineProps<{
  name: 'sun' | 'moon' | 'book' | 'pdf' | 'cards' | 'quiz' | 'search' | 'arrow-left' | 'arrow-right' | 'upload' | 'download' | 'trash' | 'edit' | 'check'
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
    <template v-else-if="name === 'book' || name === 'cards'">
      <rect x="4" y="5" width="13" height="16" rx="2" /><path d="M8 3h10a2 2 0 0 1 2 2v13M7 10h7m-7 4h7" />
    </template>
    <template v-else-if="name === 'pdf'">
      <path d="M6 2h8l5 5v15H6zM14 2v5h5M8 14h2a2 2 0 0 0 0-4H8v7m6-7v7h2a3.5 3.5 0 0 0 0-7z" />
    </template>
    <template v-else-if="name === 'quiz'">
      <circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 2.7m0 3h.01" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" />
    </template>
    <template v-else-if="name === 'arrow-left'">
      <path d="m14 5-7 7 7 7M7 12h14" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="m10 5 7 7-7 7m7-7H3" />
    </template>
    <template v-else-if="name === 'upload'">
      <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M12 4v12m-5-5 5 5 5-5M4 16v4h16v-4" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4zM14.8 5.7l3.5 3.5" />
    </template>
    <template v-else>
      <path d="m5 12 4 4L19 6" />
    </template>
  </svg>
</template>
