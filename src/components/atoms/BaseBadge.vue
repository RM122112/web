<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'accent' | 'error' }>(), { tone: 'neutral' })
</script>

<template>
  <span class="base-badge" :class="`base-badge--${tone}`"><slot /></span>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.base-badge {
  display: inline-flex;
  min-height: $space-6;
  align-items: center;
  border-radius: $radius-sm;
  padding: 0 $space-2;
  color: var(--ink);
  background: var(--peer);
  font-size: $font-size-sm;
  font-weight: 700;
}

.base-badge--accent {
  color: var(--ink);
  background: var(--same);
}

.base-badge--error {
  color: var(--error);
  background: var(--error-bg);
}
</style>
