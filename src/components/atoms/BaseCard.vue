<template>
  <article class="base-card"><slot /></article>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.base-card {
  @include card-surface;
  min-width: 0;
}
</style>
