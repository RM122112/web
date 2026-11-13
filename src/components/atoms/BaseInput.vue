<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  inputmode?: 'text' | 'numeric' | 'decimal' | 'search' | 'email'
  min?: number | string
  max?: number | string
  maxlength?: number | string
  autocomplete?: string
}>(), { modelValue: '', type: 'text' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const inputValue = computed(() => props.modelValue)
</script>

<template>
  <input
    class="base-input"
    :value="inputValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :inputmode="inputmode"
    :min="min"
    :max="max"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.base-input {
  width: 100%;
  min-height: $target-size;
  border: $border-width solid var(--surface-border);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  color: var(--ink);
  background: var(--paper);
}

.base-input:focus-visible {
  @include focus-ring;
}
</style>
