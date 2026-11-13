<script setup lang="ts">
import { useAttrs, watchEffect } from 'vue'

defineOptions({ inheritAttrs: true })

withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  active?: boolean
  iconOnly?: boolean
  stacked?: boolean
  block?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
  active: undefined,
  iconOnly: false,
  stacked: false,
  block: false,
})

const attrs = useAttrs()

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (attrs['aria-label'] == null && attrs['aria-labelledby'] == null) {
      console.warn('BaseButton mit iconOnly benötigt ein aria-label.')
    }
  })
}
</script>

<template>
  <button
    :type="type"
    :aria-pressed="active"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'is-active': active, 'is-icon-only': iconOnly, 'is-stacked': stacked, 'is-block': block },
    ]"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.base-button {
  display: inline-flex;
  min-height: $target-size;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  border: $border-width solid var(--surface-border);
  border-radius: $radius-md;
  padding: 0 $space-4;
  color: var(--ink);
  background: var(--paper);
  font-weight: 650;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color 0.15s, border-color 0.15s, transform 0.15s;
}

.base-button:hover:not(:disabled) {
  border-color: var(--ink);
}

.base-button:active:not(:disabled) {
  transform: translateY(1px);
}

.base-button:focus-visible {
  @include focus-ring;
}

.base-button--primary {
  border-color: var(--accent);
  color: var(--paper);
  background: var(--accent);
}

.base-button--primary:hover:not(:disabled) {
  border-color: var(--ink);
}

.base-button--secondary.is-active,
.base-button--secondary[aria-pressed='true'] {
  border-color: var(--ink);
  color: var(--paper);
  background: var(--ink);
}

.base-button--ghost {
  border-color: transparent;
  background: transparent;
}

.base-button--sm {
  min-height: $target-size;
  padding-inline: $space-3;
  font-size: $font-size-sm;
}

.base-button--lg {
  min-height: $target-size;
  padding-inline: $space-5;
  font-size: $font-size-lg;
}

.base-button.is-icon-only {
  width: $target-size;
  padding: 0;
}

.base-button.is-stacked {
  flex-direction: column;
}

.base-button.is-block {
  width: 100%;
}
</style>
