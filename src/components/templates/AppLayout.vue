<script setup lang="ts">
import { RouterLink } from 'vue-router'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import Mode from '@/components/organisms/Mode.vue'
</script>

<template>
  <div class="app-layout">
    <header class="topbar">
      <RouterLink class="brand" to="/games">
        <InlineIcon name="game" />
        <span>Denkspiele</span>
      </RouterLink>
      <Mode />
    </header>
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.app-layout {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  min-height: $target-size;
  align-items: center;
  justify-content: space-between;
  border-bottom: $border-width solid var(--surface-border);
  padding: $space-2 $space-4;
  background: var(--bg);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: var(--ink);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-decoration: none;
}

.page-content {
  min-width: 0;
  padding: $space-4;
}

@include respond-to(md) {
  .topbar {
    padding-inline: $space-3;
  }
  .page-content {
    padding: $space-4 $space-3;
  }
}
</style>
