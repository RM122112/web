<script setup lang="ts">
import BaseCard from '@/components/atoms/BaseCard.vue'
</script>

<template>
  <section class="page">
    <h1>Quiz</h1>
    <BaseCard><p>Wähle einen Stapel, um dich abfragen zu lassen.</p></BaseCard>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.page {
  width: min(100%, $content-width);
  margin: 0 auto;
  padding: $space-4;
}

h1 {
  margin-top: 0;
  letter-spacing: 0.1em;
}
</style>
