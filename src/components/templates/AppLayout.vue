<script setup lang="ts">
import { RouterLink } from 'vue-router'
import InlineIcon from '@/components/atoms/InlineIcon.vue'
import Mode from '@/components/organisms/Mode.vue'
</script>

<template>
  <div class="app-layout">
    <header class="topbar">
      <RouterLink class="brand" to="/cards">
        <InlineIcon name="cards" />
        <span>Lernkarten</span>
      </RouterLink>
      <Mode />
    </header>
    <div class="app-layout__body">
      <nav class="navigation" aria-label="Hauptnavigation">
        <RouterLink class="navigation__link" active-class="is-active" to="/cards">
          <InlineIcon name="cards" /><span>Karten</span>
        </RouterLink>
        <RouterLink class="navigation__link" active-class="is-active" to="/quiz">
          <InlineIcon name="quiz" /><span>Quiz</span>
        </RouterLink>
        <RouterLink class="navigation__link" active-class="is-active" to="/pdf">
          <InlineIcon name="pdf" /><span>PDF</span>
        </RouterLink>
      </nav>
      <main class="page-content">
        <slot />
      </main>
    </div>
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

.app-layout__body {
  min-width: 0;
}

.navigation {
  position: fixed;
  z-index: 3;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: $border-width solid var(--surface-border);
  padding: $space-1 $space-2 calc($space-1 + env(safe-area-inset-bottom));
  background: var(--nav-bg);
}

.navigation__link {
  display: flex;
  min-height: $target-size;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  border-radius: $radius-md;
  color: var(--muted);
  font-size: $font-size-sm;
  text-decoration: none;
}

.navigation__link.is-active {
  color: var(--ink);
  background: var(--nav-active);
  font-weight: 700;
}

.navigation__link:focus-visible {
  @include focus-ring;
}

.page-content {
  min-width: 0;
  padding-bottom: calc($target-size + $space-5 + env(safe-area-inset-bottom));
}

@include respond-to(md) {
  .topbar {
    padding-inline: $space-3;
  }
}

@media (min-width: $breakpoint-nav) {
  .app-layout__body {
    display: grid;
    min-height: calc(100vh - $target-size - $space-4);
    grid-template-columns: 13rem minmax(0, 1fr);
  }

  .navigation {
    position: sticky;
    top: calc($target-size + $space-4);
    bottom: auto;
    display: flex;
    height: calc(100vh - $target-size - $space-4);
    flex-direction: column;
    border: 0;
    padding: $space-4;
  }

  .navigation__link {
    flex-direction: row;
    justify-content: flex-start;
    gap: $space-3;
    padding-inline: $space-3;
    font-size: $font-size-base;
  }

  .page-content {
    padding: $space-4;
  }
}
</style>
