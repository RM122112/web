<script setup lang="ts">
import GameCard from '@/components/molecules/GameCard.vue'
import { games } from '@/data/games'
</script>

<template>
  <section class="games-home">
    <header class="page-heading">
      <p class="eyebrow">Denkspiele</p>
      <h1>Welches Spiel spielst du?</h1>
    </header>
    <div class="game-grid">
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.games-home {
  width: min(100%, $content-width);
  margin: 0 auto;
  padding: $space-4;
}

.page-heading {
  margin-bottom: $space-5;
}

.eyebrow {
  margin: 0 0 $space-2;
  color: var(--muted);
  font-size: $font-size-sm;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp($font-size-xl, 5vw, $font-size-display);
  letter-spacing: 0.06em;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: $space-4;
}
</style>
