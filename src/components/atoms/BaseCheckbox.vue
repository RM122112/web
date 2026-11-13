<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ modelValue?: boolean; disabled?: boolean }>(), {
  modelValue: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const checked = computed(() => props.modelValue)
</script>

<template>
  <input
    class="base-checkbox"
    type="checkbox"
    :checked="checked"
    :disabled="disabled"
    @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
  />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.base-checkbox {
  width: $space-4;
  height: $space-4;
  accent-color: var(--accent);
}

.base-checkbox:focus-visible {
  @include focus-ring;
}
</style>
