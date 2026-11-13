<template>
  <div class="button-group" role="group"><slot /></div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.button-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-2;
}
</style>
