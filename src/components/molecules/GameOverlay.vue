<script setup lang="ts">
withDefaults(defineProps<{ visible?: boolean; tone?: 'neutral' | 'success' }>(), {
  visible: true,
  tone: 'neutral',
})
</script>

<template>
  <div v-if="visible" class="game-overlay" :class="`game-overlay--${tone}`" role="status" aria-live="polite">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.game-overlay {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  border-radius: $radius-md;
  padding: $space-4;
  text-align: center;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur($space-1);
}

.game-overlay--success {
  background: color-mix(in srgb, var(--same) 88%, transparent);
}
</style>
