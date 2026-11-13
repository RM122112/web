<script setup lang="ts">
defineProps<{ label: string; forId: string; hint?: string }>()
</script>

<template>
  <div class="form-field">
    <label class="form-field__label" :for="forId">{{ label }}</label>
    <slot />
    <p v-if="hint" class="form-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.form-field {
  display: grid;
  gap: $space-2;
  min-width: 0;
}

.form-field__label {
  font-weight: 650;
}

.form-field__hint {
  margin: 0;
  color: var(--muted);
  font-size: $font-size-sm;
}
</style>
