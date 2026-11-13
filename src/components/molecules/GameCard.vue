<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseCard from '@/components/atoms/BaseCard.vue'
import type { GameInfo } from '@/data/games'

defineProps<{ game: GameInfo }>()
</script>

<template>
  <RouterLink class="game-link" :to="`/games/${game.id}`">
    <BaseCard>
      <img class="game-image" :src="game.thumbnail" alt="" />
      <h2>{{ game.title }}</h2>
    </BaseCard>
  </RouterLink>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts' as *;

.game-link {
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.game-link:focus-visible {
  @include focus-ring;
  border-radius: $radius-md;
}

.game-image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: $radius-sm;
  object-fit: cover;
  background: var(--peer);
}

h2 {
  margin: $space-3 0 0;
  font-size: $font-size-lg;
}
</style>
