<script setup lang="ts">
import BaseCard from '@/components/atoms/BaseCard.vue'
import BaseBadge from '@/components/atoms/BaseBadge.vue'

defineProps<{ title: string; description: string }>()
</script>

<template>
  <section class="section-page">
    <BaseCard>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <BaseBadge tone="accent">Wird in einer späteren Ausbaustufe ergänzt</BaseBadge>
    </BaseCard>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.section-page {
  width: min(100%, $content-width);
  margin: 0 auto;
  padding: $space-4;
}

h1 {
  margin-top: 0;
  letter-spacing: 0.1em;
}
</style>
