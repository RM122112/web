<script setup lang="ts">
defineProps<{ title: string; hint?: string }>()
</script>

<template>
  <main class="game-shell">
    <header class="game-shell__header">
      <h1>{{ title }}</h1>
      <slot name="difficulty" />
    </header>
    <div v-if="$slots.status" class="game-shell__status" aria-live="polite">
      <slot name="status" />
    </div>
    <section class="game-shell__board" :aria-label="`${title} Spielbereich`">
      <slot />
      <slot name="overlay" />
    </section>
    <div v-if="$slots.input" class="game-shell__input">
      <slot name="input" />
    </div>
    <p v-if="hint" class="game-shell__hint">{{ hint }}</p>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.game-shell {
  display: flex;
  width: min(100%, $content-width);
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  margin: 0 auto;
  padding: $space-4 $space-3 calc($space-8 + env(safe-area-inset-bottom));
}

.game-shell__header {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.game-shell__header h1 {
  margin: 0;
  font-size: clamp($font-size-xl, 6vw, $font-size-display);
  font-weight: 800;
  letter-spacing: 0.15em;
  text-align: center;
}

.game-shell__status {
  display: flex;
  width: min(100%, $game-width);
  min-height: $target-size;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  font-variant-numeric: tabular-nums;
}

.game-shell__board {
  position: relative;
  width: min(100%, $game-width);
}

.game-shell__input {
  width: min(100%, $game-width);
}

.game-shell__hint {
  margin: 0;
  color: var(--muted);
  font-size: $font-size-sm;
  text-align: center;
}
</style>
